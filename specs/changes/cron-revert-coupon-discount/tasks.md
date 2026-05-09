# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Setup the Edge Function and basic database connectivity.
2. **Feature Delivery** - Implement the core logic for identifying expired coupons, updating Mercado Pago, and synchronizing the database state.
3. **Acceptance Criteria Testing** - Verify requirement behavior through testing.
4. **Final Checkpoint** - Validate completeness and readiness.

**Estimated Effort**: Medium (2-4 sessions)

## Phase 1: Foundation

- [x] 1.1 Scaffold Edge Function
  - Create the `cron-revert-coupon-discount` Edge Function directory and basic structure.
  - _Implements: DES-1_

- [x] 1.2 Setup Database Client
  - Initialize the Supabase client with service role access for database queries.
  - _Depends: 1.1_
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [x] 2.1 Implement Expired Coupon Retrieval
  - Query the database for active subscriptions with a coupon whose duration has elapsed. Ignore subscriptions without coupons.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-1.1, REQ-1.2_

- [x] 2.2 Implement Mercado Pago Integration
  - For each expired subscription, send a PUT request to the Mercado Pago Preapproval API to revert the transaction amount. Log any failures.
  - _Depends: 2.1_
  - _Implements: DES-3, REQ-2.1, REQ-2.2_

- [x] 2.3 Implement Database Synchronization
  - For each successful Mercado Pago update, remove the `coupon_id` from the subscription record and log the expiration event.
  - _Depends: 2.2_
  - _Implements: DES-4, REQ-3.1, REQ-3.2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: identify active subscriptions with expired coupons
  - Verify the query correctly fetches active subscriptions where the coupon duration has elapsed and ignores those without coupons.
  - Test type: unit
  - _Depends: 2.1_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 3.2 Test: revert transaction amount in Mercado Pago
  - Verify the function makes the correct PUT request to Mercado Pago and logs errors upon failure.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 3.3 Test: update subscription state in database
  - Verify the function removes the coupon association and records the event upon successful MP update.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-3.1, REQ-3.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm the system correctly identifies expired coupons and ignores unaffected subscriptions.
  - REQ-2: Confirm Mercado Pago pricing is updated and errors are logged.
  - REQ-3: Confirm database subscription state is synchronized.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
