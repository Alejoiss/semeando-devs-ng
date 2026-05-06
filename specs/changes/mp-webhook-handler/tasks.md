# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database Foundation** - Migration, schema changes, and audit table
2. **Edge Function Skeleton** - Entry point, routing, and signature validation
3. **Event Handlers** - Authorized payment and preapproval status change logic
4. **Billing Event & Idempotency** - Audit log insert/update and duplicate guard
5. **Acceptance Criteria Testing** - Verify all requirement behaviors
6. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (2-3 sessions)

---

## Phase 1: Database Foundation

- [x] 1.1 Update `subscriptions` status check constraint
  - Create a migration that drops the existing `status` check constraint on `subscriptions` and re-adds it to allow `payment_failed` alongside `pending`, `active`, and `cancelled`, all within a single transaction.
  - _Implements: DES-5, REQ-3.4, REQ-4.3_

- [x] 1.2 Create `subscription_billing_events` table
  - Add a migration that creates the `subscription_billing_events` table with columns: `id` (uuid PK), `subscription_id` (uuid nullable FK → subscriptions), `mp_event_id` (text unique not null), `topic` (text not null), `payload` (jsonb), `status` (text not null), `error_message` (text nullable), `created_at` (timestamptz default now()); enable RLS; add a service-role-only policy for inserts and updates.
  - _Depends: 1.1_
  - _Implements: DES-5, REQ-5.3_

---

## Phase 2: Edge Function Skeleton

- [x] 2.1 Scaffold `mp-webhook` Edge Function directory and entry point
  - Create `supabase/functions/mp-webhook/index.ts` with the Deno `serve` handler, shared `corsHeaders`, OPTIONS preflight response (200), and a 405 fallback for non-POST methods. The POST branch should read the raw body as text (not JSON) and call the signature validator before any further processing.
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 2.2 Implement HMAC-SHA256 signature validator in `index.ts`
  - Within the POST handler, read the `x-signature` and `x-request-id` headers; return 400 if either is absent. Compute the HMAC-SHA256 of the raw body string using `MP_WEBHOOK_SECRET` via the Web Crypto API. Compare the computed digest against the value in `x-signature`; return 401 on mismatch. Return the validated raw body string on success for downstream JSON parsing.
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 2.3 Add event topic routing in `index.ts`
  - After signature validation, parse the raw body as JSON. Route the event to `handleAuthorizedPayment` (from `handlers.ts`) when `topic === 'subscription_authorized_payment'`, to `handlePreapproval` when `topic === 'subscription_preapproval'`, and log and return 200 for all other unknown topics. All branches must return HTTP 200 after processing.
  - _Depends: 2.2_
  - _Implements: DES-1, REQ-6.2_

---

## Phase 3: Event Handlers

- [x] 3.1 Create `billing-events.ts` with `insertBillingEvent` and `updateBillingEvent` utilities
  - Create `supabase/functions/mp-webhook/billing-events.ts` exporting: `insertBillingEvent(client, { mpEventId, topic, payload })` which inserts a row with `status = 'processing'` and returns the inserted row id or throws a unique-constraint error for duplicates; `updateBillingEvent(client, id, { status, subscriptionId?, errorMessage? })` which updates the row after processing.
  - _Depends: 1.2_
  - _Implements: DES-5, REQ-5.1, REQ-5.2_

- [x] 3.2 Add idempotency guard using unique constraint on `mp_event_id`
  - In the `insertBillingEvent` utility, detect a PostgreSQL unique-violation error (code `23505`) from the insert and return a sentinel value (e.g. `{ duplicate: true }`) to the caller. The calling handler must check for this sentinel and return 200 immediately without further DB mutations.
  - _Depends: 3.1_
  - _Implements: DES-5, REQ-6.1, REQ-6.2_

- [x] 3.3 Implement `handleAuthorizedPayment` in `handlers.ts`
  - Create `supabase/functions/mp-webhook/handlers.ts` exporting `handleAuthorizedPayment(client, event, mlToken)`. The function should: call `insertBillingEvent` (returning early on duplicate); fetch the payment object from `GET https://api.mercadopago.com/v1/payments/{event.data.id}` using `mlToken`; extract `preapproval_id` from the response; look up the `subscriptions` row by `mp_preapproval_id`; if not found, update billing event to `orphan` and return; if `payment.status === 'approved'`, update `subscriptions.status = 'active'` and `profiles.is_pro = true`; otherwise update `subscriptions.status = 'payment_failed'` and `profiles.is_pro = false`; finally update the billing event to `success` with the resolved `subscription_id`.
  - _Depends: 3.2_
  - _Implements: DES-3, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5_

- [x] 3.4 Implement `handlePreapproval` in `handlers.ts`
  - Add `handlePreapproval(client, event, mlToken)` to `handlers.ts`. The function should: call `insertBillingEvent` (returning early on duplicate); fetch the preapproval object from `GET https://api.mercadopago.com/preapproval/{event.data.id}` using `mlToken`; look up the `subscriptions` row by `mp_preapproval_id`; if not found, update billing event to `orphan` and return; if `preapproval.status === 'cancelled'`, update `subscriptions.status = 'cancelled'` and `profiles.is_pro = false`; if `preapproval.status === 'paused'`, update `subscriptions.status = 'payment_failed'` and `profiles.is_pro = false`; for all other statuses, update billing event to `success` (informational) without touching profiles; always update billing event to `success` at the end of a handled state.
  - _Depends: 3.2_
  - _Implements: DES-4, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 3.5 Add error wrapping around handler calls in `index.ts`
  - Wrap each handler call in a try/catch in `index.ts`. On error, call `updateBillingEvent` with `status = 'failed'` and the error message. Always resolve with an HTTP 200 response after the catch block so Mercado Pago does not queue retries for events that produced internal errors.
  - _Depends: 3.3, 3.4_
  - _Implements: DES-1, DES-5, REQ-5.2, REQ-6.2_

- [x] 3.6 Add `MP_WEBHOOK_SECRET` to local `.env` and document required env vars
  - Add a placeholder `MP_WEBHOOK_SECRET=<value_from_mp_dashboard>` entry to the project `.env` file (and `.env.example` if it exists). Confirm `ML_ACCESS_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are already present.
  - _Depends: 2.2_
  - _Implements: DES-2_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: endpoint responds correctly to OPTIONS and non-POST methods
  - Using `curl` against the locally served function, send an OPTIONS request and confirm a 200 response with CORS headers. Send a GET request and confirm a 405 response.
  - Test type: integration
  - _Implements: REQ-1.2, REQ-1.3_

- [x] 4.2 Test: reject requests with missing signature headers
  - Send a POST without the `x-signature` header and confirm a 400 response. Send a POST without the `x-request-id` header and confirm a 400 response.
  - Test type: integration
  - _Implements: REQ-2.1_

- [x] 4.3 Test: reject requests with invalid signature
  - Send a POST with a syntactically valid but incorrect `x-signature` value and confirm a 401 response and that no rows are inserted into `subscription_billing_events`.
  - Test type: integration
  - _Implements: REQ-2.2_

- [x] 4.4 Test: approved payment activates subscription and grants Pro access
  - Simulate a `subscription_authorized_payment` webhook with a valid signature where the fetched payment status is `approved`. Confirm `subscriptions.status` is set to `active`, `profiles.is_pro` is set to `true`, and a `success` billing event row is created.
  - Test type: integration
  - _Implements: REQ-2.3, REQ-3.1, REQ-3.2, REQ-5.1_

- [x] 4.5 Test: rejected payment sets payment_failed status and revokes Pro access
  - Simulate a `subscription_authorized_payment` webhook where the fetched payment status is `rejected`. Confirm `subscriptions.status` is set to `payment_failed` and `profiles.is_pro` is set to `false`.
  - Test type: integration
  - _Implements: REQ-3.4, REQ-3.5_

- [x] 4.6 Test: orphaned payment event is logged without mutating subscription state
  - Simulate a `subscription_authorized_payment` webhook where no subscription row matches the extracted `preapproval_id`. Confirm the response is 200 and a billing event with status `orphan` is recorded.
  - Test type: integration
  - _Implements: REQ-3.3_

- [x] 4.7 Test: cancelled preapproval revokes subscription and Pro access
  - Simulate a `subscription_preapproval` webhook where the fetched preapproval status is `cancelled`. Confirm `subscriptions.status` is set to `cancelled` and `profiles.is_pro` is set to `false`.
  - Test type: integration
  - _Implements: REQ-4.1, REQ-4.2_

- [x] 4.8 Test: paused preapproval sets payment_failed and revokes Pro access
  - Simulate a `subscription_preapproval` webhook where the fetched preapproval status is `paused`. Confirm `subscriptions.status` is set to `payment_failed` and `profiles.is_pro` is set to `false`.
  - Test type: integration
  - _Implements: REQ-4.3_

- [x] 4.9 Test: billing event is recorded for every valid event
  - After each of the scenarios in 4.4–4.8, confirm that a `subscription_billing_events` row exists containing the correct `mp_event_id`, `topic`, `payload`, and final `status`.
  - Test type: integration
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.3_

- [x] 4.10 Test: duplicate event delivery is safely absorbed
  - Send an identical valid webhook payload twice with the same `mp_event_id`. Confirm the second delivery returns 200 without creating a second billing event row and without mutating the subscription or profile rows a second time.
  - Test type: integration
  - _Implements: REQ-6.1, REQ-6.2_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm the `/mp-webhook` endpoint handles OPTIONS, POST, and invalid method requests correctly.
  - REQ-2: Confirm signature validation rejects missing or invalid headers and allows valid ones.
  - REQ-3: Confirm authorized payment events correctly update subscription status and Pro access in both approve and reject cases, and handle orphaned events gracefully.
  - REQ-4: Confirm preapproval events for `cancelled` and `paused` correctly revoke Pro access and set the appropriate subscription status.
  - REQ-5: Confirm every validated event produces a billing event row with the correct fields.
  - REQ-6: Confirm duplicate events are absorbed without re-processing.
  - Run a final `npx supabase db up` to confirm all migrations apply cleanly. Confirm `MP_WEBHOOK_SECRET` is documented in the environment setup.
  - _Implements: All requirements_
