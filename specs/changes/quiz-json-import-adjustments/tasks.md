# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation & Deletion Logic** - Implement question deletion API and integrate it into the import sequence
2. **UI & Loader Adjustments** - Style loaders to be circular
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small (1 session)

## Phase 1: Foundation & Deletion Logic

- [x] 1.1 Add deleteQuestionsByQuizId to `QuestionService`
  - Implement a method in `QuestionService` to delete questions by `quiz_id`.
  - _Implements: DES-1_

- [x] 1.2 Update TabQuiz import sequence with deletion call
  - Update `importFromJson` in `tab-quiz.ts` to clear existing questions before executing the bulk persistence loop.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.1_

## Phase 2: UI & Loader Adjustments

- [x] 2.1 Update loading indicators styling in `tab-quiz.html`
  - Modify spinner classes in `tab-quiz.html` for both the main page-level loader and the modal import button spinner to use `rounded-full` instead of square styling.
  - _Implements: DES-2, REQ-2.1, REQ-2.2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: clear existing questions on import
  - Add or update integration tests in `tab-quiz.spec.ts` to verify that `deleteQuestionsByQuizId` is called during the import process.
  - Test type: integration
  - _Depends: 1.2_
  - _Implements: REQ-1.1_

- [x] 3.2 Test: loaders display with circular styles
  - Verify that the loading elements in the template contain the `rounded-full` class to render as circular spinners.
  - Test type: unit
  - _Depends: 2.1_
  - _Implements: REQ-2.1, REQ-2.2_

## Phase 4: Final Checkpoint

- [~] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm existing questions are deleted prior to saving imported questions.
  - REQ-2: Confirm loader spinners are styled as circular elements.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
