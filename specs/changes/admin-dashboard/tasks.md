# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** — Install dependencies and define shared constants and data models
2. **Service Layer** — Build `DashboardService` with all data-fetching and chart-option factories
3. **UI Components** — Build KPI card, three reusable chart wrappers, and the main dashboard page
4. **Acceptance Criteria Testing** — Verify all requirement behaviors with unit and integration tests
5. **Final Checkpoint** — Validate completeness, build, and traceability

**Estimated Effort**: Medium (3-5 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Install `echarts` and `ngx-echarts` dependencies
  - Add `echarts` and `ngx-echarts` to `package.json` via npm install and register `provideEcharts()` in the application providers.
  - _Implements: DES-4_

- [x] 1.2 Create `DASHBOARD_PALETTE` color constant
  - Create `src/app/pages/admin/admin-app/dashboard/constants/palette.ts` with a `DASHBOARD_PALETTE` object mapping design system color tokens (`primary` #3fc2fb, `secondary` #fe69ac, `tertiary` #e8ffc0, surface variants, `error` #ff716c) to hex strings for use in ECharts options.
  - _Implements: DES-5, REQ-11.1, REQ-11.3_

- [x] 1.3 Define dashboard data model interfaces
  - Create `DashboardKpi`, `MonthlyDataPoint`, `GroupedDataPoint`, and `PeriodOption` interfaces inside a `src/app/pages/admin/admin-app/dashboard/models/dashboard.models.ts` file.
  - _Implements: DES-3_

---

## Phase 2: Service Layer

- [x] 2.1 Create `DashboardService` skeleton with period signal
  - Generate `src/app/services/dashboard.ts` using `ng g s`. Add a `selectedPeriod` signal typed `'7d' | '30d' | '90d' | '12m'` defaulting to `'30d'`, a `setPeriod()` method, and a private `fromDate()` computed that derives a JavaScript `Date` from the signal. Register `providedIn: 'root'`.
  - _Implements: DES-1, DES-2, REQ-10.1, REQ-10.3_

- [x] 2.2 Add KPI data-fetching methods to `DashboardService`
  - Implement six async methods that query Supabase: total students, total active PRO users, estimated MRR (sum of `transaction_amount` for active subscriptions), active subscription count, new students in period, and cancelled subscriptions in period. Expose results as individual `WritableSignal` values plus `isLoading` and `hasError` booleans per KPI.
  - _Depends: 2.1_
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4_

- [x] 2.3 Add trend computation to KPI signals
  - For the three period-relative KPIs (new students, cancelled subscriptions, and MRR), fetch the equivalent prior-period value and compute the percentage delta. Expose the delta on the matching KPI signal.
  - _Depends: 2.2_
  - _Implements: DES-1, REQ-1.4_

- [x] 2.4 Add user-growth chart option factory
  - Implement a method in `DashboardService` that queries `profiles` grouped by month for the last 12 months (students only) and returns an `EChartsOption` for a filled-area line chart using `DASHBOARD_PALETTE.primary`. Expose the result as a `Signal<EChartsOption>`.
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 2.5 Add PRO vs. free donut chart option factory
  - Implement a method that queries the total count of `is_pro = true` vs `is_pro = false` profiles and returns an `EChartsOption` for a donut chart with two named segments and a legend showing count and percentage.
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-3.1, REQ-3.2_

- [x] 2.6 Add subscription status donut chart option factory
  - Implement a method that queries subscriptions grouped by `status` and returns an `EChartsOption` for a donut chart with four color-coded segments (`active` → primary, `cancelled` → error, `payment_failed` → secondary, `pending` → tertiary).
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 2.7 Add monthly revenue bar chart option factory
  - Implement a method that queries `subscriptions.transaction_amount` grouped by month for the last 12 months and returns an `EChartsOption` for a vertical bar chart with the Y-axis formatted as R$ currency.
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-5.1, REQ-5.2, REQ-5.3_

- [x] 2.8 Add billing cycle horizontal bar chart option factory
  - Implement a method that queries active subscriptions grouped by `billing_cycle` and returns an `EChartsOption` for a horizontal bar chart with labeled bars.
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-6.1, REQ-6.2_

- [x] 2.9 Add XP stacked bar chart option factory
  - Implement a method that queries `xp_log` grouped by month and `reason` for the last 12 months and returns an `EChartsOption` for a stacked bar chart with three series (`LESSON` → primary, `ACHIEVEMENT` → secondary, `PURCHASE_TIP` → tertiary).
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-7.1, REQ-7.2, REQ-7.3_

- [x] 2.10 Add AI usage line chart option factory
  - Implement a method that queries `ai_usage_log` grouped by day and `action_type` for the last 30 days and returns an `EChartsOption` for a line chart with two series (`evaluate_content` and `submit_code`).
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-8.1, REQ-8.2_

- [x] 2.11 Add seed distribution bar chart option factory
  - Implement a method that queries `seed_log.amount` grouped by month for the last 12 months and returns an `EChartsOption` for a vertical bar chart.
  - _Depends: 2.1_
  - _Implements: DES-1, DES-5, REQ-9.1, REQ-9.2_

- [x] 2.12 Wire period-change effect in `DashboardService`
  - Add an `effect()` that watches `selectedPeriod` and calls all fetch methods in parallel when the period changes, updating all data signals.
  - _Depends: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_
  - _Implements: DES-2, REQ-10.2_

---

## Phase 3: UI Components

- [x] 3.1 Create `DashboardKpiCardComponent`
  - Generate `src/app/pages/admin/admin-app/dashboard/kpi-card/kpi-card` using `ng g c`. Add `label`, `value`, `icon`, `trend`, `isLoading`, and `hasError` as `input()` signals. Implement the template with a skeleton placeholder (animated `pulse` divs) while loading and an error icon when `hasError` is true. Apply design system surface tokens and `OnPush`.
  - _Implements: DES-3, REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4_

- [x] 3.2 Create `DashboardLineChartComponent`
  - Generate `src/app/pages/admin/admin-app/dashboard/charts/line-chart/line-chart` using `ng g c`. Accept an `options` input of type `EChartsOption` and an `ariaLabel` string input. Bind to the `echarts` directive on a `<figure>` with the `[ariaLabel]` attribute.
  - _Implements: DES-4, REQ-11.2_

- [x] 3.3 Create `DashboardDonutChartComponent`
  - Generate `src/app/pages/admin/admin-app/dashboard/charts/donut-chart/donut-chart` using `ng g c`. Same pattern as the line chart component with `options` and `ariaLabel` inputs.
  - _Implements: DES-4, REQ-11.2_

- [x] 3.4 Create `DashboardBarChartComponent`
  - Generate `src/app/pages/admin/admin-app/dashboard/charts/bar-chart/bar-chart` using `ng g c`. Same pattern as the line chart component with `options` and `ariaLabel` inputs.
  - _Implements: DES-4, REQ-11.2_

- [x] 3.5 Implement `AdminDashboard` page shell — period selector and KPI grid
  - Update `src/app/pages/admin/admin-app/dashboard/dashboard.ts` and its template to inject `DashboardService`, render the period selector (four pill buttons, active state via signal), and render a responsive KPI grid using `@for` over the six KPI signals, each rendered via `DashboardKpiCardComponent`.
  - _Depends: 2.12, 3.1_
  - _Implements: DES-2, DES-3, DES-6, REQ-1.1, REQ-10.1, REQ-10.3, REQ-11.4_

- [x] 3.6 Implement `AdminDashboard` page shell — Users & Growth section
  - Add the "Users & Growth" chart section with `DashboardLineChartComponent` (user growth) and `DashboardDonutChartComponent` (PRO vs. free), bound to the corresponding service chart option signals. Use a `lg:grid-cols-2` layout.
  - _Depends: 2.4, 2.5, 3.2, 3.3, 3.5_
  - _Implements: DES-4, DES-6, REQ-2.1, REQ-3.1, REQ-11.4_

- [x] 3.7 Implement `AdminDashboard` page shell — Revenue & Subscriptions section
  - Add the "Revenue & Subscriptions" section with `DashboardBarChartComponent` (monthly revenue), `DashboardDonutChartComponent` (subscription status), and `DashboardBarChartComponent` (billing cycle).
  - _Depends: 2.6, 2.7, 2.8, 3.3, 3.4, 3.5_
  - _Implements: DES-4, DES-6, REQ-4.1, REQ-5.1, REQ-6.1_

- [x] 3.8 Implement `AdminDashboard` page shell — Engagement & Platform Activity section
  - Add the "Engagement" section with `DashboardBarChartComponent` (XP stacked), `DashboardLineChartComponent` (AI usage), and `DashboardBarChartComponent` (seeds).
  - _Depends: 2.9, 2.10, 2.11, 3.2, 3.4, 3.5_
  - _Implements: DES-4, DES-6, REQ-7.1, REQ-8.1, REQ-9.1_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: dashboard displays KPI cards on load and shows skeleton while loading
  - Verify that six KPI cards render after data resolves and that skeleton placeholders appear during the loading state.
  - Test type: integration
  - _Depends: 3.5_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 4.2 Test: KPI card shows error indicator without hiding sibling cards
  - Mock one KPI fetch to reject; verify the errored card shows an error indicator and the other five cards still render.
  - Test type: integration
  - _Depends: 3.1_
  - _Implements: REQ-1.3_

- [x] 4.3 Test: KPI card displays trend percentage
  - Verify that the trend delta value is rendered alongside the KPI value when a non-zero trend is provided.
  - Test type: unit
  - _Depends: 3.1_
  - _Implements: REQ-1.4_

- [x] 4.4 Test: user growth chart renders with correct axis labels and tooltip
  - Verify the line chart option contains 12 month labels in chronological order and a tooltip formatter.
  - Test type: unit
  - _Depends: 2.4_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 4.5 Test: PRO vs. free donut chart shows percentage and count in legend
  - Verify the donut chart option contains two named series entries and a legend configuration.
  - Test type: unit
  - _Depends: 2.5_
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 4.6 Test: subscription status donut chart shows four color-coded segments with tooltip
  - Verify the donut chart option contains four data entries mapping to `active`, `cancelled`, `payment_failed`, and `pending` with distinct colors and a tooltip formatter.
  - Test type: unit
  - _Depends: 2.6_
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 4.7 Test: monthly revenue bar chart formats Y-axis in R$ and shows tooltip
  - Verify the bar chart Y-axis formatter produces R$ strings and the tooltip formatter includes the month and formatted amount.
  - Test type: unit
  - _Depends: 2.7_
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.3_

- [x] 4.8 Test: billing cycle horizontal bar chart labels bars with count
  - Verify the horizontal bar chart option contains two entries for `monthly` and `yearly` and each has a label.
  - Test type: unit
  - _Depends: 2.8_
  - _Implements: REQ-6.1, REQ-6.2_

- [x] 4.9 Test: XP stacked bar chart shows three colored series with tooltip
  - Verify the stacked bar chart option contains three series (`LESSON`, `ACHIEVEMENT`, `PURCHASE_TIP`) with distinct colors and a tooltip formatter.
  - Test type: unit
  - _Depends: 2.9_
  - _Implements: REQ-7.1, REQ-7.2, REQ-7.3_

- [x] 4.10 Test: AI usage line chart shows two daily series with tooltip
  - Verify the line chart option contains two series (`evaluate_content`, `submit_code`) with daily X-axis values and a tooltip formatter.
  - Test type: unit
  - _Depends: 2.10_
  - _Implements: REQ-8.1, REQ-8.2_

- [x] 4.11 Test: seed bar chart shows monthly totals with tooltip
  - Verify the bar chart option contains 12 data points and a tooltip formatter showing month and amount.
  - Test type: unit
  - _Depends: 2.11_
  - _Implements: REQ-9.1, REQ-9.2_

- [x] 4.12 Test: period selector renders four options and defaults to 30 days
  - Verify the four period pill buttons are rendered and the `30d` option has the active state on initial load.
  - Test type: integration
  - _Depends: 3.5_
  - _Implements: REQ-10.1, REQ-10.3_

- [x] 4.13 Test: selecting a period triggers service re-fetch and chart updates
  - Spy on `DashboardService.setPeriod()`; simulate clicking each period button; verify `setPeriod` is called with the correct value and the chart option signals are updated.
  - Test type: integration
  - _Depends: 3.5_
  - _Implements: REQ-10.2_

- [x] 4.14 Test: chart figure elements carry descriptive aria-labels
  - Verify each `<figure>` wrapper in the three chart component types has a non-empty `aria-label` attribute.
  - Test type: unit
  - _Depends: 3.2, 3.3, 3.4_
  - _Implements: REQ-11.2_

- [x] 4.15 Test: dashboard layout uses correct responsive grid classes
  - Verify the dashboard template includes `sm:grid-cols-2`, `lg:grid-cols-3`, and `lg:grid-cols-2` grid classes at the correct container levels.
  - Test type: unit
  - _Depends: 3.5_
  - _Implements: REQ-11.4_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria and traceability
  - REQ-1: Confirm KPI cards render with loading skeletons, per-card error states, and trend deltas.
  - REQ-2 through REQ-9: Confirm each chart renders with correct axis labels, series, colors, and tooltips.
  - REQ-10: Confirm period selector defaults to 30d and re-fetches all charts on change.
  - REQ-11: Confirm design token usage, aria-labels, and responsive grid classes.
  - Run `npm test` and resolve any failing specs. Confirm `ng build` produces no errors.
  - _Implements: All requirements_
