# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Fetch and aggregate data in the service
2. **Feature Delivery** - Add the chart to the dashboard UI
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Implement data fetching in DashboardService
  - Add `loadLessonsPerModule()` to query `user_lessons` joined with `lesson` and `module`, filtering by `completed=true`.
  - Add the `lessonsPerModuleOption` signal to hold the ECharts option data.
  - Call this method inside `loadAll()`.
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Add BarChart to AdminDashboard
  - Update `src/app/pages/admin/admin-app/dashboard/dashboard.html` to include `<app-bar-chart>` binding to `service.lessonsPerModuleOption()`.
  - Update `dashboard.ts` imports if necessary (it already imports `BarChart`).
  - _Depends: 1.1_
  - _Implements: DES-2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: display chart of completed lessons per module
  - Verify that the chart correctly displays the aggregated count of completed lessons per module.
  - Test type: integration
  - _Depends: 1.1, 2.1_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 3.2 Test: handle modules with no completed lessons
  - Verify that modules with zero completed lessons are omitted or display a count of zero correctly.
  - Test type: integration
  - _Depends: 1.1, 2.1_
  - _Implements: REQ-1.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm the chart displays completed lessons by module accurately on the dashboard.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
