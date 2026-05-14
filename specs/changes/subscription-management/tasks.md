# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** - Core backend function and models
2. **Service Layer** - Data access and Edge function invocation
3. **Feature Delivery** - UI components and user interaction
4. **Acceptance Criteria Testing** - Verify requirement behavior
5. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-4 sessions)

## Phase 1: Foundation

- [x] 1.1 Add cancel-subscription Edge Function
  - Implement function to cancel Mercado Pago preapproval and update local database status.
  - _Implements: DES-3_

- [x] 1.2 Update Subscription Model
  - Extend the existing subscription models to handle joined plan and coupon duration data.
  - _Implements: DES-2_

## Phase 2: Service Layer

- [x] 2.1 Update SubscriptionService for fetching active subscription
  - Add `getActiveSubscription` to query the database, joining with plans and coupons.
  - _Depends: 1.2_
  - _Implements: DES-2_

- [x] 2.2 Update SubscriptionService for cancellation
  - Add `cancelSubscription` to invoke the new `cancel-subscription` Edge Function.
  - _Depends: 1.1_
  - _Implements: DES-2_

## Phase 3: Feature Delivery

- [x] 3.1 Create SubscriptionManagementComponent and routing
  - Build UI component scaffold and link to "Gerenciar Assinatura" in the aside-menu.
  - _Implements: DES-1_

- [x] 3.2 Implement Free Account state
  - Show message if no active subscription exists based on the service data.
  - _Depends: 2.1, 3.1_
  - _Implements: DES-1_

- [x] 3.3 Implement Active Subscription view
  - Display plan, next payment date, coupon details, and remaining discounted installments.
  - _Depends: 2.1, 3.1_
  - _Implements: DES-1_

- [x] 3.4 Implement Cancel interaction
  - Connect the cancel button to the service and update the UI state upon success.
  - _Depends: 2.2, 3.1_
  - _Implements: DES-1_

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: navigate to subscription management
  - Verify the aside menu link correctly routes to the new screen.
  - Test type: e2e
  - _Depends: 3.1_
  - _Implements: REQ-1.1_

- [x] 4.2 Test: show free account message
  - Verify the UI displays the free account message when no subscription is active.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-2.1_

- [x] 4.3 Test: display subscription details and coupon
  - Verify the UI correctly renders plan details, next payment date, and coupon logic (including remaining installments).
  - Test type: integration
  - _Depends: 3.3_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 4.4 Test: process cancellation and update status
  - Verify the cancel action invokes the service and the state reflects the cancelled status.
  - Test type: integration
  - _Depends: 3.4_
  - _Implements: REQ-4.1, REQ-4.2_

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm navigation works.
  - REQ-2: Confirm free account state works.
  - REQ-3: Confirm active subscription details and coupon logic works.
  - REQ-4: Confirm cancellation flow works successfully.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
