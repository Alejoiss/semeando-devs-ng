# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Database schema updates and frontend model alignment
2. **Core Logic Delivery** - Refactoring the Edge Function for incremental evaluation
3. **Acceptance Criteria Testing** - Verifying logic and notification behavior
4. **Final Checkpoint** - Validating completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Foundation

- [x] 1.1 Update `user_achievements` schema
  - Create a migration to add `progress` (int4, default 0), `completed` (boolean, default false), and `last_value` (text, nullable) columns.
  - Set `completed = true` for all existing records in the migration to maintain backward compatibility.
  - _Implements: DES-1_

- [x] 1.2 Update `UserAchievement` frontend model
  - Add `progress`, `completed`, and `lastValue` properties to the `UserAchievement` class in `src/models/user-achievement/user-achievement.ts`.
  - Update the constructor to map the new database fields.
  - _Implements: DES-3_

- [x] 1.3 Update `AchievementsService` query logic
  - Modify `checkUnseenAchievements` in `src/app/services/achievements.ts` to include a filter for `completed = true`.
  - _Implements: DES-3, REQ-6.1_

## Phase 2: Core Logic Delivery

- [x] 2.1 Refactor `evaluateAchievements` initialization
  - In `supabase/functions/complete-quiz/achievements.ts`, implement a step to ensure a record exists in `user_achievements` for every achievement in the system for the current user.
  - _Implements: DES-2, REQ-1.2, REQ-2.1_

- [x] 2.2 Implement Incremental Streak Logic
  - Refactor `IMPARAVEL` and `MARATONISTA_DO_CODIGO` evaluation to use the `last_value` (storing the last completion date) and `progress` fields.
  - Increment progress if the last completion was yesterday; reset to 0 if it was before yesterday (and not today).
  - _Implements: DES-2, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5_

- [x] 2.3 Implement Incremental Perfection Logic
  - Refactor `COMBO_INSANO` and `SERIE_PERFEITA` evaluation to use the `progress` field.
  - Increment progress on a perfect score (10/10); reset to 0 on any other score.
  - _Implements: DES-2, REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4_

- [x] 2.4 Implement Improvement Logic
  - Refactor `PERFECCIONISTA_DO_CODIGO` to mark as completed if the user has more than one entry for the same quiz in `user_quizzes`.
  - _Implements: DES-2, REQ-5.1_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: Initialization of missing achievements
  - Verify that completing a quiz creates tracking records for any achievements the user doesn't already have.
  - Test type: integration
  - _Implements: REQ-2.1_

- [x] 3.2 Test: Streak increment and reset behavior
  - Verify that `progress` for streaks increments correctly when quizzes are completed on consecutive days and resets when a day is skipped.
  - Test type: integration
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.5_

- [x] 3.3 Test: Streak completion threshold
  - Verify that achievements are marked as `completed` only when `progress` reaches the required threshold (5 or 10).
  - Test type: integration
  - _Implements: REQ-3.3, REQ-3.4_

- [x] 3.4 Test: Perfection increment and reset behavior
  - Verify that `progress` for perfection achievements increments on 10/10 scores and resets on lower scores.
  - Test type: integration
  - _Implements: REQ-4.1, REQ-4.2_

- [x] 3.5 Test: Perfection completion threshold
  - Verify that perfection achievements are marked as `completed` only when `progress` reaches the required threshold (5 or 10).
  - Test type: integration
  - _Implements: REQ-4.3, REQ-4.4_

- [x] 3.6 Test: Lesson improvement detection
  - Verify that `PERFECCIONISTA_DO_CODIGO` is awarded when a lesson is completed for the second time.
  - Test type: integration
  - _Implements: REQ-5.1_

- [x] 3.7 Test: Notification filtering by completion
  - Verify that only achievements with `completed = true` and `viewed = false` are returned for notifications.
  - Test type: integration
  - _Implements: REQ-6.1_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all requirements and overall spec completeness
  - Confirm all requirements from Phase 1 are fully implemented and verified.
  - Ensure all design elements from Phase 2 are correctly reflected in the implementation.
  - _Implements: All requirements_
