# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare the Supabase service and component state.
2. **Feature Delivery** - Implement the authoring form and save logic.
3. **Acceptance Criteria Testing** - Verify requirement behavior.
4. **Final Checkpoint** - Validate completeness and readiness.

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Foundation

- [x] 1.1 Add QuizService integration
  - Implement `QuizService` methods to fetch/create a quiz and upsert a question (with its `SectionContent` and `Answers`).
  - _Implements: DES-1, DES-3_

- [x] 1.2 Implement TabQuiz state management
  - Initialize the component state with Angular Signals, call the service to ensure the Quiz exists, and pad the questions array to exactly 10 items.
  - _Depends: 1.1_
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Build question authoring form UI
  - Create the template for each question slot, including the `ngs-code-editor` for the statement and the inputs/radios for the 4 alternatives.
  - _Implements: DES-2_

- [x] 2.2 Implement question save flow
  - Add validation logic (no empty text, exactly 1 correct answer) and wire the save button to call the `QuizService` for persistence.
  - _Depends: 1.1, 2.1_
  - _Implements: DES-3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: ensure quiz record exists or is created
  - Verify that when accessing the tab, an existing Quiz is loaded or a new one is created.
  - Test type: integration
  - _Depends: 1.1, 1.2_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 3.2 Test: display exactly 10 question slots
  - Verify that the UI renders exactly 10 empty or filled question authoring forms.
  - Test type: integration
  - _Depends: 1.2, 2.1_
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 3.3 Test: markdown editor stores statement correctly
  - Verify that the markdown statement is provided via the editor and stored as `SectionContent` of type `MARKDOWN`.
  - Test type: integration
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 3.4 Test: alternatives configured correctly
  - Verify that exactly four alternatives are present with text, justification, and correctness flags.
  - Test type: integration
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4_

- [x] 3.5 Test: question save flow respects validation
  - Verify that the save action persists valid questions and rejects invalid ones (missing answer or empty text).
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Quiz initialization works.
  - REQ-2: 10 question slots are provided.
  - REQ-3: Markdown editing works.
  - REQ-4: Alternatives setup works.
  - REQ-5: Saving validation works.
  - _Implements: All requirements_
