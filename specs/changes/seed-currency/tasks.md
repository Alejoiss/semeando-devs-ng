# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database Foundation** — Migration, trigger, and RLS policies in Supabase
2. **TypeScript Models** — Typed data wrappers mirroring the XP model pattern
3. **SeedService** — Root singleton service with reactive signal
4. **UI Integration** — Header display, quiz completion screen, hint purchase flow
5. **Acceptance Criteria Testing** — Verify all requirement behaviors
6. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Medium (3–5 sessions)

---

## Phase 1: Database Foundation

- [x] 1.1 Create Supabase migration for seed tables
  - Create the migration file `supabase/migrations/<timestamp>_create_seed_tables.sql` that defines the `seed` table (`id`, `user_id`, `total_seeds` default 0, `updated_at`) and the `seed_log` table (`id`, `user_id`, `amount`, `created_at`), both with `REFERENCES auth.users(id) ON DELETE CASCADE`.
  - Apply the migration via the Supabase MCP.
  - _Implements: DES-1, REQ-1.1, REQ-1.2_

- [x] 1.2 Add trigger to auto-update seed balance
  - In the same or a follow-up migration, create a Postgres `AFTER INSERT` trigger on `seed_log` that upserts the `seed` table: `INSERT … ON CONFLICT (user_id) DO UPDATE SET total_seeds = seed.total_seeds + NEW.amount, updated_at = now()`.
  - Apply via Supabase MCP.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.3_

- [x] 1.3 Enable RLS and add read policies
  - Enable row-level security on both `seed` and `seed_log`. Add `FOR SELECT` policies restricting access to `auth.uid() = user_id`.
  - Add an `INSERT` policy on `seed_log` so authenticated users can insert their own rows.
  - Apply via Supabase MCP and verify with `get_advisors(type: security)`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.4_

---

## Phase 2: TypeScript Models

- [x] 2.1 Create Seed model
  - Create `src/models/seed/seed.ts` mirroring `src/models/xp/xp.ts`. Map `id`, `user_id → userId`, `total_seeds → totalSeeds`, `updated_at → updatedAt`.
  - _Implements: DES-3, REQ-1.1_

- [x] 2.2 Create SeedLog model
  - Create `src/models/seed-log/seed-log.ts` mirroring `src/models/xp-log/xp-log.ts`. Map `id`, `user_id → userId`, `amount`, `created_at → createdAt`.
  - _Depends: 2.1_
  - _Implements: DES-3, REQ-1.2_

---

## Phase 3: SeedService

- [x] 3.1 Scaffold SeedService
  - Run `ng g s app/services/seed` to generate the service file.
  - Declare a private writable `_totalSeeds = signal<number>(0)` and export `public readonly totalSeeds = this._totalSeeds.asReadonly()`.
  - Inject `UserService` and create the Supabase client following the `XpService` pattern.
  - _Implements: DES-2, REQ-3.3_

- [x] 3.2 Implement getSeeds and refreshSeeds methods
  - `getSeeds()` queries `seed` table filtered by `user_id`, sets `_totalSeeds` from `total_seeds` (default 0 when `PGRST116`), and returns the value.
  - `refreshSeeds()` calls `getSeeds()`.
  - _Depends: 3.1_
  - _Implements: DES-2, REQ-3.1_

- [x] 3.3 Implement creditSeeds method
  - `creditSeeds(amount: number)` inserts a positive-amount row into `seed_log` for the current user, then calls `refreshSeeds()`.
  - _Depends: 3.2_
  - _Implements: DES-2, REQ-2.1_

- [x] 3.4 Implement spendSeeds method
  - `spendSeeds(amount: number)` inserts a row with `-amount` into `seed_log` for the current user, then calls `refreshSeeds()`. Returns a `boolean` indicating success for the caller to handle UI state.
  - _Depends: 3.2_
  - _Implements: DES-2, REQ-4.4_

---

## Phase 4: UI Integration

- [x] 4.1 Display seed balance in InternalHeader
  - Inject `SeedService` into `InternalHeaderComponent`. Call `seedService.getSeeds()` inside `ngOnInit()` alongside the existing `xpService.getXp()` call.
  - In `internal-header.html`, add a seed pill immediately after the XP pill: an `<img>` pointing to `assets/seed/seed.png` and the `totalSeeds()` signal value, styled consistently with the existing XP pill.
  - _Implements: DES-4, REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 4.2 Credit seeds on successful quiz completion
  - In `quiz.ts`, inject `SeedService`. Add a `protected readonly earnedSeeds = signal<number>(0)` signal.
  - Inside `finishQuiz()`, after the existing `xpService.refreshXp()` call, check `this.passed()`. When `true`, compute `amount = Math.ceil((this.lesson()?.xp ?? 0) * 0.1)`, call `seedService.creditSeeds(amount)`, and set `earnedSeeds(amount)`.
  - _Depends: 3.3_
  - _Implements: DES-5, REQ-2.1, REQ-2.3_

- [x] 4.3 Show seeds earned on quiz completion screen
  - In `quiz.html`, inside the passing completion section, add a fourth stat card alongside the existing Precisão / Tempo / XP cards displaying `+{{ earnedSeeds() }} Seeds` with the seed icon (`assets/seed/seed.png`).
  - _Depends: 4.2_
  - _Implements: DES-5, REQ-2.2_

- [x] 4.4 Add hint button to quiz question footer
  - In `quiz.ts`, add signals `protected readonly showHintConfirm = signal(false)` and `protected readonly hintVisible = signal(false)`.
  - Add method `requestHint()` that sets `showHintConfirm(true)`, `confirmHint()` that calls `seedService.spendSeeds(50)` then sets `hintVisible(true)` and `showHintConfirm(false)`, and `cancelHint()` that resets `showHintConfirm(false)`.
  - Inject `SeedService` if not already done and expose `protected readonly totalSeeds = seedService.totalSeeds`.
  - _Depends: 3.4_
  - _Implements: DES-6, REQ-4.1, REQ-4.2_

- [x] 4.5 Render hint button and confirmation prompt in template
  - In `quiz.html`, in the question footer (the `div.mt-6` row containing the confirm/next button), add the "Pedir dica (50 seeds)" button. Disable it when `totalSeeds() < 50` or `confirmed()` or `hintVisible()`. Hide it when `finished()`.
  - Below the answer options (but above the existing reason feedback block), add an `@if (showHintConfirm())` inline confirmation prompt with "Sim, gastar 50 seeds" and "Cancelar" buttons.
  - Add an `@if (hintVisible())` block that shows the `reason` of the correct answer, styled like the existing post-confirm reason block.
  - _Depends: 4.4_
  - _Implements: DES-6, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6_

- [x] 4.6 Show total seeds on Achievements page
  - In `achievements.ts`, inject `SeedService` and expose `totalSeeds` signal.
  - In `achievements.html`, add a new stat card in the header displaying the total seeds with the `assets/seed/seed.png` icon.
  - _Implements: REQ-3.1_

---

## Phase 5: Acceptance Criteria Testing

- [x] 5.1 Test: seed tables and trigger persist balance correctly
  - Verify inserting a row into `seed_log` causes `seed.total_seeds` to reflect the cumulative sum. Verify an upsert is created on first insert (no pre-existing seed row).
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 5.2 Test: RLS blocks cross-user access
  - Verify a user cannot read another user's rows in `seed` or `seed_log`.
  - Test type: integration
  - _Implements: REQ-1.4_

- [x] 5.3 Test: seeds credited on quiz pass and not on fail
  - Verify `creditSeeds` is called with `Math.ceil(xp * 0.1)` when score ≥ 70% and is not called when score < 70%. Verify `earnedSeeds` signal is set correctly.
  - Test type: unit
  - _Implements: REQ-2.1, REQ-2.3_

- [x] 5.4 Test: seeds earned displayed on completion screen
  - Verify the completion screen renders `+N Seeds` matching `earnedSeeds()` after a passing attempt.
  - Test type: unit
  - _Implements: REQ-2.2_

- [x] 5.5 Test: seed balance visible in header and updates reactively
  - Verify `getSeeds()` is called on header init, `totalSeeds()` signal reflects the fetched value, and the header template renders the seed pill with icon and count.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 5.6 Test: hint button disabled when seeds insufficient
  - Verify the hint button is rendered while a question is active, and that it is disabled when `totalSeeds() < 50`.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2_

- [x] 5.7 Test: confirming hint deducts seeds and reveals reason
  - Verify that confirming the prompt calls `spendSeeds(50)`, sets `hintVisible` to `true`, and shows the correct answer's `reason`. Verify cancelling does not deduct seeds or reveal the hint.
  - Test type: unit
  - _Implements: REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6_

---

## Phase 6: Final Checkpoint

- [x] 6.1 Verify all acceptance criteria
  - REQ-1: Confirm `seed` and `seed_log` tables exist with correct schema, trigger auto-updates balance, and RLS is enforced.
  - REQ-2: Confirm seeds are credited on passing quiz, displayed on completion screen, and not credited on failure.
  - REQ-3: Confirm seed balance pill with icon appears in header and is reactive.
  - REQ-4: Confirm hint button is present and disabled when balance < 50; confirm confirm/cancel flows work correctly.
  - Run the test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
