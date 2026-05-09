# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** - Prepare database schema and model structures
2. **Activation Logic** - Implement service layer and frontend conditional flow
3. **Automation** - Setup periodic expiration cleanup
4. **Acceptance Criteria Testing** - Verify requirement behavior
5. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3 sessions)

## Phase 1: Foundation

- [x] 1.1 Add `pro_until` to `profiles` table
  - Create and run a Supabase migration to add a `pro_until` timestamp column to the `profiles` table.
  - _Implements: DES-1, REQ-3.1_

- [x] 1.2 Update `Profile` and `User` models
  - Add `pro_until?: string` to `src/models/profile/profile.ts` and update the `User` interface to include a corresponding field.
  - _Implements: DES-1_

- [x] 1.3 Update `UserService` to retrieve `pro_until`
  - Modify `getUserProfile` in `src/app/services/user.ts` to select and map the `pro_until` field.
  - _Implements: DES-1, REQ-3.2_

## Phase 2: Activation Logic

- [x] 2.1 Implement `activateProWithCoupon` in `SubscriptionService`
  - Add a new method to `src/app/services/subscription.ts` that updates the profile's `is_pro` and `pro_until` fields directly.
  - _Implements: DES-3, REQ-2.1, REQ-2.2_

- [x] 2.2 Update `Upgrade` component logic for coupon detection
  - Modify `src/app/pages/app/upgrade/upgrade.ts` to detect when an applied coupon provides a 100% discount.
  - _Implements: DES-2, REQ-1.1_

- [x] 2.3 Update `Upgrade` component template for activation
  - Modify `src/app/pages/app/upgrade/upgrade.html` to display an "Ativar Pro" button when a 100% coupon is detected, bypassing the standard checkout.
  - _Implements: DES-2, REQ-1.2_

## Phase 3: Automation

- [x] 3.1 Create SQL function `revoke_expired_pro`
  - Implement a Supabase function that finds profiles with `pro_until < NOW()` and resets their Pro status.
  - _Implements: DES-4, REQ-4.2_

- [x] 3.2 Schedule expiration cleanup via `pg_cron`
  - Enable the `pg_cron` extension (if not already) and schedule the `revoke_expired_pro` function to run daily.
  - _Implements: DES-4, REQ-4.1_

## Phase 4: Acceptance Criteria Testing

- [ ] 4.1 Test: detect 100% discount coupon
  - Verify that applying a 100% coupon changes the checkout button to "Ativar Pro".
  - Test type: e2e
  - _Implements: REQ-1.1, REQ-1.2_

- [ ] 4.2 Test: activate Pro via 100% coupon
  - Verify that clicking "Ativar Pro" correctly updates the user profile and calculates the expiration date.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2_

- [ ] 4.3 Test: retrieve Pro status and expiration
  - Verify that the profile retrieval logic correctly reflects the Pro status and expiration timestamp.
  - Test type: unit
  - _Implements: REQ-3.2_

- [ ] 4.4 Test: revoke expired Pro status
  - Manually trigger the expiration function and verify it revokes Pro status for a test user with a past `pro_until` date.
  - Test type: integration
  - _Implements: REQ-4.2_

## Phase 5: Final Checkpoint

- [ ] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm 100% coupons are correctly identified and trigger the activation flow.
  - REQ-2: Confirm direct activation bypasses payment and sets correct expiration.
  - REQ-3: Confirm Pro status and expiration are persisted and retrieved.
  - REQ-4: Confirm automated expiration revokes access correctly.
  - _Implements: All requirements_
