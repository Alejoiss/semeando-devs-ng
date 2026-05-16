# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database & Models** - Prepare the data layer for roles and ownership.
2. **Security & Routing** - Implement the authorization guard and configure the teacher route.
3. **UI & Components** - Integrate the teacher area into the navigation and create the entry component.
4. **Acceptance Criteria Testing** - Verify that all requirements are met through testing.
5. **Final Checkpoint** - Validate completeness and readiness for deployment.

**Estimated Effort**: Medium (3-4 sessions)

## Phase 1: Database & Models

- [x] 1.1 Create SQL migration for teacher area setup
  - Add `role` column to `profiles` with default 'student' and check constraint.
  - Create `teacher_modules` table with unique constraint on `(teacher_id, module_id)`.
  - Add `created_by` column to `modules` and `lessons` tables.
  - Implement RLS policies for `teacher_modules`.
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5, REQ-1.6, REQ-2.3_

- [x] 1.2 Update Profile model
  - Add `role` field to the `Profile` interface in `src/models/profile/profile.ts`.
  - _Implements: DES-1_

## Phase 2: Security & Routing

- [x] 2.1 Implement `teacherGuard`
  - Create the guard logic in `src/app/components/guards/teacher.guard.ts`.
  - Use `UserService` to check the current user's profile role.
  - _Implements: DES-2, REQ-2.1, REQ-2.2_

- [x] 2.2 Configure `'professor'` sibling route
  - Update `src/app/app.routes.ts` to add the `'professor'` route.
  - Protect it with `authGuard` and `teacherGuard`.
  - _Implements: DES-3, REQ-3.1_

## Phase 3: UI & Components

- [x] 3.1 Create `ProfessorApp` component
  - Generate a standalone component at `src/app/pages/professor/professor-app`.
  - _Implements: DES-4, REQ-4.1, REQ-4.2_

- [x] 3.2 Update `aside-menu` for teacher access
  - Add "Área do Professor" link to `src/app/components/aside-menu/aside-menu.html`.
  - Implement role-based visibility logic using the user's role signal.
  - _Implements: DES-3, REQ-3.2, REQ-3.3, REQ-3.4_

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: database schema and constraints
  - Verify `profiles.role` exists and defaults to 'student'.
  - Verify `teacher_modules` table exists.
  - Verify `created_by` columns exist in `modules` and `lessons`.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5, REQ-1.6_

- [x] 4.2 Test: block unauthorized access to teacher area
  - Verify that a student role user is redirected to home when accessing `/professor`.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 4.3 Test: allow authorized access to teacher area
  - Verify that a teacher or admin role user can access `/professor`.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-3.1_

- [x] 4.4 Test: menu link visibility
  - Verify "Área do Professor" is visible only for teachers and admins in the aside menu.
  - Test type: e2e
  - _Implements: REQ-3.3, REQ-3.4_

- [x] 4.5 Test: foundation component rendering
  - Verify that `ProfessorApp` renders when accessing the teacher route.
  - Test type: e2e
  - _Implements: REQ-4.2_

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm database schema supports roles, assignments, and ownership.
  - REQ-2: Confirm teacher guard protects routes and RLS is active.
  - REQ-3: Confirm navigation and routing are correctly configured.
  - REQ-4: Confirm foundation components are present.
  - _Implements: All requirements_
