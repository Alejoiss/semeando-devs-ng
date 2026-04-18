# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare the database schema and data models.
2. **Feature Delivery** - Implement the service and update the UI.
3. **Acceptance Criteria Testing** - Verify requirement behavior.
4. **Final Checkpoint** - Validate completeness and readiness.

**Estimated Effort**: Medium (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Create database migration
  - Use Supabase MCP `mcp_supabase_apply_migration` to create the `extra_material` table with `lesson_id` foreign key.
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Implement ExtraMaterialService
  - Create the Angular service to fetch extra materials by lesson ID from Supabase.
  - _Depends: 1.1_
  - _Implements: DES-2_

- [x] 2.2 Update Lesson Component Logic
  - Inject the `ExtraMaterialService` and fetch extra materials during lesson load.
  - _Depends: 2.1_
  - _Implements: DES-2_

- [x] 2.3 Update Lesson Component UI
  - Render the materials in the "Resources Card" sidebar block, handling URL and FILE types.
  - _Depends: 2.2_
  - _Implements: DES-3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: fetch and display extra materials
  - Verify that extra materials for a lesson are retrieved and displayed as visual tags.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 3.2 Test: download file materials
  - Verify that clicking a FILE tag triggers a download.
  - Test type: e2e
  - _Depends: 2.3_
  - _Implements: REQ-2.1_

- [x] 3.3 Test: open URL materials
  - Verify that clicking a URL tag opens the link in a new tab.
  - Test type: e2e
  - _Depends: 2.3_
  - _Implements: REQ-3.1_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm materials are displayed.
  - REQ-2: Confirm FILE downloads work.
  - REQ-3: Confirm URLs open in new tab.
  - _Implements: All requirements_
