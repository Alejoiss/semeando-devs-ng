# Implementation Tasks

## Overview
This implementation is organized into 4 phases:
1. **Foundation** - Prepare the database and model updates.
2. **Feature Delivery** - Implement the query filter in the service and update UI stats.
3. **Acceptance Criteria Testing** - Verify that the filter and model mapping work as expected via tests.
4. **Final Checkpoint** - Ensure all requirements are fully met.

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Create database migration
  - Create the SQL migration file under `supabase/migrations/` to add the `is_visible` boolean column with default `true` to the `achievements` table.
  - _Implements: DES-1, REQ-1.1, REQ-1.2_

- [x] 1.2 Apply database migration
  - Run the SQL migration using the Supabase execute tool to update the database.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.1_

- [x] 1.3 Update achievements model
  - Update the `Achievements` TypeScript model to include the `isVisible` field and map it from `is_visible`.
  - _Implements: DES-2, REQ-1.1_

## Phase 2: Feature Delivery

- [x] 2.1 Filter query in service
  - Update `AchievementsService.getAchievements` to query only rows where `is_visible` is true.
  - _Depends: 1.3_
  - _Implements: DES-3, REQ-2.1_

- [x] 2.2 Update UI and stats computation
  - Update the `Achievements` component to compute `earnedAchievementsCount` using only active/visible achievements.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-3.1_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: filter inactive achievements in service
  - Verify that the achievements service filters query results to only retrieve visible achievements.
  - Test type: unit
  - _Depends: 2.1_
  - _Implements: REQ-1.1, REQ-1.2, REQ-2.1_

- [x] 3.2 Test: achievements UI only displays active ones
  - Verify that the achievements component only displays and counts achievements that are active/visible.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-3.1_

## Phase 4: Final Checkpoint

- [~] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm achievements table has is_visible and defaults to true.
  - REQ-2: Confirm achievements service queries achievements with is_visible = true.
  - REQ-3: Confirm achievements page only renders visible achievements.
  - Run the relevant unit tests to verify no regressions exist.
  - _Implements: All requirements_
