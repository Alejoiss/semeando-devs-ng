# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database Foundation** — Apply Supabase migrations and verify RLS policies for `modules` and `user_modules`
2. **Service Layer** — Create `ModuleService` and `UserModuleService`
3. **Component Integration** — Refactor the `Modules` page to signal-driven dynamic rendering
4. **Acceptance Criteria Testing** — Verify all requirement behaviors
5. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Medium (2-3 sessions)

---

## Phase 1: Database Foundation

- [x] 1.1 Apply `modules` table migration
  - Use the Supabase MCP to apply a migration that creates the `modules` table with columns `id` (UUID PK, default `gen_random_uuid()`), `title` (text not null), `description` (text not null), `avatar` (text not null), and `icon` (text not null).
  - Enable RLS and add a `SELECT` policy for authenticated users.
  - Save the SQL to `supabase/migrations/<timestamp>_create_modules_table.sql`.
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 1.2 Apply `user_modules` table migration
  - Use the Supabase MCP to apply a migration that creates the `user_modules` table with columns `id` (UUID PK, default `gen_random_uuid()`), `user_id` (UUID not null, FK → `auth.users(id)` on delete cascade), `module_id` (UUID not null, FK → `modules(id)` on delete cascade), `completed` (boolean not null default `false`), and `completed_at` (timestamptz nullable).
  - Enable RLS. Add a `SELECT` policy scoped to `auth.uid() = user_id`. Add an `INSERT` policy scoped to `auth.uid() = user_id`.
  - Save the SQL to `supabase/migrations/<timestamp>_create_user_modules_table.sql`.
  - _Depends: 1.1_
  - _Implements: DES-2, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [x] 1.3 Verify RLS policies with Supabase advisor
  - Run `mcp_supabase_get_advisors` for security advisors and confirm no unprotected-table warnings exist for `modules` or `user_modules`.
  - _Depends: 1.2_
  - _Implements: DES-1, DES-2_

---

## Phase 2: Service Layer

- [x] 2.1 Create `ModuleService`
  - Run `ng g s app/services/module` to scaffold the service.
  - Initialize a `SupabaseClient` in the constructor using `environment.supabaseUrl` and `environment.supabaseKey`, matching the pattern in `UserService`.
  - Implement `getModules(): Promise<Module[]>` that queries the `modules` table via `supabase.from('modules').select('*')`.
  - On error, throw with the Supabase error message.
  - _Implements: DES-3, REQ-3.1, REQ-3.2_

- [x] 2.2 Create `UserModuleService`
  - Run `ng g s app/services/user-module` to scaffold the service.
  - Initialize a `SupabaseClient` in the constructor using `environment.supabaseUrl` and `environment.supabaseKey`.
  - Implement `getUserModules(): Promise<UserModule[]>` that:
    1. Resolves the authenticated user's ID via `supabase.auth.getUser()`; throws `"User not authenticated"` if absent.
    2. Queries `supabase.from('user_modules').select('*, module:modules(*)').eq('user_id', userId)`.
    3. Returns `[]` when no rows exist.
    4. Throws with the Supabase error message on query error.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-4.1, REQ-4.2, REQ-4.3_

---

## Phase 3: Component Integration

- [x] 3.1 Refactor `Modules` component TypeScript
  - Update `src/app/pages/app/modules/modules.ts` to:
    - Add `ChangeDetectionStrategy.OnPush`.
    - Inject `ModuleService` and `UserModuleService` via `inject()`.
    - Declare signals: `modules = signal<Module[]>([])`, `userModules = signal<UserModule[]>([])`, `isLoading = signal(true)`, `error = signal<string | null>(null)`.
    - Add a `computed()` signal `modulesWithState` that maps each `Module` to `{ module, progressState: 'not-started' | 'in-progress' | 'completed' }` by looking up the module's `id` in `userModules()`.
    - Implement `ngOnInit` that calls `Promise.all([moduleService.getModules(), userModuleService.getUserModules()])`, sets the respective signals on success, sets `error` on failure, and always sets `isLoading(false)`.
  - _Depends: 2.2_
  - _Implements: DES-5, REQ-5.1, REQ-5.2_

- [x] 3.2 Update `Modules` component template — loading and error states
  - In `src/app/pages/app/modules/modules.html`, replace the static module list area with:
    - An `@if (isLoading())` block showing a loading skeleton (3 placeholder cards).
    - An `@else if (error())` block showing an error message card with the error text.
    - An `@else` block that renders the module cards via `@for`.
  - _Depends: 3.1_
  - _Implements: DES-5, REQ-5.3, REQ-5.7_

- [x] 3.3 Update `Modules` component template — dynamic module cards
  - Within the `@else` block from task 3.2, use `@for (item of modulesWithState(); track item.module.id)` to render one card per module.
  - Each card must display `item.module.title`, `item.module.description`, and `item.module.icon` (rendered as a Material Symbol icon name).
  - Render a "Começar" primary button when `item.progressState === 'not-started'`.
  - Render a "Continuar" primary button when `item.progressState === 'in-progress'`.
  - Render a "Concluído" badge indicator when `item.progressState === 'completed'`.
  - _Depends: 3.2_
  - _Implements: DES-5, REQ-5.4, REQ-5.5, REQ-5.6, REQ-5.8_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: modules table creation and RLS
  - Verify the `modules` table exists in Supabase with the correct columns and RLS enabled.
  - Verify authenticated users can `SELECT` from `modules`.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 4.2 Test: user_modules table creation and RLS
  - Verify the `user_modules` table exists in Supabase with the correct columns, FK constraints, and RLS enabled.
  - Verify authenticated users can only `SELECT` and `INSERT` their own rows.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [x] 4.3 Test: ModuleService retrieves all modules
  - Unit-test `ModuleService.getModules()` with a mock Supabase client.
  - Verify it returns a `Module[]` on success.
  - Verify it throws with the Supabase error message on query failure.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 4.4 Test: UserModuleService retrieves user-specific entries
  - Unit-test `UserModuleService.getUserModules()` with a mock Supabase client and mock auth.
  - Verify it returns the correct `UserModule[]` when records exist.
  - Verify it returns `[]` when no records exist for the user.
  - Verify it throws on query error and when the auth session is missing.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 4.5 Test: Modules page loading state
  - Verify the Modules page displays a loading indicator while both services are resolving.
  - Test type: integration
  - _Implements: REQ-5.3_

- [x] 4.6 Test: Modules page renders dynamic data with progress states
  - Verify the Modules page displays one card per module after data loads.
  - Verify `title`, `description`, and `icon` are rendered from real service data.
  - Verify data from both `ModuleService` and `UserModuleService` is fetched on page init.
  - Verify modules with no `UserModule` show "Começar".
  - Verify modules with `UserModule.completed = false` show "Continuar".
  - Verify modules with `UserModule.completed = true` show a "Concluído" indicator.
  - Test type: integration
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.4, REQ-5.5, REQ-5.6, REQ-5.8_

- [x] 4.7 Test: Modules page error state
  - Verify the Modules page displays an error message when service data fetching fails.
  - Test type: integration
  - _Implements: REQ-5.7_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm the `modules` table exists with correct schema, RLS enabled, and a SELECT policy for authenticated users.
  - REQ-2: Confirm the `user_modules` table exists with correct schema, FK constraints, and RLS policies for SELECT and INSERT scoped to own `user_id`.
  - REQ-3: Confirm `ModuleService.getModules()` returns typed `Module[]` and throws on Supabase error.
  - REQ-4: Confirm `UserModuleService.getUserModules()` returns joined `UserModule[]`, empty array when no records, and throws on error or missing auth.
  - REQ-5: Confirm the Modules page shows a loading state, renders dynamic module cards with real data, and correctly displays "Começar", "Continuar", and "Concluído" per module progress state.
  - Run `ng build` and resolve any TypeScript or template compilation errors.
  - Run `mcp_supabase_get_advisors` for security and performance to confirm no new issues.
  - _Implements: All requirements_
