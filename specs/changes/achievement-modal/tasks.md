# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare core data fetching and updating logic
2. **Feature Delivery** - Implement the UI and integrate the feature into the application
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (2-3 sessions)

## Phase 1: Foundation

- [x] 1.1 Extend AchievementsService
  - Add `checkUnseenAchievements()` to fetch a single unviewed achievement from Supabase.
  - Add `markAsViewed(id: string)` to update the `viewed` status in Supabase.
  - Add a Signal or Subject to broadcast when an unseen achievement is available.
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [x] 2.1 Create Achievement Modal Component
  - Implement a standalone component in `src/app/components/achievement-modal`.
  - Build the UI layout (80% image, 20% info/buttons) using Tailwind CSS.
  - Add entry and exit animations.
  - Subscribe to the service state to display data or hide the modal.
  - Call the service to mark as viewed upon closing or navigating.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 2.2 Integrate Modal into App Root
  - Place `<app-achievement-modal>` in `src/app/app.html`.
  - Add logic to `src/app/app.ts` (`OnInit`) to trigger the unseen achievement check.
  - _Depends: 2.1_
  - _Implements: DES-3_

- [x] 2.3 Integrate Unseen Check into Quiz
  - Add logic to `continueQuiz()` in `src/app/pages/app/quiz/quiz.ts` to trigger the unseen achievement check upon successful quiz completion.
  - _Depends: 1.1_
  - _Implements: DES-3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Verify unseen achievement check on app load.
- [x] 3.2 Verify unseen achievement check on quiz completion.
- [x] 3.3 Verify modal displays correct data and follows 80/20 layout.
- [x] 3.4 Verify sequential display (closing one modal triggers next check).

## Phase 4: Final Checkpoint

- [x] 4.1 Validate code against "Neon Terminal" styleguide.
- [x] 4.2 Ensure no generic 1px solid borders are used.
- [x] 4.3 Verify AXE accessibility standards.
- [x] 4.4 Clean up any debug logs.
