# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare core structures and entry points
2. **Feature Delivery** - Implement the main design elements
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Foundation

- [x] 1.1 Update UserLesson Model
  - Add `savedCode`, `submittedCode`, and `aiFeedback` to `UserLesson` model.
  - _Implements: DES-2_

- [x] 1.2 Setup Challenge Route
  - Add route for `s/:slug/ss/:slugSubmodule/lesson/:lessonId/challenge` to `app.routes.ts`.
  - _Implements: DES-1, REQ-1.1_

- [x] 1.3 Update Supabase DB Schema
  - Add `saved_code`, `submitted_code`, `ai_feedback` columns to `user_lesson` table.
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [x] 2.1 Create Edge Function for Evaluation
  - Implement `evaluate-challenge` edge function connecting to OpenRouter.
  - _Depends: 1.3_
  - _Implements: DES-3, REQ-3.2_

- [x] 2.2 Update UserLesson Service
  - Add methods for saving draft, submitting code for evaluation, marking complete, and awarding XP/seeds.
  - _Depends: 1.1, 1.3_
  - _Implements: DES-2, DES-3, DES-4, REQ-2.1, REQ-3.1, REQ-4.1, REQ-4.2_

- [x] 2.3 Build Challenge Component
  - Implement component UI, `section-contents` usage, `@ngstack/code-editor`, and wire it to the service.
  - _Depends: 1.2, 2.2_
  - _Implements: DES-1, REQ-1.2, REQ-1.3, REQ-2.2, REQ-3.3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: load challenge route and UI elements
  - Verify routing works, description renders, and code editor is available.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 3.2 Test: persist code and restore state
  - Verify editor drafts are saved and state correctly restores on component load.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 3.3 Test: submit code and receive feedback
  - Verify edge function integrates with AI, and feedback is displayed in UI.
  - Test type: e2e
  - _Depends: 2.1, 2.3_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 3.4 Test: lesson completion and rewards
  - Verify successful submission marks lesson complete and allocates rewards.
  - Test type: integration
  - _Depends: 2.2, 2.3_
  - _Implements: REQ-4.1, REQ-4.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm challenge interface loads properly.
  - REQ-2: Confirm challenge state persists reliably.
  - REQ-3: Confirm AI evaluation runs and feedback renders.
  - REQ-4: Confirm challenge completion properly awards XP and seeds.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
