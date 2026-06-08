# Requirements

## Overview

The Modules page (`/app`) and Submodule page (`/app/s/:slug`) load slowly in production due to inefficient Supabase query patterns. The Modules page fetches all lessons with deep joins across the entire platform just to compute progress percentages, and the Submodule page suffers from an N+1 query problem—issuing a separate lessons query for every submodule in a loop. Additionally, multiple services independently call `supabase.auth.getUser()`, causing redundant auth round-trips on every page load.

This change optimizes these query patterns to reduce the number and weight of Supabase requests without altering any visible UI behavior or breaking existing functionality.

## Glossary

| Term | Definition |
|------|------------|
| N+1 Query | An anti-pattern where a loop issues one database query per item instead of a single batch query |
| Deep Join | A Supabase `select` that traverses multiple foreign-key relationships (e.g., `lessons → submodules → modules`) |
| Auth Round-trip | A call to `supabase.auth.getUser()` that makes a network request to verify the user's session |

## Assumptions

- The production Supabase instance has significantly more data (modules, submodules, lessons, user_lessons) than the local development environment, amplifying the impact of unoptimized queries.
- The `get_ranking_weekly` RPC function is already server-side optimized and does not need client-side changes.
- The existing UI rendering, state computation logic, and user-facing behavior must remain identical after optimization.
- All existing RLS policies will continue to apply; no new database-level objects (views, functions) are required.

## Requirements

### REQ-1: Eliminate the all-lessons deep-join query on the Modules page

**User Story:** As a student, I want the Modules page to load quickly, so that I can start learning without waiting for unnecessary data.

#### Acceptance Criteria

1.1 WHEN the Modules page loads, THEN the application SHALL NOT fetch all lessons with nested submodule and module joins from the database.

1.2 WHEN the Modules page computes module progress percentages, THEN the application SHALL use only the user's own lesson completion records and module completion status instead of fetching the entire lessons catalog.

1.3 WHEN the Modules page finishes loading, THEN the application SHALL display identical progress percentages and module states as the current implementation.

### REQ-2: Eliminate the N+1 lessons query on the Submodule page

**User Story:** As a student, I want the Submodule page to load quickly regardless of how many submodules exist, so that I can navigate the course without delays.

#### Acceptance Criteria

2.1 WHEN the Submodule page loads for a given module slug, THEN the application SHALL fetch all lessons for that module in a single query instead of one query per submodule.

2.2 WHEN the Submodule page determines the target lesson and progress for each submodule, THEN the application SHALL derive this information from the batch-fetched lessons data.

2.3 WHEN the Submodule page finishes loading, THEN the application SHALL display identical submodule states, progress percentages, and target lesson links as the current implementation.

### REQ-3: Reduce redundant authentication round-trips

**User Story:** As a student, I want pages to load with minimal latency, so that the application feels responsive.

#### Acceptance Criteria

3.1 WHEN the Modules page loads, THEN the application SHALL invoke the Supabase auth verification at most once across all data-fetching services.

3.2 WHEN the Submodule page loads, THEN the application SHALL invoke the Supabase auth verification at most once across all data-fetching services.

### REQ-4: Reduce over-fetched columns on the Modules page

**User Story:** As a student, I want the Modules page to transfer only the data it needs, so that load times are minimized.

#### Acceptance Criteria

4.1 WHEN the Modules page fetches the list of modules, THEN the application SHALL request only the columns needed for display and filtering instead of selecting all columns.

4.2 WHEN the Modules page fetches the user's module records, THEN the application SHALL request only the module ID and completion status instead of joining the full module row.

### REQ-5: Parallelize sequential requests on the Submodule page

**User Story:** As a student, I want the Submodule page to fetch independent data concurrently, so that the total load time is reduced.

#### Acceptance Criteria

5.1 WHEN the Submodule page loads, THEN the application SHALL fetch submodules, user submodules, user lessons, the module record, and the module achievement concurrently where no data dependency exists.

5.2 WHEN a data dependency exists between requests on the Submodule page, THEN the application SHALL fetch the dependent data only after its prerequisite completes.
