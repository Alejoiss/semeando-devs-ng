# Requirements

## Overview

The Semeando Devs platform currently has an empty admin dashboard page. Administrators need a centralized view of the platform's health: user growth, revenue, engagement metrics, and system activity. Without this visibility, admins must manually query Supabase to understand what is happening on the platform.

The admin dashboard will aggregate and visualize data from the existing Supabase tables (`profiles`, `subscriptions`, `xp_log`, `seed_log`, `ai_usage_log`) into KPI cards and interactive charts grouped into four thematic sections: Users & Growth, Revenue & Subscriptions, Engagement, and Platform Activity.

The scope covers only the read-only display layer. No data mutation, user impersonation, or real-time streaming is in scope for this feature.

## Glossary

| Term | Definition |
|------|------------|
| KPI Card | A summary tile that shows a single numeric metric with a label and an optional trend indicator |
| MRR | Monthly Recurring Revenue: the estimated recurring monthly income calculated from active subscriptions |
| PRO User | A user whose `is_pro` field is `true` in the `profiles` table |
| Active Subscription | A subscription record whose `status` is `active` |
| Churn | The count of subscriptions whose `status` changed to `cancelled` within a given period |
| XP | Experience points recorded in the `xp_log` table |
| Seed | In-platform currency recorded in the `seed_log` table |
| Admin | A user with `role = 'admin'` in the `profiles` table |

## Assumptions

- The application already has an authenticated admin route guard preventing non-admin access to the dashboard page.
- All required data is already stored in existing Supabase tables; no new tables are required.
- A charting library compatible with Angular 20+ (Apache ECharts via `ngx-echarts`) will be installed as part of this feature.
- The period filter defaults to the last 30 days and is applied globally to all time-series charts.
- MRR is approximated by summing `transaction_amount` for all active subscriptions (no proration logic).
- Seed and XP data are treated as engagement proxies, not financial metrics.

## Requirements

### REQ-1: KPI Summary Cards

**User Story:** As an admin, I want to see the most important platform metrics at a glance, so that I can quickly assess the health of the platform without running database queries.

#### Acceptance Criteria

1.1 WHEN the admin navigates to the dashboard page, THEN the dashboard SHALL display a row of KPI cards showing: total students, total active PRO users, estimated MRR (R$), active subscriptions, new students in the last 30 days, and cancelled subscriptions in the last 30 days.

1.2 WHILE the dashboard is fetching data, the dashboard SHALL display skeleton loading placeholders in place of each KPI card value.

1.3 IF a data fetch for any KPI fails, THEN the dashboard SHALL display an error indicator inside that card without hiding the other cards.

1.4 WHEN the admin views a KPI card for a metric with a comparison period, THEN the dashboard SHALL display the percentage change relative to the previous equivalent period alongside the current value.

---

### REQ-2: User Growth Chart

**User Story:** As an admin, I want to see how student registrations have evolved over the past 12 months, so that I can identify growth trends and the impact of marketing campaigns.

#### Acceptance Criteria

2.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a line chart showing the count of new student registrations grouped by month for the last 12 calendar months.

2.2 THE dashboard SHALL label the horizontal axis of the user growth chart with abbreviated month names (e.g., "Jan", "Feb") in chronological order.

2.3 WHEN the admin hovers over a data point on the user growth chart, THEN the dashboard SHALL display a tooltip showing the exact month name and registration count.

---

### REQ-3: PRO vs. Free Users Distribution Chart

**User Story:** As an admin, I want to understand the proportion of PRO and free users, so that I can evaluate the platform's monetization ratio.

#### Acceptance Criteria

3.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a donut chart showing the count of PRO users versus free users as two distinct segments.

3.2 THE dashboard SHALL display the percentage and absolute count for each segment in the donut chart legend.

---

### REQ-4: Subscription Status Distribution Chart

**User Story:** As an admin, I want to see the breakdown of subscriptions by status, so that I can monitor payment failures and cancellation rates.

#### Acceptance Criteria

4.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a donut chart showing the count of subscriptions grouped by status: `active`, `cancelled`, `payment_failed`, and `pending`.

4.2 THE dashboard SHALL display a color-coded legend for each subscription status segment.

4.3 WHEN the admin hovers over a segment, THEN the dashboard SHALL display a tooltip with the status label and the exact subscription count.

---

### REQ-5: Monthly Revenue Chart

**User Story:** As an admin, I want to see the revenue generated per month over the last 12 months, so that I can track financial performance over time.

#### Acceptance Criteria

5.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a bar chart showing the sum of `transaction_amount` from subscriptions grouped by the month of their `created_at`, for the last 12 calendar months.

5.2 THE dashboard SHALL format the vertical axis of the revenue chart in Brazilian Reais (R$) currency notation.

5.3 WHEN the admin hovers over a bar on the revenue chart, THEN the dashboard SHALL display a tooltip showing the month name and the formatted revenue amount.

---

### REQ-6: Billing Cycle Distribution Chart

**User Story:** As an admin, I want to see the split between monthly and yearly subscribers, so that I can understand subscription commitment and forecast annual revenue.

#### Acceptance Criteria

6.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a horizontal bar chart showing the count of active subscriptions grouped by `billing_cycle` (`monthly` and `yearly`).

6.2 THE dashboard SHALL label each bar with the billing cycle name and display the count value.

---

### REQ-7: XP Distribution Over Time Chart

**User Story:** As an admin, I want to see how XP is being awarded across the platform per month, so that I can monitor student learning activity.

#### Acceptance Criteria

7.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a stacked bar chart showing the total XP amount awarded per month for the last 12 calendar months, grouped by reason (`LESSON`, `ACHIEVEMENT`, `PURCHASE_TIP`).

7.2 THE dashboard SHALL render each XP reason as a distinct color series within the stacked bar chart.

7.3 WHEN the admin hovers over a bar segment, THEN the dashboard SHALL display a tooltip with the month, reason label, and XP amount.

---

### REQ-8: AI Usage Activity Chart

**User Story:** As an admin, I want to see how often students are using AI-assisted features, so that I can evaluate AI credit consumption trends.

#### Acceptance Criteria

8.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a line chart showing the daily count of AI usage events for the last 30 days, with separate series for `evaluate_content` and `submit_code` action types.

8.2 WHEN the admin hovers over a data point on the AI usage chart, THEN the dashboard SHALL display a tooltip showing the date and the count for each action type.

---

### REQ-9: Seed Distribution Over Time Chart

**User Story:** As an admin, I want to see how many seeds are distributed per month, so that I can track in-platform economy activity.

#### Acceptance Criteria

9.1 WHEN the admin views the dashboard, THEN the dashboard SHALL display a bar chart showing the total seed amount distributed per month for the last 12 calendar months.

9.2 WHEN the admin hovers over a bar on the seed chart, THEN the dashboard SHALL display a tooltip showing the month name and the total seeds distributed.

---

### REQ-10: Period Filter

**User Story:** As an admin, I want to filter the dashboard charts by a time period, so that I can focus on a specific window of data relevant to my analysis.

#### Acceptance Criteria

10.1 THE dashboard SHALL display a period selector with the options: Last 7 days, Last 30 days, Last 90 days, and Last 12 months.

10.2 WHEN the admin selects a period, THEN the dashboard SHALL re-fetch and re-render all time-series charts and KPI trend indicators using the selected period as the date range.

10.3 THE dashboard SHALL default to the "Last 30 days" period on initial load.

---

### REQ-11: Accessibility and Visual Design

**User Story:** As an admin, I want the dashboard to be accessible and visually consistent with the platform design system, so that it integrates seamlessly with the admin area.

#### Acceptance Criteria

11.1 THE dashboard SHALL use the platform's defined color tokens (`primary`, `secondary`, `tertiary`, `surface_container`, and their variants) for all chart series, cards, and backgrounds.

11.2 THE dashboard SHALL provide a text alternative (aria-label) for each chart region so that screen readers can describe the chart purpose.

11.3 THE dashboard SHALL achieve a minimum color contrast ratio of 4.5:1 for all text elements against their backgrounds, as required by WCAG AA.

11.4 THE dashboard SHALL be responsive, rendering all KPI cards and charts in a single-column layout on viewports narrower than 768px and in a multi-column grid on wider viewports.
