# Implementation Tasks: Payment & Upgrade System

Target Slug: `payment-upgrade-system`

## Overview
This document outlines the tasks for implementing the payment structure and upgrade UI for the Semeando Devs application.

### Phases
1. Phase 1: Database & Models (Infrastructure)
2. Phase 2: Services (Business Logic)
3. Phase 3: UI Implementation (Frontend)
4. Phase 4: Final Checkpoint

## Phase 1: Database & Models (Infrastructure)

- [x] **Task 1.1: Create Supabase Migration**
  - Create a new migration file in `supabase/migrations/` to create `plans` and `coupons` tables.
  - Include RLS policies for authenticated users (read-only).
  - Add seed data for the main PRO plan.
  - _Implements: DES-1_
- [x] **Task 1.2: Apply Migration**
  - Run `npx supabase db up` (as per user rules) to apply the migration.
  - _Implements: DES-1_
- [x] **Task 1.3: Create TypeScript Models**
  - Create `src/app/models/plan.ts` and `src/app/models/coupon.ts` separately.
  - _Implements: DES-2_

## Phase 2: Services (Business Logic)

- [x] **Task 2.1: Generate Services**
  - Run `ng g s services/plan`.
  - Run `ng g s services/coupon`.
  - Implement logic for each service according to their models.
  - _Implements: DES-2_

## Phase 3: UI Implementation (Frontend)

- [x] **Task 3.1: Update Aside Menu Navigation**
  - Modify `src/app/components/aside-menu/aside-menu.ts` to check user subscription status.
  - Add the "Upgrade to Pro" button in `src/app/components/aside-menu/aside-menu.html`.
  - _Implements: DES-3_
- [x] **Task 3.2: Implement Upgrade Page Logic**
  - Update `src/app/pages/app/upgrade/upgrade.ts` to use `UpgradeService`.
  - Implement Signals for `plan`, `coupon`, and `couponCode`.
  - Implement Computed properties for discounted prices.
  - _Implements: DES-2_
- [x] **Task 3.3: Update Upgrade Page Template**
  - Bind dynamic data to `src/app/pages/app/upgrade/upgrade.html`.
  - Add coupon input field and validation feedback.
  - Apply "Luminescent Blueprint" styles (glassmorphism, no borders).
  - _Implements: DES-3_

## Phase 4: Final Checkpoint

- [x] **Task 4.1: Manual Verification**
  - Verify that the main plan is loaded from the database.
  - Verify that valid coupons update the price on screen.
  - Verify that invalid coupons show an error.
  - Verify that the sidebar button correctly redirects to the upgrade page.
  - _Implements: DES-1, DES-2, DES-3_
- [x] **Task 4.2: Final Documentation**
  - Create a walkthrough with screenshots/recordings of the functional UI.
  - _Implements: DES-3_
