# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** - Prepare the database schema for AI usage tracking.
2. **Backend Enforcement** - Update Edge Functions to enforce the limits and log usage.
3. **Frontend Integration** - Display AI credits in the UI and update state.
4. **Acceptance Criteria Testing** - Verify requirement behavior.
5. **Final Checkpoint** - Validate completeness and readiness.

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Foundation

- [x] 1.1 Create migration for ai_usage_logs
  - Create a new migration file for the `ai_usage_logs` table, including necessary RLS policies. Update TS types.
  - _Implements: DES-1_

## Phase 2: Backend Enforcement

- [x] 2.1 Update evaluate-lesson-content function
  - Check `ai_usage_logs` for `evaluate_content` count (max 3) per lesson. Insert log on success.
  - _Depends: 1.1_
  - _Implements: DES-2_

- [x] 2.2 Update evaluate-challenge function
  - Check user's `is_pro` status and daily `submit_code` count (Free: max 5, Pro: max 30). Insert log on success.
  - _Depends: 1.1_
  - _Implements: DES-3_

## Phase 3: Frontend Integration

- [x] 3.1 Implement AI Credits Service
  - Create or update a service to fetch remaining credits and provide a reactive signal for the UI.
  - _Depends: 2.1, 2.2_
  - _Implements: DES-4_

- [x] 3.2 Update AsideMenu to display credits
  - Display the remaining AI credits in the sidebar below the "Atualizar para Pro" button, updating reactively.
  - _Depends: 3.1_
  - _Implements: DES-4_

- [x] 3.3 Update Upgrade screen
  - Display the static AI rate limit information on the upgrade screen for Free users, hiding it for Pro users.
  - _Depends: 3.1_
  - _Implements: DES-4_

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: enforce content evaluation limit
  - Verify that the user can evaluate content up to 3 times per lesson and is blocked afterwards.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 4.2 Test: enforce code submission limit
  - Verify that Free users are limited to 5 submissions/day and Pro users to 30 submissions/day.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 4.3 Test: display and update AI credits in sidebar
  - Verify the total available credits are shown in the sidebar below the upgrade button and update upon usage.
  - Test type: e2e
  - _Depends: 3.1, 3.2_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 4.4 Test: display rate limit info on upgrade screen
  - Verify the rate limit information is visible to Free users and hidden from Pro users on the upgrade screen.
  - Test type: e2e
  - _Depends: 3.3_
  - _Implements: REQ-4.1, REQ-4.2_

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Content evaluation limit enforced.
  - REQ-2: Code submission limit enforced by tier.
  - REQ-3: AI credits displayed and updated in sidebar.
  - REQ-4: Limit info displayed on upgrade screen for Free users.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
