# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database Foundation** - Schema migrations, RLS updates, and RPC functions
2. **Models and Services** - TypeScript interfaces and Angular services
3. **Component and Template** - Ranking component rewrite with dynamic data binding
4. **Acceptance Criteria Testing** - Verify requirement behavior
5. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (4-5 sessions)

## Phase 1: Database Foundation

- [x] 1.1 Add `updated_at` column and trigger to XP tables
  - Create a Supabase migration that adds `updated_at` (timestamp without time zone, default now()) to `xp`, `xp_month`, and `xp_week`. Create a shared trigger function `set_updated_at()` that fires BEFORE INSERT OR UPDATE on each table. Backfill existing rows with `now()`.
  - _Implements: DES-1, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

- [x] 1.2 Update RLS policies for authenticated reads
  - Create a Supabase migration that drops the existing owner-only SELECT policies on `xp`, `xp_month`, and `xp_week` and replaces them with policies allowing any authenticated user to SELECT all rows. Existing write restrictions remain unchanged.
  - _Depends: 1.1_
  - _Implements: DES-2, REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4_

- [x] 1.3 Create Postgres RPC function for overall ranking
  - Create `get_ranking_overall(p_user_id uuid)` that joins `xp` with `auth.users`, orders by `total_xp DESC, updated_at ASC`, limits to 50, and calculates the calling user's position. Returns JSON with `ranking` array and `current_user` object.
  - _Depends: 1.1, 1.2_
  - _Implements: DES-3, REQ-2.1, REQ-3.2_

- [x] 1.4 Create Postgres RPC function for monthly ranking
  - Create `get_ranking_monthly(p_user_id uuid, p_year int, p_month int)` that joins `xp_month` with `auth.users`, filters by year/month, orders by `xp_amount DESC, updated_at ASC`, limits to 50, and calculates the calling user's position.
  - _Depends: 1.1, 1.2_
  - _Implements: DES-3, REQ-2.2, REQ-3.3_

- [x] 1.5 Create Postgres RPC function for weekly ranking
  - Create `get_ranking_weekly(p_user_id uuid, p_year int, p_week int)` that joins `xp_week` with `auth.users`, filters by year/week, orders by `xp_amount DESC, updated_at ASC`, limits to 50, and calculates the calling user's position.
  - _Depends: 1.1, 1.2_
  - _Implements: DES-3, REQ-2.3, REQ-3.4_

## Phase 2: Models and Services

- [x] 2.1 Create ranking TypeScript interfaces
  - Create `src/models/ranking/ranking.ts` with `RankingEntry`, `CurrentUserRanking`, and `RankingResult` interfaces matching the RPC return shape.
  - _Implements: DES-3, DES-4_

- [x] 2.2 Update XP model classes with `updatedAt` field
  - Add `updatedAt` property to `XP`, `XpMonth`, and `XpWeek` model classes in `src/models/xp/`, `src/models/xp-month/`, and `src/models/xp-week/`.
  - _Implements: DES-1_

- [x] 2.3 Create RankingOverallService
  - Create `src/app/services/ranking-overall.ts` with a `getRanking()` method that calls `supabase.rpc('get_ranking_overall')` with the current user's ID and maps the result to `RankingResult`.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-2.1_

- [x] 2.4 Create RankingMonthlyService
  - Create `src/app/services/ranking-monthly.ts` with a `getRanking()` method that calls `supabase.rpc('get_ranking_monthly')` with the current user's ID, current year, and current month.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-2.2_

- [x] 2.5 Create RankingWeeklyService
  - Create `src/app/services/ranking-weekly.ts` with a `getRanking()` method that calls `supabase.rpc('get_ranking_weekly')` with the current user's ID, current year, and current ISO week number.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-2.3_

## Phase 3: Component and Template

- [x] 3.1 Rewrite Ranking component with tab orchestration and signals
  - Update `src/app/pages/app/ranking/ranking.ts` to inject all three ranking services plus `UserService`. Add signals for `activeTab`, `podiumUsers`, `rankedUsers`, `currentUserPosition`, `currentUserXp`, `currentUserName`, `isLoading`. Implement `loadRanking()` method that dispatches to the correct service based on `activeTab`. Implement `switchTab()` method. Add a helper to extract initials from a name.
  - _Depends: 2.3, 2.4, 2.5_
  - _Implements: DES-5, DES-6, REQ-1.1, REQ-1.4, REQ-1.5, REQ-3.1, REQ-3.5_

- [x] 3.2 Rewrite Ranking template with dynamic data binding
  - Update `src/app/pages/app/ranking/ranking.html` to replace all static content with dynamic data. Replace the three filter buttons with Geral/Mensal/Semanal tabs driven by `activeTab`. Use `@if`/`@for` to render podium (top 3), ranking list (positions 4-50), loading state, and empty state. Update the fixed bottom bar to show the current user's real position and XP. Implement avatar placeholder with initials using `@if` for avatar URL presence.
  - _Depends: 3.1_
  - _Implements: DES-5, DES-6, REQ-1.2, REQ-1.3, REQ-2.4, REQ-2.5, REQ-4.1, REQ-4.2_

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: default view shows overall ranking on navigation
  - Verify that navigating to the ranking screen displays the overall ranking with "Geral" tab active by default.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-1.1_

- [x] 4.2 Test: tab switching loads correct ranking data
  - Verify that clicking "Semanal" loads weekly ranking for the current ISO week, clicking "Mensal" loads monthly ranking for the current month, and clicking "Geral" loads overall ranking.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-1.2, REQ-1.3, REQ-1.4_

- [x] 4.3 Test: loading indicator is shown while data is fetched
  - Verify that a loading indicator is visible during ranking data retrieval and disappears once data is loaded.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-1.5_

- [x] 4.4 Test: ranking data is ordered correctly with tiebreaker
  - Verify that each ranking view returns users ordered by XP descending and by `updated_at` ascending when XP values are equal. Execute the RPC functions with test data.
  - Test type: integration
  - _Depends: 1.3, 1.4, 1.5_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 4.5 Test: ranked users display position, name, avatar, and XP
  - Verify that each ranked user row shows their position number, display name, avatar (or initials placeholder), and XP value.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-2.4, REQ-2.5_

- [x] 4.6 Test: current user position is always shown at the bottom
  - Verify that the fixed bottom bar displays the current user's rank position, name, and XP for all three ranking views.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [x] 4.7 Test: current user with no XP record shows dash and zero
  - Verify that when the current user has no XP record for the active view, the position shows "—" and XP shows "0".
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-3.5_

- [x] 4.8 Test: podium displays top 3 users with visual distinction
  - Verify the podium section renders the top 3 users and handles fewer than 3 users gracefully.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-4.1, REQ-4.2_

- [x] 4.9 Test: updated_at column exists and trigger fires on XP changes
  - Verify that the `updated_at` column exists on all three XP tables and is automatically set on insert and update operations.
  - Test type: integration
  - _Depends: 1.1_
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

- [x] 4.10 Test: authenticated users can read all XP rows
  - Verify that any authenticated user can SELECT all rows from `xp`, `xp_month`, and `xp_week` tables, while write operations remain restricted.
  - Test type: integration
  - _Depends: 1.2_
  - _Implements: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4_

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm all three ranking view modes work with tab switching and loading states.
  - REQ-2: Confirm ranking data is retrieved correctly with proper ordering and tiebreaker logic.
  - REQ-3: Confirm current user position is always displayed at the bottom with correct values.
  - REQ-4: Confirm podium displays top 3 users with visual distinction.
  - REQ-5: Confirm `updated_at` column and trigger are operational on all XP tables.
  - REQ-6: Confirm RLS policies allow authenticated reads while restricting writes.
  - Run the dev server and verify the ranking screen visually in the browser.
  - _Implements: All requirements_
