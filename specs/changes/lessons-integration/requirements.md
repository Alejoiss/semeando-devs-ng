# Requirements

## Overview

The Semeando Devs platform needs to persist and display **Lessons** — the atomic learning units within a sub-module. Currently the lesson page renders static placeholder content. Users have no way to see which lessons belong to a given sub-module, nor can they track their individual progress per lesson (not started, in progress, or completed).

This feature creates the `lessons` and `user_lessons` database tables in Supabase, exposes them through dedicated Angular services, and integrates data retrieval and progress display into the existing lesson page. The lesson page already receives route parameters (`slug`, `slugSubmodule`, and `lessonId`) and must use them to fetch the correct data.

The implementation follows the same architectural patterns already established for modules, sub-modules, and their user-progress counterparts.

## Glossary

| Term | Definition |
|------|------------|
| Lesson | An atomic learning unit (of type LESSON, CHALLENGE, or REVISION) that belongs to a single sub-module. |
| UserLesson | A join record linking an authenticated user to a lesson and recording whether that lesson has been completed. |
| Progress State | One of three values — `not-started`, `in-progress`, or `completed` — that describes a user's relationship with a lesson. |
| Sub-module slug | A URL-friendly identifier for a sub-module, passed as the `:slugSubmodule` route parameter. |
| Lesson ID | The UUID primary key of a lesson, passed as the `:lessonId` route parameter. |
| SectionContent | An ordered content block within a lesson, of one of four types: TEXT, MARKDOWN, VIDEO, or IMAGE. |
| SectionContentType | Enum describing the rendering type of a content block: TEXT (plain text), MARKDOWN (rich text/code), VIDEO (video embed), IMAGE (image asset). |

## Assumptions

- The `submodules` table already exists in Supabase and its `id` field is used as the foreign key for `lessons`.
- Authenticated users are managed via Supabase Auth; the `auth.uid()` function is available for RLS policies.
- A lesson is considered "in progress" when a `UserLesson` record exists but `completed` is `false`.
- A lesson is considered "completed" when a `UserLesson` record exists and `completed` is `true`.
- A lesson is considered "not started" when no corresponding `UserLesson` record exists for the current user.
- The lesson page `:lessonId` route parameter holds the UUID of the specific lesson being viewed.
- The lesson page `:slugSubmodule` route parameter is used solely for breadcrumb / contextual display and to scope the sidebar lesson list.

## Requirements

### REQ-1: Lessons Database Table

**User Story:** As a platform administrator, I want a `lessons` table in the database, so that lesson data persists and can be queried by the application.

#### Acceptance Criteria

1.1 THE database SHALL store each lesson with an `id`, `title`, `description`, `type` (enum: LESSON, CHALLENGE, or REVISION), `order`, and `sub_module_id` foreign key referencing `submodules`.

1.2 THE database SHALL enforce a primary key on the `id` column of the `lessons` table.

1.3 THE database SHALL enforce a foreign key constraint between `lessons.sub_module_id` and `submodules.id` with cascading delete.

1.4 THE database SHALL enable Row Level Security on the `lessons` table.

1.5 THE database SHALL grant SELECT access on the `lessons` table to all authenticated users via an RLS policy.

### REQ-2: User Lessons Progress Table

**User Story:** As a platform administrator, I want a `user_lessons` table in the database, so that each user's progress per lesson is persisted independently.

#### Acceptance Criteria

2.1 THE database SHALL store each user-lesson record with an `id`, `user_id` (foreign key to `auth.users`), `lesson_id` (foreign key to `lessons`), `completed` boolean, and `completed_at` timestamp.

2.2 THE database SHALL enforce a primary key on the `id` column of the `user_lessons` table.

2.3 THE database SHALL enforce foreign key constraints from `user_lessons.user_id` to `auth.users.id` and from `user_lessons.lesson_id` to `lessons.id` with cascading deletes.

2.4 THE database SHALL enable Row Level Security on the `user_lessons` table.

2.5 THE database SHALL allow authenticated users to SELECT, INSERT, and UPDATE only their own `user_lessons` records via RLS policies.

### REQ-3: Lesson Migration Files

**User Story:** As a developer, I want SQL migration files for the lessons and user_lessons tables, so that database changes are version-controlled and reproducible.

#### Acceptance Criteria

3.1 THE application SHALL include a SQL migration file that creates the `lessons` table with all required columns, constraints, and RLS policies.

3.2 THE application SHALL include a separate SQL migration file that creates the `user_lessons` table with all required columns, constraints, and RLS policies.

### REQ-4: Lesson Angular Service

**User Story:** As a developer, I want a `LessonService` in Angular, so that components can retrieve lessons from Supabase without coupling database logic to the view layer.

#### Acceptance Criteria

4.1 WHEN a component requests lessons for a specific sub-module slug, THEN the lesson service SHALL return an ordered list of `Lesson` objects belonging to that sub-module.

4.2 IF the Supabase query fails, THEN the lesson service SHALL throw an error with the Supabase error message.

4.3 THE lesson service SHALL be provided in the root injector as a singleton.

### REQ-5: User Lesson Angular Service

**User Story:** As a developer, I want a `UserLessonService` in Angular, so that components can retrieve and update a user's lesson progress from Supabase.

#### Acceptance Criteria

5.1 WHILE the user is authenticated, WHEN a component requests user-lesson records, THEN the user lesson service SHALL return all `UserLesson` records for the current user.

5.2 IF the user is not authenticated, THEN the user lesson service SHALL throw an authentication error.

5.3 IF the Supabase query fails, THEN the user lesson service SHALL throw an error with the Supabase error message.

5.4 THE user lesson service SHALL be provided in the root injector as a singleton.

### REQ-6: Lesson Page — Dynamic Data Loading

**User Story:** As a student, I want the lesson page to load real lesson data from the database when I navigate to a lesson, so that I see accurate content instead of placeholder text.

#### Acceptance Criteria

6.1 WHEN the lesson page initialises, THEN the application SHALL read the `slugSubmodule` and `lessonId` route parameters to determine which lesson and sub-module to fetch.

6.2 WHEN the lesson page loads, THEN the application SHALL fetch the list of lessons for the current sub-module and the current user's lesson progress records in parallel.

6.3 WHILE the lesson page is fetching data, THEN the application SHALL display a loading state to the user.

6.4 IF the data fetch fails, THEN the application SHALL display an error message to the user.

6.5 WHEN data is successfully loaded, THEN the application SHALL display the active lesson's `title` and `description` in the page header.

### REQ-7: Lesson Page — Lesson Progress Sidebar

**User Story:** As a student, I want to see all lessons of the current sub-module listed in the sidebar with their progress state, so that I know which lessons I have completed, started, or not yet begun.

#### Acceptance Criteria

7.1 WHEN the lesson page renders the sidebar, THEN the application SHALL display each lesson belonging to the current sub-module in ascending order.

7.2 WHEN displaying a lesson in the sidebar, THEN the application SHALL show a `completed` indicator for lessons where the user has a `UserLesson` record with `completed = true`.

7.3 WHEN displaying a lesson in the sidebar, THEN the application SHALL show an `in-progress` indicator for lessons where the user has a `UserLesson` record with `completed = false`.

7.4 WHEN displaying a lesson in the sidebar, THEN the application SHALL show a `not-started` indicator for lessons with no corresponding `UserLesson` record for the current user.

7.5 WHEN displaying a lesson in the sidebar, THEN the application SHALL visually highlight the currently active lesson.

### REQ-8: Submodule Detail Page

**User Story:** As a student, I want to see a detail page for a sub-module, so that I can review its description, my overall progress, and the full list of its lessons with their individual statuses.

#### Acceptance Criteria

8.1 WHEN a student navigates to the sub-module detail route (`s/:slug/ss/:slugSubmodule`), THEN the application SHALL fetch and display the sub-module's `title` and `description`.

8.2 WHEN the submodule detail page loads, THEN the application SHALL fetch the list of lessons for the current sub-module and the current user's lesson progress records in parallel.

8.3 WHILE the submodule detail page is fetching data, THEN the application SHALL display a loading state to the user.

8.4 IF the data fetch fails, THEN the application SHALL display an error message to the user.

8.5 WHEN the submodule detail page renders the lesson list, THEN the application SHALL display each lesson in ascending order with its `type` badge (LESSON, CHALLENGE, or REVISION), `title`, `description`, and progress state (not-started, in-progress, or completed).

8.6 WHEN displaying a lesson entry on the submodule detail page, THEN the application SHALL show a `completed` indicator for lessons where the user has a `UserLesson` record with `completed = true`.

8.7 WHEN displaying a lesson entry on the submodule detail page, THEN the application SHALL show an `in-progress` indicator for lessons where the user has a `UserLesson` record with `completed = false`.

8.8 WHEN displaying a lesson entry on the submodule detail page, THEN the application SHALL show a `not-started` indicator for lessons with no corresponding `UserLesson` record for the current user.

8.9 WHEN displaying a completed lesson entry, THEN the application SHALL show a static grade display (e.g., "Nota: 10/10") as a placeholder until the grading system is implemented.

8.10 WHEN a student clicks a lesson entry on the submodule detail page, THEN the application SHALL navigate to the corresponding lesson route (`s/:slug/ss/:slugSubmodule/lesson/:lessonId`).

### REQ-9: Section Content Table and Migration

**User Story:** As a platform administrator, I want a `section_content` table in the database, so that each lesson's content can be composed of ordered, typed content blocks (text, markdown, image, video).

#### Acceptance Criteria

9.1 THE database SHALL store each section content block with an `id`, `lesson_id` (foreign key to `lessons`), `type` (enum: TEXT, MARKDOWN, VIDEO, IMAGE), `content` text field, `file` text field, `file_description` text field, and `order` integer.

9.2 THE database SHALL enforce a primary key on the `id` column of the `section_content` table.

9.3 THE database SHALL enforce a foreign key constraint between `section_content.lesson_id` and `lessons.id` with cascading delete.

9.4 THE database SHALL enable Row Level Security on the `section_content` table.

9.5 THE database SHALL grant SELECT access on the `section_content` table to all authenticated users via an RLS policy.

9.6 THE application SHALL include a SQL migration file that creates the `section_content` table with all required columns, constraints, and RLS policies.

