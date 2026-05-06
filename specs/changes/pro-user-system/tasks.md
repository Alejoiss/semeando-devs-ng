# Tasks

## Overview
Implementation of the PRO user tier across the database, edge functions, and frontend components.

Phases:
1. Database & Migration
2. Edge Functions
3. Frontend Infrastructure
4. UI & Access Control
5. Final Checkpoint

## Phase 1: Database & Migration
- [x] T1: Create SQL migration for `profiles` table and trigger `_Implements: DES-1, DES-2_`
- [x] T2: Update `get_ranking_overall` RPC to join with `profiles` `_Implements: DES-3_`
- [x] T3: Update `get_ranking_weekly` RPC to join with `profiles` `_Implements: DES-3_`
- [x] T4: Update `get_ranking_monthly` RPC to join with `profiles` `_Implements: DES-3_`

## Phase 2: Edge Functions
- [x] T5: Modify `create-subscription` function to update `is_pro` status on success `_Implements: DES-4_`

## Phase 3: Frontend Infrastructure
- [x] T6: Update `User` model with `isPro` property `_Implements: DES-5_`
- [x] T7: Update `RankingEntry` model with `isPro` property `_Implements: DES-6_`
- [x] T8: Update `UserService` to fetch profile and expose `isPro` signal `_Implements: DES-7_`

## Phase 4: UI & Access Control
- [x] T9: Update `AsideMenu` button toggling logic `_Implements: DES-8_`
- [x] T10: Add star icon to `InternalHeader` `_Implements: DES-9_`
- [x] T11: Add star icon to `Ranking` page entries `_Implements: DES-10_`
- [x] T12: Add star icon to `Modules` page ranking list `_Implements: DES-11_`
- [x] T13: Implement submodule access logic in `Submodule` component `_Implements: DES-12_`

## Phase 5: Final Checkpoint
- [x] T14: Verify user signup creates profile record `_Implements: DES-2_`
- [x] T15: Verify mock subscription updates `is_pro` to true `_Implements: DES-4_`
- [x] T16: Verify visual indicators (stars) appear for PRO users `_Implements: DES-9, DES-10, DES-11_`
- [x] T17: Verify content gating for non-PRO vs PRO users `_Implements: DES-12_`
