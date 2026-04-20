# Requirements

## Overview

When a user completes a quiz, the platform must persist the quiz result and cascade a series of progress updates across the learning hierarchy (lesson → submodule → module) and the gamification system (XP log, weekly XP, monthly XP, and lifetime XP). This process is triggered atomically on the server side through a dedicated Supabase Edge Function, ensuring consistency and removing complex orchestration logic from the Angular client.

The feature introduces a new `complete-quiz` Edge Function that receives the quiz attempt ID and the lesson ID, then performs all necessary writes in a single server-side transaction. The Angular `QuizService` gains a new `completeQuiz` method that invokes this function at the moment the user finishes answering all questions. All business rules—such as the 70% pass threshold, cascading completion checks, and XP award logic—are enforced exclusively inside the Edge Function.

This eliminates the current partial implementation where `UserQuizService.finishAttempt` updates `user_quizzes` directly but leaves lesson, submodule, module, and XP tables unwritten.

## Glossary

| Term | Definition |
|------|------------|
| Quiz Attempt | A single row in `user_quizzes` representing one user's play-through of a quiz, created when the quiz starts. |
| Passed | A quiz attempt is considered passed when the percentage of correct answers is ≥ 70%. |
| Lesson Completion | A `user_lessons` row is marked `completed = true` when the linked quiz attempt passes. |
| Submodule Completion | A `user_submodules` row is marked `completed = true` when every lesson in that submodule is completed. |
| Module Completion | A `user_modules` row is marked `completed = true` when every submodule in that module is completed. |
| XP Award | The integer reward (from `lessons.xp`) credited to the user when a quiz is passed. |
| Edge Function | A server-side Deno/TypeScript function deployed on Supabase that executes privileged database operations. |

## Assumptions

- A `user_quizzes` row already exists at quiz start (created by `UserQuizService.createAttempt`); the Edge Function only needs to update it, not create it.
- `user_lessons`, `user_submodules`, and `user_modules` rows already exist (created when the user starts a lesson/submodule/module); the Edge Function only updates them.
- XP is awarded only once per successful quiz completion; re-taking a quiz that was already passed does not award XP again.
- The `xp`, `xp_week`, and `xp_month` rows may not yet exist for a user; the Edge Function must upsert them.
- The `score` field in `user_quizzes` stores the number of correct answers (integer count), not a percentage.
- The Edge Function is called with the authenticated user's JWT, giving it access to the calling user's identity via `auth.uid()`.

## Requirements

### REQ-1: Persist Quiz Attempt Result

**User Story:** As a student, I want my quiz score and completion status to be saved when I finish a quiz, so that my progress is recorded accurately.

#### Acceptance Criteria

1.1 WHEN a user submits the final answer of a quiz, THEN the `complete-quiz` Edge Function SHALL update `user_quizzes` with the total number of correct answers as `score`, the elapsed time in seconds as `spent_time`, and the current timestamp as `completed_at`.

1.2 WHEN the percentage of correct answers is greater than or equal to 70%, THEN the `complete-quiz` Edge Function SHALL set `user_quizzes.completed` to `true`.

1.3 WHEN the percentage of correct answers is less than 70%, THEN the `complete-quiz` Edge Function SHALL set `user_quizzes.completed` to `false`.

### REQ-2: Mark Lesson as Completed

**User Story:** As a student, I want my lesson to be marked complete when I pass its quiz, so that my learning path reflects my achievements.

#### Acceptance Criteria

2.1 WHEN the quiz attempt is passed, THEN the `complete-quiz` Edge Function SHALL update `user_lessons` setting `completed` to `true` and `completed_at` to the current timestamp for the lesson linked to the quiz.

2.2 WHEN the quiz attempt is not passed, THEN the `complete-quiz` Edge Function SHALL update `user_lessons` setting `completed` to `false` for the lesson linked to the quiz.

### REQ-3: Cascade Submodule Completion

**User Story:** As a student, I want my submodule to be automatically marked complete when I finish all its lessons, so that I can track my holistic progress through the curriculum.

#### Acceptance Criteria

3.1 WHEN a lesson is marked completed, THEN the `complete-quiz` Edge Function SHALL check whether all lessons belonging to the same submodule are completed for the current user.

3.2 WHEN all lessons in a submodule are completed by the user, THEN the `complete-quiz` Edge Function SHALL update `user_submodules` setting `completed` to `true` and `completed_at` to the current timestamp.

3.3 WHEN at least one lesson in the submodule remains incomplete, THEN the `complete-quiz` Edge Function SHALL leave `user_submodules.completed` unchanged.

### REQ-4: Cascade Module Completion

**User Story:** As a student, I want my module to be automatically marked complete when I finish all its submodules, so that I can see my full curriculum progress.

#### Acceptance Criteria

4.1 WHEN a submodule is marked completed, THEN the `complete-quiz` Edge Function SHALL check whether all submodules belonging to the same module are completed for the current user.

4.2 WHEN all submodules in a module are completed by the user, THEN the `complete-quiz` Edge Function SHALL update `user_modules` setting `completed` to `true` and `completed_at` to the current timestamp.

4.3 WHEN at least one submodule in the module remains incomplete, THEN the `complete-quiz` Edge Function SHALL leave `user_modules.completed` unchanged.

### REQ-5: Award XP for Lesson Completion

**User Story:** As a student, I want to earn XP when I pass a quiz, so that I am rewarded for my learning effort.

#### Acceptance Criteria

5.1 WHEN a quiz attempt is passed and the lesson has not been previously completed, THEN the `complete-quiz` Edge Function SHALL insert a row into `xp_log` with `amount` equal to the lesson's `xp` value and `reason` equal to `'LESSON'`.

5.2 WHEN a quiz attempt is passed and the lesson has not been previously completed, THEN the `complete-quiz` Edge Function SHALL upsert a row in `xp` incrementing `total_xp` by the lesson's `xp` value for the current user.

5.3 WHEN a quiz attempt is passed and the lesson has not been previously completed, THEN the `complete-quiz` Edge Function SHALL upsert a row in `xp_week` incrementing `xp_amount` by the lesson's `xp` value for the current user, current ISO week number, and current year.

5.4 WHEN a quiz attempt is passed and the lesson has not been previously completed, THEN the `complete-quiz` Edge Function SHALL upsert a row in `xp_month` incrementing `xp_amount` by the lesson's `xp` value for the current user, current month, and current year.

5.5 WHEN the lesson was already marked completed before this attempt, THEN the `complete-quiz` Edge Function SHALL not insert any XP entries.

### REQ-6: Angular Client Integration

**User Story:** As a developer, I want a dedicated service method that calls the Edge Function after quiz completion, so that the Angular application stays thin and the business logic lives server-side.

#### Acceptance Criteria

6.1 WHEN a quiz is finished in the Angular application, THEN the `QuizService` SHALL invoke the `complete-quiz` Edge Function passing the quiz attempt ID, lesson ID, correct answer count, and elapsed time in seconds.

6.2 IF the Edge Function returns an error response, THEN the `QuizService` SHALL throw an error with the server-provided message so that the calling component can handle it.

6.3 THE `QuizService` SHALL call the Edge Function using the authenticated user's session token so that the Edge Function can verify the caller's identity.

### REQ-7: Edge Function Deployment Artifact

**User Story:** As a developer, I want a deployable Edge Function file committed to the repository, so that the function can be version-controlled and deployed via the Supabase CLI.

#### Acceptance Criteria

7.1 THE system SHALL include a `supabase/functions/complete-quiz/index.ts` file containing the full Edge Function implementation.

7.2 THE system SHALL include a `supabase/functions/complete-quiz/.env.example` file documenting any required environment variables.
