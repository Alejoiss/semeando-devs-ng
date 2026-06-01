# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** — Database migration and model update
2. **Service Layer** — New methods in LessonService and ModuleService
3. **UI Authoring Hooks** — Reset `is_validated` in all save flows
4. **UI Feature Delivery** — Validate button, status icons, and availability toggle
5. **Acceptance Criteria Testing** — Verify all requirement behaviors
6. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Create Supabase migration to add `is_validated` to `lessons`
  - Create `supabase/migrations/20260601000000_add_is_validated_to_lessons.sql` adding a nullable boolean column `is_validated` (default `NULL`) to the `lessons` table.
  - _Implements: DES-1_

- [x] 1.2 Update `Lesson` model with `isValidated` field
  - Add `isValidated?: boolean | null` to the `Lesson` interface in `src/models/lesson/lesson.ts`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.3, REQ-1.4, REQ-1.5_

---

## Phase 2: Service Layer

- [x] 2.1 Update `LessonService.getLessonsBySubModuleId` to return `isValidated`
  - Add `is_validated` to the select query and map it to `isValidated` in the returned `Lesson` objects.
  - _Depends: 1.2_
  - _Implements: DES-2, DES-4_

- [x] 2.2 Add `LessonService.invalidateLesson(lessonId)`
  - Implement a method that updates `is_validated = NULL` for the given lesson ID in Supabase.
  - _Depends: 1.2_
  - _Implements: DES-3, REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4_

- [x] 2.3 Add `LessonService.validateLesson(lessonId, lessonType)` for LESSON type
  - Implement the validation checks for LESSON: at least one section content, at least one extra material, at least one standalone question, exactly one quiz with exactly 10 questions, each question having exactly 4 answers with exactly one correct. Persist `is_validated = true` on full pass, `false` on any failure.
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6, REQ-2.7_

- [x] 2.4 Extend `LessonService.validateLesson` for CHALLENGE type
  - Add the CHALLENGE branch: at least one section content, and both `language` and `initial_code` fields are non-empty. Persist result accordingly.
  - _Depends: 2.3_
  - _Implements: DES-2, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [x] 2.5 Add `ModuleService.checkAllLessonsValidated(moduleId)`
  - Query all lessons (across all submodules of the module) where `type != 'REVISION'`. Return `true` only if every lesson has `is_validated = true`; return `false` otherwise.
  - _Implements: DES-5, REQ-7.1, REQ-7.2_

- [x] 2.6 Add `ModuleService.updateModuleAvailability(moduleId, available)`
  - Implement a method that sets `in_revision = !available` in Supabase. No pre-check performed here; the caller is responsible for invoking `checkAllLessonsValidated` first when enabling.
  - _Depends: 2.5_
  - _Implements: DES-5, REQ-7.3, REQ-7.4_

---

## Phase 3: UI Authoring Hooks

- [x] 3.1 Call `invalidateLesson` after save in `TabContent`
  - Inject `LessonService` into `TabContent` and call `invalidateLesson(lessonId)` immediately after a successful `saveLesson()` in edit mode.
  - _Depends: 2.2_
  - _Implements: DES-3, REQ-4.1_

- [x] 3.2 Call `invalidateLesson` after save in `TabExtraMaterial`
  - Inject `LessonService` into `TabExtraMaterial` and call `invalidateLesson(lessonId)` immediately after a successful `save()`.
  - _Depends: 2.2_
  - _Implements: DES-3, REQ-4.2_

- [x] 3.3 Call `invalidateLesson` after save in `TabQuiz`
  - Inject `LessonService` into `TabQuiz` and call `invalidateLesson(lessonId)` immediately after a successful `saveQuestion()`.
  - _Depends: 2.2_
  - _Implements: DES-3, REQ-4.3_

- [x] 3.4 Call `invalidateLesson` after save in `TabCode`
  - Inject `LessonService` into `TabCode` and call `invalidateLesson(lessonId)` immediately after a successful `saveCode()`.
  - _Depends: 2.2_
  - _Implements: DES-3, REQ-4.4_

---

## Phase 4: UI Feature Delivery

- [x] 4.1 Add validation status icons to the lesson list in `CreateSubmodule`
  - In `create-submodule.html`, add conditional icons next to the lesson title: check icon (green) when `lesson.isValidated === true`, warning icon when `lesson.isValidated === false`, no icon when `null`. Apply only to LESSON and CHALLENGE types; REVISION shows no icon.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-1.3, REQ-1.4, REQ-1.5, REQ-5.1, REQ-5.2, REQ-5.3_

- [x] 4.2 Add "Validar" button to the lesson list in `CreateSubmodule`
  - In `create-submodule.html`, add a "Validar" button in the action area of each lesson row. Show it only for LESSON and CHALLENGE types when `lesson.isValidated !== true`. Hide it for REVISION and when `isValidated === true`.
  - _Depends: 4.1_
  - _Implements: DES-4, REQ-1.1, REQ-1.2_

- [x] 4.3 Add `validateLesson` handler in `CreateSubmodule`
  - In `create-submodule.ts`, add a `validateLesson(lesson)` method that calls `LessonService.validateLesson()`, then updates the lesson's `isValidated` field in the local `lessons` signal without a full reload.
  - _Depends: 2.3, 2.4, 4.2_
  - _Implements: DES-4, REQ-2.6, REQ-2.7, REQ-3.3, REQ-3.4_

- [x] 4.4 Add `isAdmin` computed and `toggleAvailability` handler to `MyModules`
  - In `my-modules.ts`, inject `UserService`, add `isAdmin = computed(() => user?.role === 'admin')`, and implement `toggleAvailability(module, enabled)` that calls `ModuleService.checkAllLessonsValidated` before enabling, and calls `updateModuleAvailability` accordingly.
  - _Depends: 2.5, 2.6_
  - _Implements: DES-6, REQ-6.1, REQ-6.2, REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4_

- [x] 4.5 Add "Disponível" toggle to `my-modules.html`
  - Render the toggle only inside `@if (isAdmin())`. Bind its checked state to `!module.inRevision`. Wire the change event to `toggleAvailability`. Display an error alert when activation is blocked by unvalidated lessons.
  - _Depends: 4.4_
  - _Implements: DES-6, REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4_

---

## Phase 5: Acceptance Criteria Testing

- [ ] 5.1 Test: validate button visibility rules in lesson list
  - Verify the "Validar" button is shown for LESSON/CHALLENGE with `isValidated !== true`, hidden for REVISION, and hidden when `isValidated === true`.
  - Test type: unit
  - _Implements: REQ-1.1, REQ-1.2_

- [ ] 5.2 Test: status icon display per `isValidated` value
  - Verify check icon is shown when `isValidated === true`, warning icon when `false`, and no icon when `null`, for LESSON and CHALLENGE types.
  - Test type: unit
  - _Implements: REQ-1.3, REQ-1.4, REQ-1.5, REQ-5.1, REQ-5.2, REQ-5.3_

- [ ] 5.3 Test: LESSON validation checks all required content
  - Verify `validateLesson` returns `true` only when all LESSON checks pass (section content, extra material, standalone question, quiz with 10 questions, 4 answers each with exactly one correct), and `false` when any check fails.
  - Test type: unit
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6, REQ-2.7_

- [ ] 5.4 Test: CHALLENGE validation checks section content and code fields
  - Verify `validateLesson` returns `true` only when section content exists and both `language` and `initial_code` are non-empty, and `false` otherwise.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [ ] 5.5 Test: `invalidateLesson` is called after each save action in editing tabs
  - Verify that saving in TabContent, TabExtraMaterial, TabQuiz, and TabCode each trigger a call to `LessonService.invalidateLesson` with the correct lesson ID.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4_

- [ ] 5.6 Test: availability toggle is visible only to admin users
  - Verify the "Disponível" toggle is rendered when `user.role === 'admin'` and absent for other roles.
  - Test type: unit
  - _Implements: REQ-6.1, REQ-6.2_

- [ ] 5.7 Test: toggle state reflects `in_revision` field
  - Verify the toggle renders as off when `in_revision === true` and on when `in_revision === false`.
  - Test type: unit
  - _Implements: REQ-6.3, REQ-6.4_

- [ ] 5.8 Test: enabling availability is blocked when lessons are not all validated
  - Verify that when at least one non-REVISION lesson has `isValidated !== true`, activating the toggle is blocked and an alert is displayed.
  - Test type: unit
  - _Implements: REQ-7.1, REQ-7.2_

- [ ] 5.9 Test: enabling availability succeeds when all lessons are validated
  - Verify that when all non-REVISION lessons have `isValidated === true`, activating the toggle calls `updateModuleAvailability` with `available = true`.
  - Test type: unit
  - _Implements: REQ-7.3_

- [ ] 5.10 Test: disabling availability requires no validation
  - Verify that deactivating the toggle calls `updateModuleAvailability` with `available = false` without invoking `checkAllLessonsValidated`.
  - Test type: unit
  - _Implements: REQ-7.4_

---

## Phase 6: Final Checkpoint

- [~] 6.1 Verify all acceptance criteria
  - REQ-1: Confirm validate button and status icons follow all visibility rules in the lesson list.
  - REQ-2: Confirm LESSON validation checks all five content requirements and persists the correct result.
  - REQ-3: Confirm CHALLENGE validation checks section content and code fields correctly.
  - REQ-4: Confirm `is_validated` is reset to `null` after save in each of the four editing tabs.
  - REQ-5: Confirm check/warning/no-icon indicators match `is_validated` values.
  - REQ-6: Confirm "Disponível" toggle is admin-only and reflects `in_revision`.
  - REQ-7: Confirm activation is blocked when lessons are unvalidated and succeeds otherwise; deactivation requires no check.
  - Run `ng test` and confirm no regressions.
  - _Implements: All requirements_
