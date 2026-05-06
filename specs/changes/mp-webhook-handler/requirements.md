# Requirements

## Overview

The Semeando Devs platform uses Mercado Pago's `/preapproval` API to handle recurring subscriptions. After the initial subscription is created, all subsequent charges (monthly or yearly renewals) are processed automatically by Mercado Pago's servers without any action from the platform. However, the platform currently has no mechanism to receive notifications about these asynchronous payment events — successful renewals, failed charges, or subscription cancellations are all invisible to the system.

To close this gap, the platform needs a Webhook receiver that listens to Mercado Pago's real-time event notifications and translates them into database state changes. This ensures the `subscriptions` table and `profiles` table always reflect the true billing status of each subscriber without any manual intervention.

The scope covers: creating a Supabase Edge Function to act as the webhook endpoint, validating incoming events from Mercado Pago, updating subscription status on payment success and cancellation, revoking Pro access when a subscription lapses, and recording a billing history for auditability. It does not cover refund flows or prorated upgrades/downgrades between plans.

## Glossary

| Term | Definition |
|------|------------|
| Webhook | An HTTP POST request sent by Mercado Pago to a platform-configured URL whenever a payment lifecycle event occurs. |
| Preapproval | A Mercado Pago recurring subscription object identified by a `preapproval_id`; it governs automatic monthly or yearly charges. |
| Authorized Payment | A payment within a preapproval that was successfully charged to the subscriber's card. |
| Subscription Status | The current state of a subscriber's record in the `subscriptions` table (`pending`, `active`, `cancelled`, `payment_failed`). |
| Pro Access | The `is_pro = true` flag on a user's `profiles` row, granting access to premium platform content. |
| Billing Event | A row in the `subscription_billing_events` table recording each Mercado Pago notification received, its type, and its processing outcome. |
| Signature Validation | The process of verifying that an incoming webhook request was genuinely sent by Mercado Pago using a shared secret (x-signature header). |

## Assumptions

- Mercado Pago sends webhook notifications for `subscription_authorized_payment` and `subscription_preapproval` topics.
- The platform's Mercado Pago integration uses `preapproval_id` as the stable external reference linking MP subscriptions to the `subscriptions` table.
- The `subscriptions` table's `status` column accepts the values: `pending`, `active`, `cancelled`, `payment_failed`.
- Signature validation uses the webhook secret configured in the Mercado Pago dashboard and stored in the `MP_WEBHOOK_SECRET` environment variable.
- A new `subscription_billing_events` table will be created to store billing history; it does not yet exist.
- The `profiles.is_pro` flag is the single source of truth for gating Pro features in the frontend.
- PIX payments result in a one-time charge (not a preapproval), so their webhook events update only the corresponding `subscriptions` row, not a preapproval record.

## Requirements

### REQ-1: Webhook Endpoint Creation

**User Story:** As a platform operator, I want Mercado Pago to notify our system whenever a payment event occurs, so that subscription state is always up to date without manual checks.

#### Acceptance Criteria

1.1 THE webhook system SHALL expose a publicly accessible HTTP POST endpoint at the `/mp-webhook` Supabase Edge Function path.

1.2 WHEN Mercado Pago sends a preflight OPTIONS request, THEN the webhook system SHALL respond with status 200 and the appropriate CORS headers.

1.3 WHEN the endpoint receives a request with an HTTP method other than POST or OPTIONS, THEN the webhook system SHALL respond with status 405.

### REQ-2: Signature Validation

**User Story:** As a platform operator, I want every incoming webhook request to be validated against a Mercado Pago signature, so that only authentic events from Mercado Pago can mutate subscription state.

#### Acceptance Criteria

2.1 WHEN a POST request arrives without an `x-signature` header or without an `x-request-id` header, THEN the webhook system SHALL reject the request with status 400 and not process the payload.

2.2 WHEN a POST request's HMAC-SHA256 signature computed from the request body and the `MP_WEBHOOK_SECRET` does not match the value in the `x-signature` header, THEN the webhook system SHALL reject the request with status 401 and not process the payload.

2.3 WHEN a POST request passes signature validation, THEN the webhook system SHALL proceed to process the event payload.

### REQ-3: Authorized Payment Processing

**User Story:** As a subscriber, I want my Pro access to remain active after each successful automatic renewal, so that I can continue using premium content without interruption.

#### Acceptance Criteria

3.1 WHEN the webhook system receives a `subscription_authorized_payment` event with a `status` of `approved`, THEN the webhook system SHALL update the matching `subscriptions` row status to `active`.

3.2 WHEN the webhook system receives a `subscription_authorized_payment` event with a `status` of `approved`, THEN the webhook system SHALL set `profiles.is_pro = true` for the subscriber.

3.3 WHEN the webhook system processes a `subscription_authorized_payment` event and no subscription is found matching the preapproval ID, THEN the webhook system SHALL record an error billing event and respond with status 200 to prevent Mercado Pago from retrying.

3.4 WHEN a `subscription_authorized_payment` event has a `status` other than `approved` (e.g., `rejected`), THEN the webhook system SHALL update the matching `subscriptions` row status to `payment_failed`.

3.5 WHEN a `subscription_authorized_payment` event has a `status` of `rejected`, THEN the webhook system SHALL set `profiles.is_pro = false` for the subscriber.

### REQ-4: Subscription Cancellation Processing

**User Story:** As a platform operator, I want the system to revoke Pro access automatically when a subscription is cancelled or lapses, so that cancelled users cannot continue consuming premium content.

#### Acceptance Criteria

4.1 WHEN the webhook system receives a `subscription_preapproval` event with a preapproval `status` of `cancelled`, THEN the webhook system SHALL update the matching `subscriptions` row status to `cancelled`.

4.2 WHEN the webhook system receives a `subscription_preapproval` event with a preapproval `status` of `cancelled`, THEN the webhook system SHALL set `profiles.is_pro = false` for the subscriber.

4.3 WHEN the webhook system receives a `subscription_preapproval` event with a preapproval `status` of `paused`, THEN the webhook system SHALL update the matching `subscriptions` row status to `payment_failed` and set `profiles.is_pro = false`.

### REQ-5: Billing Event Audit Log

**User Story:** As a platform operator, I want every webhook notification to be recorded in a billing history table, so that I can audit payment events, debug issues, and reconcile charges.

#### Acceptance Criteria

5.1 WHEN the webhook system receives any POST request that passes signature validation, THEN the webhook system SHALL insert a row into `subscription_billing_events` recording the event topic, MP event ID, raw payload, and processing status.

5.2 WHEN processing a webhook event fails due to a database error, THEN the webhook system SHALL update the corresponding `subscription_billing_events` row with a `failed` status and the error message.

5.3 THE `subscription_billing_events` table SHALL store the fields: `id`, `subscription_id` (nullable), `mp_event_id`, `topic`, `payload`, `status`, and `created_at`.

### REQ-6: Idempotent Event Processing

**User Story:** As a platform operator, I want duplicate webhook deliveries to be safely ignored, so that retried notifications from Mercado Pago do not corrupt subscription state.

#### Acceptance Criteria

6.1 WHEN the webhook system receives an event whose `mp_event_id` already exists in `subscription_billing_events`, THEN the webhook system SHALL respond with status 200 without reprocessing the event.

6.2 THE webhook system SHALL respond with status 200 for all successfully received events, including duplicates, so that Mercado Pago does not queue retries for already-handled notifications.
