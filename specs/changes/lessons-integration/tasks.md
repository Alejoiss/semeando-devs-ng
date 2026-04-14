# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database & Migrations** - Create Supabase tables and migration files
2. **Angular Services** - Implement `LessonService` and `UserLessonService`
3. **Page Integration** - Wire services and reactive signals into `SubmoduleDetail` and `Lesson` pages
4. **Acceptance Criteria Testing** - Verify all requirement behaviors
5. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

---

## Phase 1: Database & Migrations

- [x] 1.1 Apply the `lessons` table migration to Supabase
  - Create `lessons` table with `id` (uuid PK), `sub_module_id` (FK → submodules with CASCADE), `title`, `description`, `type` (check constraint: LESSON | CHALLENGE | REVISION), `order` (int), RLS enabled, permissive SELECT policy for authenticated users.
  - Save the SQL as `supabase/migrations/<timestamp>_create_lessons.sql`.
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5, REQ-3.1_

- [x] 1.2 Apply the `user_lessons` table migration to Supabase
  - Create `user_lessons` table with `id` (uuid PK), `user_id` (FK → auth.users with CASCADE), `lesson_id` (FK → lessons with CASCADE), `completed` (boolean, default false), `completed_at` (timestamptz), RLS enabled, owner-scoped SELECT / INSERT / UPDATE policies.
  - Save the SQL as `supabase/migrations/<timestamp>_create_user_lessons.sql`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-3.2_

- [x] 1.3 Apply the `section_content` table migration to Supabase
  - Create `section_content` table with `id` (uuid PK), `lesson_id` (FK → lessons with CASCADE), `type` (check constraint: TEXT | MARKDOWN | VIDEO | IMAGE), `content` (text), `file` (text), `file_description` (text), `order` (int), RLS enabled, permissive SELECT policy.
  - Save the SQL as `supabase/migrations/<timestamp>_create_section_content.sql`.
  - _Depends: 1.1_
  - _Implements: DES-2, REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4, REQ-9.5, REQ-9.6_

---

## Phase 2: Angular Services

- [x] 2.1 Create `LessonService`
  - Generate `src/app/services/lesson.ts` using `ng g s`.
  - Implement `getLessonsBySubModuleSlug(slug: string): Promise<Lesson[]>` that queries the `lessons` table with an inner join to `submodules` filtering by `modules.slug` equals the given slug, ordered by `order ASC`.
  - Re-throw Supabase errors as `Error` objects. Provide `providedIn: 'root'`.
  - _Implements: DES-3, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 2.2 Create `UserLessonService`
  - Generate `src/app/services/user-lesson.ts` using `ng g s`.
  - Implement `getUserLessons(): Promise<UserLesson[]>` that calls `auth.getUser()`, throws `Error('User not authenticated')` if no user, then queries `user_lessons` selecting all columns with a join on `lessons`, filtered by `user_id`.
  - Re-throw Supabase errors as `Error` objects. Provide `providedIn: 'root'`.
  - _Implements: DES-4, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

---

## Phase 3: Page Integration

- [x] 3.1 Refactor `SubmoduleDetail` component logic
  - Update `src/app/pages/app/submodule-detail/submodule-detail.ts`.
  - Add `ChangeDetectionStrategy.OnPush`. Remove `standalone: true` from decorator.
  - Inject `ActivatedRoute`, `SubModuleService`, `LessonService`, `UserLessonService`.
  - Add signals: `submodule`, `lessons`, `userLessons`, `isLoading`, `error`.
  - On `ngOnInit`, read `slug` and `slugSubmodule` from route snapshot; fetch submodule, lessons, and user lessons in parallel with `Promise.all`; set signals; handle errors.
  - Add `computed()` for `lessonsWithState: LessonWithState[]` using a `Map<string, UserLesson>` keyed by `lesson.id`, deriving `progressState` for each lesson.
  - _Depends: 2.1, 2.2_
  - _Implements: DES-5, REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4_

- [x] 3.2 Update `SubmoduleDetail` template
  - Update `src/app/pages/app/submodule-detail/submodule-detail.html`.
  - Replace static header content with `submodule()?.title` and `submodule()?.description`.
  - Add loading skeleton state (`@if (isLoading())`), error state (`@else if (error())`), and data state (`@else`).
  - Iterate `@for (item of lessonsWithState(); track item.lesson.id)` to render lesson cards showing: type badge (LESSON / CHALLENGE / REVISION with appropriate color per type), `title`, `description`, progress state indicator (completed / in-progress / not-started), static "Nota: 10/10" badge when `progressState === 'completed'`.
  - Add `[routerLink]` on each lesson card navigating to `['lesson', item.lesson.id]` relative path.
  - _Depends: 3.1_
  - _Implements: DES-5, REQ-8.5, REQ-8.6, REQ-8.7, REQ-8.8, REQ-8.9, REQ-8.10_

- [x] 3.3 Refactor `Lesson` component logic
  - Update `src/app/pages/app/lesson/lesson.ts`.
  - Remove static `codeSnippet` field. Add `ChangeDetectionStrategy.OnPush`. Remove `standalone: true` from decorator.
  - Inject `ActivatedRoute`, `LessonService`, `UserLessonService`.
  - Add signals: `lessons`, `userLessons`, `lessonId`, `isLoading`, `error`.
  - On `ngOnInit`, read `slugSubmodule` and `lessonId` from route snapshot; fetch lessons and user lessons in parallel with `Promise.all`; set signals; handle errors.
  - Add `computed()` for `lessonsWithState: LessonWithState[]` (same pattern as DES-5).
  - Add `computed()` for `activeLesson: Lesson | undefined` that finds the lesson whose `id` matches the `lessonId` signal.
  - _Depends: 2.1, 2.2_
  - _Implements: DES-6, REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4_

- [x] 3.4 Update `Lesson` template header and sidebar
  - Update `src/app/pages/app/lesson/lesson.html`.
  - Replace static header `<h1>` and description `<p>` with `activeLesson()?.title` and `activeLesson()?.description`.
  - Add loading state (full-width skeleton), error state, and wrapper `@if / @else if / @else` at the page level.
  - Update the sidebar checklist section to iterate `@for (item of lessonsWithState(); track item.lesson.id)`, showing each lesson with its progress indicator; apply a visual highlight class when `item.lesson.id === lessonId()`.
  - _Depends: 3.3_
  - _Implements: DES-6, REQ-6.5, REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: lessons table schema and RLS
  - Verify the `lessons` table exists with all required columns, PK, FK to submodules with cascade, and that the type check constraint accepts LESSON, CHALLENGE, REVISION.
  - Verify the SELECT RLS policy is active and allows authenticated reads.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5_

- [x] 4.2 Test: user_lessons table schema and RLS
  - Verify the `user_lessons` table exists with all required columns, PK, FKs (user_id → auth.users, lesson_id → lessons) with cascades, completed default false, RLS active.
  - Verify SELECT / INSERT / UPDATE policies are owner-scoped.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5_

- [x] 4.3 Test: migration files exist
  - Verify three migration files are present under `supabase/migrations/`: one for lessons, one for user_lessons, one for section_content.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2, REQ-9.6_

- [x] 4.4 Test: LessonService returns ordered lessons by sub-module slug
  - Mock Supabase client; verify `getLessonsBySubModuleSlug` issues a join query filtered by slug and ordered by `order ASC`, and maps the result to `Lesson[]`.
  - Verify that a Supabase error is re-thrown as a standard `Error`.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 4.5 Test: UserLessonService authentication guard and data retrieval
  - Mock `auth.getUser()` to return null; verify `getUserLessons()` throws an authentication error.
  - Mock authenticated user; verify the service queries `user_lessons` and maps results to `UserLesson[]`.
  - Verify Supabase query errors are re-thrown.
  - Test type: unit
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

- [x] 4.6 Test: SubmoduleDetail loading, error, and data states
  - Mock services to simulate a loading state and verify the loading indicator is shown.
  - Mock services to throw an error and verify the error message is displayed.
  - Mock services to return data; verify sub-module title and description appear in the header.
  - Test type: unit
  - _Implements: REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4_

- [x] 4.7 Test: SubmoduleDetail lesson list with progress states and navigation
  - Mock services with a set of lessons and user_lessons; verify lessons are displayed in ascending order.
  - Verify `completed`, `in-progress`, and `not-started` indicators are shown for the correct lessons.
  - Verify a static "Nota: 10/10" label is shown for completed lessons.
  - Verify each lesson card navigates to the correct lesson route on click.
  - Test type: unit
  - _Implements: REQ-8.5, REQ-8.6, REQ-8.7, REQ-8.8, REQ-8.9, REQ-8.10_

- [x] 4.8 Test: Lesson page reads route params and fetches data
  - Provide a route with `slugSubmodule` and `lessonId` params; verify the component reads them and calls `getLessonsBySubModuleSlug` and `getUserLessons`.
  - Verify the loading indicator is shown during fetch and the error message is shown on failure.
  - Verify the active lesson title and description appear in the header after successful fetch.
  - Test type: unit
  - _Implements: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5_

- [x] 4.9 Test: Lesson page sidebar progress list and active lesson highlight
  - Mock services; verify all lessons for the sub-module are shown in the sidebar in ascending order.
  - Verify completed, in-progress, and not-started indicators are applied correctly.
  - Verify the currently active lesson (matching `lessonId`) is visually highlighted.
  - Test type: unit
  - _Implements: REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5_

- [x] 4.10 Test: section_content table schema and RLS
  - Verify `section_content` table exists with all required columns, PK, FK to lessons with cascade, type check constraint (TEXT, MARKDOWN, VIDEO, IMAGE), RLS active with SELECT policy.
  - Test type: integration
  - _Implements: REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4, REQ-9.5_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1 through REQ-3: Confirm `lessons`, `user_lessons` tables and all migration files are present and correct.
  - REQ-4 through REQ-5: Confirm `LessonService` and `UserLessonService` behave as specified under success and failure conditions.
  - REQ-6 through REQ-7: Confirm the `Lesson` page dynamically loads and displays the active lesson and sidebar progress list from real route parameters.
  - REQ-8: Confirm the `SubmoduleDetail` page dynamically loads sub-module data and renders the full lesson list with correct progress states and navigation.
  - REQ-9: Confirm `section_content` table, migration, and RLS are in place.
  - Run `ng build` to verify no TypeScript compilation errors. Run unit tests with `ng test`.
  - _Implements: All requirements_
