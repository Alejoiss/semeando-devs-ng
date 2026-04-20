# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Edge Function Foundation** - Create the Supabase Edge Function file structure and core entry point
2. **Pipeline Implementation** - Implement the full completion pipeline inside the Edge Function
3. **Angular Integration** - Wire the Angular `QuizService` method and update the `QuizComponent`
4. **Acceptance Criteria Testing** - Verify requirement behavior through manual integration checks
5. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (2-3 sessions)

---

## Phase 1: Edge Function Foundation

- [x] 1.1 Create Edge Function file structure
  - Create `supabase/functions/complete-quiz/index.ts` with a bare Deno HTTP handler that returns 200.
  - Create `supabase/functions/complete-quiz/.env.example` documenting `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
  - _Implements: DES-4, REQ-7.1, REQ-7.2_

- [x] 1.2 Add JWT verification and request body parsing
  - Extract the `Authorization` header from the incoming request and verify the caller using the Supabase auth client.
  - Parse and validate the JSON body for required fields: `attemptId`, `lessonId`, `correctCount`, `totalCount`, `spentTime`.
  - Return 401 if JWT is invalid or missing; return 400 if a required field is absent.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-6.3_

- [x] 1.3 Initialize dual Supabase clients inside the Edge Function
  - Create a user-scoped client from the caller's JWT for authenticated writes.
  - Create a service-role client using `SUPABASE_SERVICE_ROLE_KEY` for cross-user reads.
  - _Depends: 1.2_
  - _Implements: DES-1_

---

## Phase 2: Pipeline Implementation

- [x] 2.1 Implement quiz attempt update step
  - Compute `passed` flag: `correctCount / totalCount >= 0.70`.
  - Update `user_quizzes` row identified by `attemptId`: set `score`, `spent_time`, `completed`, and `completed_at`.
  - _Depends: 1.3_
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 2.2 Implement lesson completion update step
  - Read the current `user_lessons.completed` value for the given `lessonId` and `userId` **before** updating (store as `wasAlreadyCompleted` for the XP guard).
  - Update `user_lessons`: set `completed` to the `passed` flag and `completed_at` to now if passed.
  - _Depends: 2.1_
  - _Implements: DES-1, REQ-2.1, REQ-2.2_

- [x] 2.3 Implement submodule completion cascade
  - Using the service-role client, fetch the `sub_module_id` for the lesson.
  - Count total lessons in that submodule and count completed `user_lessons` rows for the user in that submodule.
  - If all lessons are completed, update `user_submodules` setting `completed = true` and `completed_at` to now.
  - Only run this step if `passed` is true.
  - _Depends: 2.2_
  - _Implements: DES-1, REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 2.4 Implement module completion cascade
  - Using the service-role client, fetch the `module_id` for the submodule.
  - Count total submodules in that module and count completed `user_submodules` rows for the user in that module.
  - If all submodules are completed, update `user_modules` setting `completed = true` and `completed_at` to now.
  - Only run this step if the submodule was just marked completed.
  - _Depends: 2.3_
  - _Implements: DES-1, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 2.5 Implement XP award with idempotency guard
  - Skip all XP writes if `wasAlreadyCompleted` is true or `passed` is false.
  - Fetch `lessons.xp` for the lesson using the service-role client.
  - Insert a row into `xp_log` with `amount = lessons.xp` and `reason = 'LESSON'`.
  - Upsert `xp` on `user_id`: increment `total_xp` by the XP amount (create row if not exists).
  - Upsert `xp_week` on `(user_id, week, year)`: increment `xp_amount` (create row if not exists).
  - Upsert `xp_month` on `(user_id, month, year)`: increment `xp_amount` (create row if not exists).
  - _Depends: 2.2_
  - _Implements: DES-2, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5_

- [x] 2.6 Add structured error response and 200 success response
  - Wrap the pipeline in a try/catch; return 500 with `{ error: message }` on any thrown error.
  - Return 200 with `{ passed, xpAwarded }` on success.
  - _Depends: 2.1, 2.2, 2.3, 2.4, 2.5_
  - _Implements: DES-1, REQ-6.2_

---

## Phase 3: Angular Integration

- [x] 3.1 Add `completeQuiz` method to `QuizService`
  - Add a public `completeQuiz(attemptId, lessonId, correctCount, totalCount, spentTime)` method.
  - Retrieve the active session via `supabase.auth.getSession()` and extract the access token.
  - Invoke the Edge Function using `supabase.functions.invoke('complete-quiz', { body, headers: { Authorization } })`.
  - Throw an `Error` with the server message if the function returns an error payload.
  - _Implements: DES-3, REQ-6.1, REQ-6.2, REQ-6.3_

- [x] 3.2 Update `QuizComponent.finishQuiz` to call `completeQuiz`
  - Remove the `userQuizService.finishAttempt(...)` call from the `finishQuiz` private method.
  - Replace it with `quizService.completeQuiz(attemptId, lessonId, correctCount, totalCount, spentTime)`.
  - Pass `this.currentAttempt.id`, the `lessonId` from the route params, `this.correctCount()`, `this.totalQuestions()`, and `this.spentTimeSeconds()`.
  - Wrap the call in try/catch so errors surface gracefully without blocking the result screen.
  - _Depends: 3.1_
  - _Implements: DES-3, REQ-6.1, REQ-6.2_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: quiz attempt result is persisted correctly
  - Complete a quiz with a known number of correct answers and verify `user_quizzes` row has correct `score`, `spent_time`, `completed_at`, and `completed` values.
  - Test type: manual integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 4.2 Test: lesson is marked complete on passing quiz
  - Pass a quiz (>= 70%) and verify `user_lessons.completed = true` and `completed_at` is set.
  - Fail a quiz (< 70%) and verify `user_lessons.completed = false`.
  - Test type: manual integration
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 4.3 Test: submodule is marked complete when all lessons done
  - Complete all lessons in a submodule and verify `user_submodules.completed = true` and `completed_at` is set.
  - Complete only some lessons and verify `user_submodules.completed` remains unchanged.
  - Test type: manual integration
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 4.4 Test: module is marked complete when all submodules done
  - Complete all submodules in a module and verify `user_modules.completed = true` and `completed_at` is set.
  - Have one submodule incomplete and verify `user_modules.completed` remains unchanged.
  - Test type: manual integration
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 4.5 Test: XP is awarded once on first pass
  - Pass a quiz for the first time and verify `xp_log` has one new row, `xp.total_xp` increased by `lessons.xp`, `xp_week.xp_amount` increased, and `xp_month.xp_amount` increased.
  - Pass the same quiz again and verify no new `xp_log` row is inserted and XP totals are unchanged.
  - Test type: manual integration
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5_

- [x] 4.6 Test: client calls Edge Function with valid JWT and handles errors
  - Verify the `QuizService.completeQuiz` method sends the correct payload and `Authorization` header.
  - Simulate an Edge Function returning a 500 error and verify the service throws an `Error` with the server message.
  - Test type: manual integration
  - _Implements: REQ-6.1, REQ-6.2, REQ-6.3_

- [x] 4.7 Test: Edge Function and deployment files are present
  - Verify `supabase/functions/complete-quiz/index.ts` exists and is valid Deno TypeScript.
  - Verify `supabase/functions/complete-quiz/.env.example` exists and documents required secrets.
  - Test type: manual integration
  - _Implements: REQ-7.1, REQ-7.2_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm `user_quizzes` is updated with score, spent time, completion flag, and timestamp.
  - REQ-2: Confirm `user_lessons.completed` reflects quiz pass/fail.
  - REQ-3: Confirm submodule completion cascades when all lessons done.
  - REQ-4: Confirm module completion cascades when all submodules done.
  - REQ-5: Confirm XP is awarded on first pass only, across all three XP tables plus log.
  - REQ-6: Confirm Angular client calls the Edge Function securely and handles errors.
  - REQ-7: Confirm deployment artifacts are committed to the repository.
  - Run `npm test` and resolve any regressions introduced by the changes to `quiz.ts` and `quiz.service.ts`.
  - _Implements: All requirements_
