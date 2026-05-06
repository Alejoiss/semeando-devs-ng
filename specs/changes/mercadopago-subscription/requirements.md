# Requirements

## Overview
The Semeando Devs platform currently displays an upgrade page with plan pricing and coupon validation but lacks any actual payment processing. This feature integrates Mercado Pago's Subscription API (`/preapproval`) to allow authenticated users to subscribe to the PRO plan directly within the application. The integration uses a Supabase Edge Function as the backend intermediary that communicates with the Mercado Pago API, ensuring credentials never reach the frontend. Users select a billing cycle (monthly or yearly), optionally apply a coupon, and are redirected to the Mercado Pago payment environment to complete the subscription.

## Glossary
| Term | Definition |
|------|------------|
| Preapproval | A Mercado Pago subscription object created via the `/preapproval` API endpoint that defines recurring billing terms. |
| Init Point | A URL returned by Mercado Pago after subscription creation that redirects the user to the payment form. |
| Edge Function | A Supabase serverless function (Deno-based) that acts as the secure backend for API calls requiring secret credentials. |
| Billing Cycle | The recurrence interval chosen by the user: monthly (1 month) or yearly (12 months). |
| Coupon Redemption | The act of validating and consuming one usage count of a coupon during subscription creation. |

## Assumptions
- Mercado Pago credentials (`ML_PUBLIC_KEY` and `ML_ACCESS_TOKEN`) are already configured in the `.env` file used by Supabase Edge Functions.
- The existing `plans` and `coupons` tables in Supabase are the source of truth for pricing and discount data.
- The subscription is created with `status: "pending"`, meaning the user finalizes payment through the Mercado Pago-hosted `init_point` URL.
- After the user completes payment on the Mercado Pago page, they are redirected back to the application via a configurable `back_url`.
- Webhook-based payment confirmation and automatic user plan activation are out of scope for this iteration. A future iteration will implement webhooks to update user subscription status in the database.
- The system creates a Mercado Pago subscription (recurring payment) rather than a one-time payment.

## Requirements

### REQ-1: Subscription Creation via Edge Function

**User Story:** As a user, I want to subscribe to the PRO plan by selecting a billing cycle, so that I can unlock all premium content.

#### Acceptance Criteria
1.1 WHEN the user selects a billing cycle and confirms the subscription, the application SHALL send the plan ID, billing cycle, coupon code (if applied), and the user's email to the subscription Edge Function.
1.2 WHEN the Edge Function receives a valid subscription request, the Edge Function SHALL create a Mercado Pago preapproval with the correct `transaction_amount`, `frequency`, `frequency_type`, `currency_id`, `reason`, and `back_url`.
1.3 WHEN the Mercado Pago API returns a successful preapproval response, the Edge Function SHALL return the `init_point` URL to the frontend.
1.4 WHEN the frontend receives the `init_point` URL, the application SHALL redirect the user to that URL to complete payment.
1.5 IF the Mercado Pago API returns an error, THEN the Edge Function SHALL return an error response with a descriptive message.

### REQ-2: Server-Side Coupon Validation on Subscription

**User Story:** As a user, I want my coupon discount to be securely applied when I subscribe, so that I pay the correct discounted price.

#### Acceptance Criteria
2.1 WHEN a coupon code is included in the subscription request, the Edge Function SHALL validate the coupon by checking its existence, expiration date, and usage count against the database.
2.2 IF the coupon is valid, THEN the Edge Function SHALL calculate the discounted `transaction_amount` using the coupon's `discount_type` and `discount_value`.
2.3 IF the coupon is valid, THEN the Edge Function SHALL increment the coupon's `used_count` by one in the database.
2.4 IF the coupon code is invalid, expired, or has exceeded its usage limit, THEN the Edge Function SHALL reject the subscription request with an error message indicating the coupon is not valid.
2.5 THE Edge Function SHALL ensure the final `transaction_amount` is never negative (minimum of zero).

### REQ-3: Secure Credential Isolation

**User Story:** As a platform operator, I want Mercado Pago credentials to be stored only in the backend, so that they are never exposed to the client.

#### Acceptance Criteria
3.1 THE Edge Function SHALL read the `ML_ACCESS_TOKEN` exclusively from server-side environment variables.
3.2 THE application SHALL never transmit or embed the `ML_ACCESS_TOKEN` in any frontend code, response body, or client-accessible resource.

### REQ-4: Subscription Payment Records

**User Story:** As a platform operator, I want each subscription attempt to be recorded in the database, so that I can track payment history and troubleshoot issues.

#### Acceptance Criteria
4.1 WHEN a preapproval is successfully created on Mercado Pago, the Edge Function SHALL store a record in a `subscriptions` table containing the user ID, plan ID, billing cycle, coupon ID (if used), Mercado Pago preapproval ID, transaction amount, and creation timestamp.
4.2 THE application SHALL set the initial subscription status to `pending` in the database record.

### REQ-5: Upgrade Page Payment Flow

**User Story:** As a user, I want to initiate my subscription directly from the upgrade page, so that the process is seamless and intuitive.

#### Acceptance Criteria
5.1 WHEN the user clicks the "Assinar Agora" button on a monthly plan card, the application SHALL initiate the subscription flow with a monthly billing cycle.
5.2 WHEN the user clicks the "Assinar Plano Anual" button on the annual plan card, the application SHALL initiate the subscription flow with a yearly billing cycle.
5.3 WHILE the subscription request is being processed, the application SHALL display a loading indicator on the clicked button and disable all subscription buttons.
5.4 IF the subscription creation fails, THEN the application SHALL display an error message to the user.

### REQ-6: Authentication Enforcement

**User Story:** As a platform operator, I want only authenticated users to create subscriptions, so that subscriptions are tied to valid user accounts.

#### Acceptance Criteria
6.1 IF a subscription request does not include a valid authorization token, THEN the Edge Function SHALL reject the request with an authentication error.
6.2 THE Edge Function SHALL extract the user's email from the authenticated session to use as the `payer_email` in the Mercado Pago preapproval request.
