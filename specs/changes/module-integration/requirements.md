# Requirements

## Overview

The Semeando Devs platform currently shows a static, hardcoded list of learning modules on the Modules page. There is no persistence layer for module data, no record of which modules a user has started or completed, and no way to link module progress to individual users.

This feature introduces two new database tables — `modules` and `user_modules` — backed by migrations, along with dedicated Angular services that query and expose this data to the frontend. The Modules page must be updated to render dynamic data from these services, displaying each module's title, description, icon, avatar, and the current user's progress state (not started, in progress, or completed).

The goal is to give users a personalized, accurate view of their learning journey while establishing the data foundation required for future gamification and curriculum features.

## Glossary

| Term | Definition |
|------|------------|
| Module | A top-level learning track (e.g. HTML, CSS, JavaScript) with a title, description, avatar image URL, and icon identifier |
| UserModule | A join record that links a specific User to a specific Module, recording whether the module has been completed and when |
| Progress State | The visual status of a module for the current user: not started (no UserModule record), in progress (UserModule exists, `completed = false`), or completed (`completed = true`) |
| Current User | The authenticated user whose session is active in the application |
| Migration | A versioned SQL script applied to Supabase to create or alter database schema |

## Assumptions

- The `User` entity is managed by Supabase Auth; the `user_modules` table references `auth.users(id)` via a UUID foreign key.
- A user can be enrolled in multiple modules simultaneously.
- `completedAt` is nullable; it is only set when `completed` is `true`.
- Module ordering on the Modules page follows the database insertion order unless a future ordering field is added.
- Row-Level Security (RLS) must be enabled on both new tables, consistent with existing tables in the project.

## Requirements

### REQ-1: Modules Database Table

**User Story:** As a platform administrator, I want a `modules` table in the database, so that module data is persisted and can be managed centrally.

#### Acceptance Criteria

1.1 THE database migration system SHALL create a `modules` table with columns: `id` (UUID primary key), `title` (text, not null), `description` (text, not null), `avatar` (text, not null), and `icon` (text, not null).

1.2 THE `modules` table SHALL have Row-Level Security enabled, with a policy that allows authenticated users to read all rows.

1.3 THE database migration system SHALL record the `modules` table creation in a versioned migration file.

---

### REQ-2: User Modules Database Table

**User Story:** As a platform administrator, I want a `user_modules` table in the database, so that each user's progress per module is tracked persistently.

#### Acceptance Criteria

2.1 THE database migration system SHALL create a `user_modules` table with columns: `id` (UUID primary key), `user_id` (UUID, foreign key referencing `auth.users(id)`), `module_id` (UUID, foreign key referencing `modules(id)`), `completed` (boolean, not null, default `false`), and `completed_at` (timestamptz, nullable).

2.2 THE `user_modules` table SHALL have Row-Level Security enabled, with a policy that allows an authenticated user to read only rows where `user_id` matches their own authenticated user ID.

2.3 THE `user_modules` table SHALL have Row-Level Security enabled, with a policy that allows an authenticated user to insert rows only where `user_id` matches their own authenticated user ID.

2.4 THE database migration system SHALL record the `user_modules` table creation in a versioned migration file.

---

### REQ-3: Module Service

**User Story:** As a developer, I want a dedicated Angular service for modules, so that module data is fetched from Supabase in a reusable and testable way.

#### Acceptance Criteria

3.1 THE Module service SHALL expose a method that retrieves all rows from the `modules` table and returns them typed as `Module[]`.

3.2 WHEN a Supabase query error occurs, THEN the Module service SHALL throw an error with the Supabase error message.

---

### REQ-4: User Module Service

**User Story:** As a developer, I want a dedicated Angular service for user modules, so that user-specific module progress can be fetched and managed in a reusable and testable way.

#### Acceptance Criteria

4.1 THE UserModule service SHALL expose a method that retrieves all `user_modules` rows for the currently authenticated user, joining the related `module` data, and returns them typed as `UserModule[]`.

4.2 WHEN the current user has no `user_modules` records, THEN the UserModule service SHALL return an empty array.

4.3 WHEN a Supabase query error occurs, THEN the UserModule service SHALL throw an error with the Supabase error message.

---

### REQ-5: Modules Page — Dynamic Data

**User Story:** As a student, I want the Modules page to show real module data with my personal progress, so that I can see which modules I have started or completed.

#### Acceptance Criteria

5.1 WHEN the Modules page loads, THEN the application SHALL fetch all modules from the Module service and display one card per module.

5.2 WHEN the Modules page loads, THEN the application SHALL fetch the current user's user_modules from the UserModule service and correlate them with the fetched modules.

5.3 WHILE the Modules page is loading data, the application SHALL display a loading indicator in place of the module list.

5.4 WHEN a module has no corresponding UserModule record for the current user, THEN the application SHALL display a "Começar" (start) action button for that module.

5.5 WHEN a module has a corresponding UserModule record with `completed = false`, THEN the application SHALL display a "Continuar" (continue) action button for that module.

5.6 WHEN a module has a corresponding UserModule record with `completed = true`, THEN the application SHALL display a "Concluído" (completed) visual indicator for that module.

5.7 WHEN fetching module data results in an error, THEN the application SHALL display an error message to the user in place of the module list.

5.8 THE Modules page SHALL display each module's `title`, `description`, and `icon` field within its card.
