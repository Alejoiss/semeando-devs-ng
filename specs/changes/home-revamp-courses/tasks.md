# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare PWA capabilities and data models
2. **Feature Delivery** - Implement UI and page logic updates
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Foundation

- [x] 1.1 Add PWA capabilities
  - Integrate `@angular/pwa` to configure the service worker and manifest for offline and installable support.
  - _Implements: DES-1_

- [x] 1.2 Update Module data model
  - Add the `in_revision` boolean flag to the Module interface/model and apply default logic if necessary.
  - _Implements: DES-3_

- [~] 1.3 Configure Public RLS for Course Metadata
  - Create a migration to verify and allow `SELECT` on `modules`, `submodules`, and `lessons` tables for the `anon` / `public` role.
  - _Implements: DES-6_

## Phase 2: Feature Delivery

- [x] 2.1 Update Global Footer
  - Remove documentation link, merge terms/privacy policy, and add link to the courses page. Update "Começar Agora" routing.
  - _Implements: DES-4_

- [x] 2.2 Update Landing Page layout and interactions
  - Update hero section image and routing logic, fix responsive text breaking.
  - Implement interactive methodology cards with signal state, a mock weekly ranking, and an expandable FAQ section.
  - _Implements: DES-2_

- [x] 2.3 Update Landing Page dynamic modules
  - Inject `ModuleService` to fetch and render modules, evaluating `in_revision` to set active or disabled states visually.
  - _Depends: 1.2, 2.2_
  - _Implements: DES-3_

- [x] 2.4 Create Dedicated Courses Page
  - Generate the `CoursesComponent`, implement layout and visual hierarchy fetching data using Module, SubModule, and Lesson services. Only show lessons of type `LESSON`.
  - _Implements: DES-5_

## Phase 3: Acceptance Criteria Testing

- [ ] 3.1 Test: verify PWA installation and caching
  - Confirm the app is installable and caches assets for offline usage.
  - Test type: e2e
  - _Depends: 1.1_
  - _Implements: REQ-1.1, REQ-1.2_

- [ ] 3.2 Test: verify landing page hero and routing
  - Ensure hero text doesn't break, CTAs point to correct pages, and the new image displays.
  - Test type: e2e
  - _Depends: 2.2_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [ ] 3.3 Test: verify dynamic learning modules rendering
  - Confirm modules display correctly with fetched data, and disabled state is applied when `in_revision` is true.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [ ] 3.4 Test: verify methodology card interactions
  - Verify clicking specific cards changes the displayed image and defaults to "Teoria & Quiz".
  - Test type: e2e
  - _Depends: 2.2_
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4_

- [ ] 3.5 Test: verify mock ranking and FAQ section
  - Ensure mock ranking renders properly and FAQ expands as expected.
  - Test type: e2e
  - _Depends: 2.2_
  - _Implements: REQ-5.1, REQ-6.1, REQ-6.2_

- [ ] 3.6 Test: verify global footer updates
  - Confirm specific links were removed, merged, or added, and CTAs route correctly.
  - Test type: e2e
  - _Depends: 2.1_
  - _Implements: REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4_

- [ ] 3.7 Test: verify dedicated courses page
  - Confirm courses fetch hierarchy, display submodules on click, and filter out non-LESSON types.
  - Test type: e2e
  - _Depends: 2.4_
  - _Implements: REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4_

- [ ] 3.8 Test: verify public access to course metadata
  - Verify that unauthenticated requests to read modules, submodules, and lessons succeed.
  - Test type: integration
  - _Depends: 1.3_
  - _Implements: REQ-9.1_

## Phase 4: Final Checkpoint

- [ ] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm PWA functionality.
  - REQ-2 to REQ-6: Validate landing page updates.
  - REQ-7: Validate footer updates.
  - REQ-8: Validate the new Courses page flow.
  - REQ-9: Validate public database access policies.
  - _Implements: All requirements_
