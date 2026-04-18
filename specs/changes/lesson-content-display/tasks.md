# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare the data service and model
2. **Feature Delivery** - Implement the UI logic and rendering
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3 sessions)

## Phase 1: Foundation

- [ ] 1.1 Create SectionContentService
  - Implement a service to fetch lesson section contents from Supabase `section_content` table, ordered by the `order` field.
  - _Implements: DES-1_

- [ ] 1.2 Wire SectionContentService into Lesson Component
  - Inject the new service into the `Lesson` component and create a signal to store the sections.
  - _Depends: 1.1_
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [ ] 2.1 Implement Lesson Header UI
  - Update `lesson.html` to display the lesson title, description, and XP value (on the right) using the "Neon Terminal" style.
  - _Implements: DES-3, REQ-1.1, REQ-1.2, REQ-1.3_

- [ ] 2.2 Implement Content Loading Logic
  - Update `lesson.ts` to fetch section contents when a lesson is loaded and populate the sections signal.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-2.1, REQ-2.2_

- [ ] 2.3 Implement Dynamic Content Rendering
  - Update `lesson.html` to iterate over the sections signal using `@for` and render each section based on its type (TEXT, MARKDOWN, IMAGE, VIDEO).
  - _Depends: 2.2_
  - _Implements: DES-2, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

## Phase 3: Acceptance Criteria Testing

- [ ] 3.1 Test: Verify lesson header display
  - Verify that the lesson title, description, and XP are displayed correctly in the UI.
  - Test type: e2e
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [ ] 3.2 Test: Verify content fetching and ordering
  - Verify that all sections for a lesson are fetched and displayed in the correct order.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2_

- [ ] 3.3 Test: Verify multimedia content rendering
  - Verify that TEXT, MARKDOWN, IMAGE, and VIDEO sections render correctly with appropriate styling (100% width for media).
  - Test type: e2e
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

## Phase 4: Final Checkpoint

- [ ] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm lesson header metadata is visible.
  - REQ-2: Confirm sections are loaded and ordered correctly.
  - REQ-3: Confirm all content types render as expected.
  - _Implements: All requirements_
