# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database Infrastructure** - Create the subscriptions table and migration
2. **Edge Function** - Build the create-subscription Edge Function
3. **Frontend Integration** - Add the SubscriptionService and update the Upgrade component
4. **Transparent Checkout Refactoring** - Add Checkout component, MP SDK, and handle PIX/Card.
5. **Acceptance Criteria Testing** - Verify requirement behavior
6. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Database Infrastructure

- [x] 1.1 Create subscriptions table migration
  - Create a new migration file `supabase/migrations/YYYYMMDD_add_subscriptions_table.sql` with the `subscriptions` table schema: `id` (uuid PK), `user_id` (uuid FK to auth.users), `plan_id` (uuid FK to plans), `coupon_id` (uuid FK nullable to coupons), `mp_preapproval_id` (text), `billing_cycle` (text with check constraint for 'monthly'/'yearly'), `transaction_amount` (numeric), `status` (text default 'pending'), `created_at` (timestamptz default now()).
  - Add RLS policies: authenticated users can SELECT their own rows, service role has full access.
  - _Implements: DES-4, REQ-4.1, REQ-4.2_

- [x] 1.2 Apply the migration
  - Run `npx supabase db up` to apply the new migration to the database.
  - _Depends: 1.1_
  - _Implements: DES-4_

## Phase 2: Edge Function

- [x] 2.1 Create the create-subscription Edge Function
  - Create `supabase/functions/create-subscription/index.ts` following the `complete-quiz` Edge Function pattern.
  - Implement CORS preflight handling.
  - Authenticate the user via the JWT `Authorization` header using `userClient.auth.getUser()`.
  - Extract the user email from the authenticated session for use as `payer_email`.
  - Read `ML_ACCESS_TOKEN` from `Deno.env.get()`.
  - Parse the request body for `planId`, `billingCycle`, and optional `couponCode`.
  - Validate required fields and return 400 if missing.
  - _Implements: DES-1, REQ-1.2, REQ-3.1, REQ-6.1, REQ-6.2_

- [x] 2.2 Add plan lookup and coupon validation logic
  - Fetch the plan from the `plans` table by `planId`. Return 400 if not found.
  - Determine `transaction_amount` based on `billingCycle` (monthly_price or yearly_price).
  - If `couponCode` is provided: query `coupons` table by code, validate expiration date and usage limit, calculate discounted amount (percentage or fixed), ensure amount is not negative (floor at 0), increment `used_count` by 1.
  - If coupon is invalid/expired/over limit, return 400 with a descriptive error.
  - _Depends: 2.1_
  - _Implements: DES-1, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5_

- [x] 2.3 Add Mercado Pago preapproval creation
  - Call the Mercado Pago `/preapproval` API via `fetch()` with the `ML_ACCESS_TOKEN` bearer token.
  - Set `frequency` to 1, `frequency_type` to `months` (monthly) or `months` with frequency 12 (yearly), `transaction_amount`, `currency_id` to `BRL`, `reason` to the plan name, `payer_email`, `back_url` to the app's upgrade page URL, and `status` to `pending`.
  - On success, extract `init_point` and `id` (preapproval ID) from the response.
  - On error, return 500 with the Mercado Pago error details.
  - _Depends: 2.2_
  - _Implements: DES-1, REQ-1.2, REQ-1.3, REQ-1.5_

- [x] 2.4 Add subscription record storage and response
  - Insert a record into the `subscriptions` table with user_id, plan_id, coupon_id (if used), mp_preapproval_id, billing_cycle, transaction_amount, and status 'pending'.
  - Return the `init_point` URL in the JSON response body.
  - _Depends: 2.3_
  - _Implements: DES-1, DES-4, REQ-4.1, REQ-4.2, REQ-1.3_

## Phase 3: Frontend Integration

- [x] 3.1 Create the SubscriptionService
  - Create `src/app/services/subscription.ts` using `ng g s services/subscription`.
  - Inject `SupabaseService`. Implement `createSubscription(planId: string, billingCycle: 'monthly' | 'yearly', couponCode?: string): Promise<{ initPoint: string }>`.
  - Get the active session via `this.supabase.client.auth.getSession()`, throw if no session.
  - Invoke `this.supabase.client.functions.invoke('create-subscription', { body, headers })`.
  - Return the `init_point` from the response or throw on error.
  - _Implements: DES-2, REQ-1.1, REQ-1.4_

- [x] 3.2 Update the Upgrade component logic
  - Import and inject `SubscriptionService` in `upgrade.ts`.
  - Add `isSubscribing = signal(false)` and `subscriptionError = signal<string | null>(null)` signals.
  - Implement `subscribe(cycle: 'monthly' | 'yearly')` method: set `isSubscribing` to true, clear error, call `subscriptionService.createSubscription()` with `plan().id`, cycle, and `coupon()?.code`, redirect to `init_point` via `window.location.href` on success, set error and reset `isSubscribing` on failure.
  - _Depends: 3.1_
  - _Implements: DES-3, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

- [x] 3.3 Update the Upgrade template
  - Bind the monthly "Assinar Agora" button to `(click)="subscribe('monthly')"`.
  - Bind the annual "Assinar Plano Anual" button to `(click)="subscribe('yearly')"`.
  - Add `[disabled]="isSubscribing()"` to both buttons.
  - Show a loading spinner or text change on the button while `isSubscribing()` is true.
  - Add an error message section below the pricing cards that displays `subscriptionError()` when present.
  - _Depends: 3.2_
  - _Implements: DES-3, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

## Phase 4: Transparent Checkout Refactoring

- [x] 4.1 Create the Checkout component
  - Generate a new standalone component `app/pages/app/checkout`.
  - Update `app.routes.ts` to map `/app/checkout` to this new component, using the same guards as `/app/upgrade`.
  - _Depends: 3.3_

- [x] 4.2 Update Upgrade component to route to Checkout
  - Modify `upgrade.ts` `subscribe` method to navigate to `/app/checkout`, passing `planId`, `cycle`, and `couponCode` as `queryParams`.
  - Remove direct Edge Function invocation from `upgrade.ts`.
  - _Depends: 4.1_

- [x] 4.3 Refactor Edge Function for Transparent Checkout (Card + PIX)
  - Update `supabase/functions/create-subscription/index.ts` to expect `paymentMethod` ('card' or 'pix') and `cardTokenId` (for 'card').
  - If `paymentMethod === 'card'`, call `/preapproval` with `card_token_id` and return the subscription status instead of `init_point`.
  - If `paymentMethod === 'pix'`, call `/v1/payments` with `payment_method_id: 'pix'` and return the `qr_code_base64` and `qr_code`.
  - Update `subscriptions` table insert to save `status` directly based on MP response.
  - _Depends: 4.2_

- [x] 4.4 Update SubscriptionService
  - Modify `SubscriptionService.createSubscription` to accept `paymentMethod` and `cardTokenId` and return the full Edge Function data (handling both PIX qr code and Card success).
  - _Depends: 4.3_

- [x] 4.5 Implement Checkout UI & MP JS SDK
  - Implement two tabs in the Checkout component: Cartão de Crédito e PIX.
  - Load `MercadoPago.js` and use it to securely capture card info and generate `card_token_id`.
  - On submission, call `SubscriptionService.createSubscription`.
  - Handle PIX success by displaying the QR code and copy/paste text. Handle Card success by showing a success message.
  - _Depends: 4.4_

## Phase 5: Acceptance Criteria Testing

- [x] 5.1 Test: subscription creation with monthly billing cycle
  - Navigate to the upgrade page, click the monthly subscribe button, and verify the user is redirected to the checkout. Complete checkout and verify success.
  - Test type: integration
  - _Depends: 4.5_
  - _Implements: REQ-1.1, REQ-1.2, REQ-2_1.3, REQ-1.4, REQ-5.1_

- [x] 5.2 Test: subscription creation with valid coupon
  - Enter a valid coupon code, click apply, and verify the discount is calculated correctly on checkout. Complete checkout and verify the total is discounted.
  - Test type: integration
  - _Depends: 4.5_
  - _Implements: REQ-4.1, REQ-4.2, REQ-5.1_

- [ ] 4.3 Test: coupon validation and discount calculation on subscribe
  - Apply a valid coupon, subscribe, and verify the Edge Function calculates the discounted amount correctly. Verify the coupon's `used_count` is incremented in the database. Then test with an invalid/expired coupon and verify the subscription is rejected with an error.
  - Test type: e2e
  - _Depends: 3.3_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5_

- [ ] 4.4 Test: credential isolation
  - Inspect the frontend code and Edge Function response to verify `ML_ACCESS_TOKEN` is never exposed in client-accessible resources.
  - Test type: integration
  - _Depends: 2.4_
  - _Implements: REQ-3.1, REQ-3.2_

- [ ] 4.5 Test: subscription record persistence
  - After a successful subscription creation, query the `subscriptions` table and verify the record contains the correct user_id, plan_id, billing_cycle, mp_preapproval_id, transaction_amount, and status 'pending'.
  - Test type: integration
  - _Depends: 2.4_
  - _Implements: REQ-4.1, REQ-4.2_

- [ ] 4.6 Test: loading state and error feedback
  - Click subscribe and verify the button shows a loading indicator and all subscribe buttons are disabled during processing. Simulate a failure and verify an error message is displayed.
  - Test type: e2e
  - _Depends: 3.3_
  - _Implements: REQ-5.3, REQ-5.4_

- [ ] 4.7 Test: authentication enforcement
  - Send a subscription request without a valid JWT and verify a 401 error is returned. Verify the user email is extracted from the session for the payer_email field.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-6.1, REQ-6.2_

## Phase 6: Final Checkpoint

- [x] 6.1 Verify all acceptance criteria
  - REQ-1: Confirm subscription creation flow works end-to-end with correct MP preapproval parameters and transparent checkout.
  - REQ-2: Confirm both monthly and yearly plans work.
  - REQ-4: Confirm coupon validation works correctly (expiration and usage limit).
  - REQ-5: Confirm UI shows loading states and handles errors properly.
  - REQ-6: Confirm subscriptions table is updated correctly with correct data and pending status.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
