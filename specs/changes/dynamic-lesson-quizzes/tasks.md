# Tasks: Dynamic Lesson Quizzes

## Overview

This feature transitions the quiz system from static data to a dynamic, Supabase-backed implementation. The work is divided into five phases:
1. **Database Schema**: Establishing the necessary tables and relations.
2. **Domain Models & Services**: Creating the data access layer.
3. **Logic & State**: Implementing reactive state management and session tracking.
4. **UI Integration**: Dynamic template rendering and feedback mechanisms.
5. **Final Checkpoint**: Quality assurance and accessibility verification.

## Phase 1: Database Schema

- [x] **Task 1.1**: Create Supabase migration to establish quiz tables.
    - _Implements: DES-3_
    - Create `20240418_create_quiz_tables.sql` with `quizzes`, `questions`, `answers`, `user_quizzes`, and `user_questions`.
    - Modify `section_content` and update the RLS policies if necessary.
    - **Verification**: Run `mcp_supabase_execute_sql` to confirm tables and columns exist.

## Phase 2: Domain Models & Services

- [x] **Task 2.1**: Update TypeScript domain models.
    - _Implements: DES-3_
    - Refine `src/models/quiz/quiz.ts`.
    - Refine `src/models/question/question.ts`.
    - Refine `src/models/answer/answer.ts`.
    - Refine `src/models/user-quiz/user-quiz.ts`.
    - Refine `src/models/user-question/user-question.ts`.
    - **Verification**: Ensure no compilation errors.

- [x] **Task 2.2**: Generate and implement Angular Services.
    - _Implements: DES-4_
    - Use `ng g s services/quiz`
    - Use `ng g s services/question`
    - Use `ng g s services/answer`
    - Use `ng g s services/user-quiz`
    - Use `ng g s services/user-question`
    - Implement the logic to fetch and persist data using Supabase.
    - **Verification**: Write unit tests or verify via console logs in a local environment.

## Phase 3: Quiz Page Logic (State Management)

- [x] **Task 3.1**: Implement reactive logic in `Quiz` component.
    - _Implements: DES-2, DES-5_
    - Replace static arrays with service calls.
    - Implement `currentIndex`, `selectedOption`, and `isVerified` signals.
    - Implement the random shuffling logic for both questions and answers.
    - **Verification**: Log the fetched and shuffled data.

- [x] **Task 3.2**: Implement the hidden session timer.
    - _Implements: DES-5_
    - Start timer on `ngOnInit` (or when data loads).
    - Record total time upon quiz completion.
    - **Verification**: Complete a quiz and check recorded time in console.

## Phase 4: UI Integration & Summary

- [x] **Task 4.1**: Update `quiz.html` for dynamic content.
    - _Implements: DES-2_
    - Render questions and their `section_content`.
    - Render answer options with selection logic.
    - **Verification**: Visual check of the quiz page.

- [x] **Task 4.2**: Implement Answer Verification UI feedback.
    - _Implements: DES-2_
    - Show `reason` and correctness state after clicking "Verify".
    - Manage "Next" button visibility.
    - **Verification**: Verify that feedback appears only after clicking the button.

- [x] **Task 4.3**: Integrate Summary View with dynamic data.
    - _Implements: DES-2_
    - Replace static summary calculations with results from the completed quiz.
    - Ensure all metrics (counts, percentage, time) are accurate.
    - **Verification**: Complete a quiz and verify summary against actual performance.

## Phase 5: Final Checkpoint

- [x] **Task 5.1**: Verification and Cleanup.
    - Run `ng lint` and fix any issues.
    - Run `npm test` to ensure stability.
    - Verify AXE accessibility standards (Traceability: STYLEGUIDE.md).
    - **Verification**: All automated checks pass.
