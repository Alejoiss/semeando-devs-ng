# Requirements

## Overview
The goal of this feature is to provide administrators (or users) with a visual representation of completed lessons grouped by module on the dashboard. This chart will only count lessons that have been successfully completed, helping to track progress and engagement at the module level.

## Requirements

### REQ-1: Display Completed Lessons Chart

**User Story:** As an administrator, I want to see a chart of completed lessons grouped by module on the dashboard, so that I can easily track user progress across different areas of the curriculum.

#### Acceptance Criteria
1.1 THE dashboard SHALL display a chart representing the count of completed lessons per module.
1.2 WHEN calculating the count of lessons per module, the system SHALL only include lessons where the `completed` status is true.
1.3 IF there are no completed lessons for a module, THEN the system SHALL either omit that module from the chart or display a count of zero.
