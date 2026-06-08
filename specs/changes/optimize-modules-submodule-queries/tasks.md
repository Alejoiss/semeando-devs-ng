# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Service Layer Optimizations** - Add new lightweight service methods for optimized data fetching
2. **Page Component Rewrites** - Rewrite the Modules and Submodule page load logic to use the new service methods
3. **Acceptance Criteria Testing** - Verify all requirement behaviors are preserved
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small-Medium (2-3 sessions)

## Phase 1: Service Layer Optimizations

- [x] 1.1 Add `getModulesForDisplay()` to ModuleService
  - Add a new method that selects only the columns needed for the Modules page display: `id, title, description, slug, avatar, icon, in_revision`.
  - The existing `getModules()` method remains unchanged.
  - _Implements: DES-1_
  - _Implements: REQ-4.1_

- [x] 1.2 Add `getUserModulesForUser(userId)` to UserModuleService
  - Add a new method that accepts a pre-resolved `userId` parameter, skips `auth.getUser()`, and selects only `module_id, completed` (without joining the full module row).
  - The existing `getUserModules()` method remains unchanged.
  - _Implements: DES-1_
  - _Implements: DES-3_
  - _Implements: REQ-4.2_

- [x] 1.3 Add `getUserLessonsForUser(userId)` to UserLessonService
  - Add a new method that accepts a pre-resolved `userId` parameter, skips `auth.getUser()`, and selects only `id, completed, lesson:lessons(id, sub_module_id)` (lightweight join).
  - The existing `getUserLessons()` method remains unchanged.
  - _Implements: DES-1_
  - _Implements: DES-3_

- [x] 1.4 Add `getUserSubModulesForUser(userId)` to UserSubModuleService
  - Add a new method that accepts a pre-resolved `userId` parameter and skips `auth.getUser()`.
  - The existing `getUserSubModules()` method remains unchanged.
  - _Implements: DES-3_

- [x] 1.5 Add `getLessonsByModuleSlug(slug)` to LessonService
  - Add a new method that batch-fetches all lessons for a module in a single query using the join path `lessons → submodules → modules`, filtered by the module slug. Select `id, order, sub_module_id` at minimum.
  - _Implements: DES-2_

## Phase 2: Page Component Rewrites

- [x] 2.1 Rewrite Modules page `loadData()` and `modulesWithState`
  - Resolve the user ID once from `UserService.currentUser()`.
  - Replace the `Promise.all` call to use `getModulesForDisplay()`, `getUserModulesForUser(userId)`, `getUserLessonsForUser(userId)`, and `getRanking()`.
  - Remove the `getAllLessons()` call entirely.
  - Remove the `lessonService` and `lessons` signal since they are no longer needed.
  - Rewrite the `modulesWithState` computed to derive progress from the lightweight user lessons data (grouping completed user lessons by module via submodule relationships) instead of cross-referencing the full lessons catalog.
  - For in-progress modules, compute progress as completed lessons in module / total lessons in module using the user lessons data and a count of total lessons per module's submodules.
  - _Depends: 1.1, 1.2, 1.3_
  - _Implements: DES-1_
  - _Implements: DES-3_
  - _Implements: DES-4_
  - _Implements: REQ-1.1_
  - _Implements: REQ-1.2_
  - _Implements: REQ-3.1_

- [x] 2.2 Rewrite Submodule page `loadData()`
  - Resolve the user ID once from `UserService.currentUser()`.
  - Restructure loading into two parallel groups using `Promise.all`:
    - **Group 1** (no dependencies): `getSubModulesByModuleSlug(slug)`, `getUserSubModulesForUser(userId)`, `getUserLessonsForUser(userId)`, `getModuleBySlug(slug)`, `getLessonsByModuleSlug(slug)`.
    - **Group 2** (depends on module ID): `getAchievementByModuleId(moduleId)`, `getSectionContentsByModuleId(moduleId)`.
  - Replace the `for` loop calling `getLessonsBySubModuleSlug(sm.slug)` with in-memory grouping of the batch-fetched lessons by `sub_module_id`.
  - Preserve the existing submodule state computation logic (not-started, in-progress, completed, blocked, isPro gating).
  - _Depends: 1.3, 1.4, 1.5_
  - _Implements: DES-2_
  - _Implements: DES-3_
  - _Implements: DES-4_
  - _Implements: REQ-2.1_
  - _Implements: REQ-2.2_
  - _Implements: REQ-3.2_
  - _Implements: REQ-5.1_
  - _Implements: REQ-5.2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: modules page does not fetch all lessons
  - Verify the Modules page no longer calls `getAllLessons()` or fetches from the `lessons` table with deep submodule/module joins.
  - Test type: manual
  - _Depends: 2.1_
  - _Implements: REQ-1.1_

- [x] 3.2 Test: modules page progress uses lightweight data
  - Verify module progress percentages are computed from user lesson completion records and module completion status, not from the full lessons catalog.
  - Test type: manual
  - _Depends: 2.1_
  - _Implements: REQ-1.2_

- [x] 3.3 Test: modules page displays identical progress
  - Verify the Modules page renders the same progress bars, percentages, and module states (not-started, in-progress, completed) as before the optimization.
  - Test type: manual
  - _Depends: 2.1_
  - _Implements: REQ-1.3_

- [x] 3.4 Test: submodule page fetches lessons in a single query
  - Verify the Submodule page issues exactly one lessons query for the entire module instead of one per submodule.
  - Test type: manual
  - _Depends: 2.2_
  - _Implements: REQ-2.1_

- [x] 3.5 Test: submodule page derives state from batch data
  - Verify submodule target lesson IDs and progress percentages are correctly derived from the batch-fetched lessons.
  - Test type: manual
  - _Depends: 2.2_
  - _Implements: REQ-2.2_

- [x] 3.6 Test: submodule page displays identical states
  - Verify the Submodule page renders the same submodule cards with identical states (not-started, in-progress, completed, blocked), progress percentages, and navigation links.
  - Test type: manual
  - _Depends: 2.2_
  - _Implements: REQ-2.3_

- [x] 3.7 Test: auth is invoked at most once per page load
  - Verify the Modules page and Submodule page each invoke `supabase.auth.getUser()` zero times (using pre-resolved `currentUser()` instead), or at most once if the ranking service still needs it.
  - Test type: manual
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 3.8 Test: modules page fetches only needed columns
  - Verify the modules query selects only `id, title, description, slug, avatar, icon, in_revision` and the user_modules query selects only `module_id, completed`.
  - Test type: manual
  - _Depends: 2.1_
  - _Implements: REQ-4.1, REQ-4.2_

- [x] 3.9 Test: submodule page fetches concurrently
  - Verify independent requests on the Submodule page (submodules, user submodules, user lessons, module, lessons) are issued concurrently via `Promise.all`, and dependent requests (achievement, section contents) execute only after the module ID is available.
  - Test type: manual
  - _Depends: 2.2_
  - _Implements: REQ-5.1, REQ-5.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm the Modules page no longer fetches all lessons and displays identical progress.
  - REQ-2: Confirm the Submodule page fetches lessons in a single batch and displays identical states.
  - REQ-3: Confirm auth is invoked at most once per page load.
  - REQ-4: Confirm only needed columns are fetched on the Modules page.
  - REQ-5: Confirm the Submodule page parallelizes independent requests.
  - Run the existing test suite (`ng test`) and resolve any failures.
  - Build the application (`ng build`) and confirm no compilation errors.
  - _Implements: All requirements_
