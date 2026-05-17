# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare service logic
2. **Feature Delivery** - Implement the authoring components and UI
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-4 sessions)

## Phase 1: Foundation

- [x] 1.1 Expand SectionContentService
  - Add `upsertSectionContents` and `deleteSectionContents` methods.
  - _Implements: DES-3_

## Phase 2: Feature Delivery

- [x] 2.1 Integrate Content Authoring State
  - Add `contentList` signal to `TabContent` component.
  - Implement drag and drop array logic and handle Add/Remove block actions.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 2.2 Build Authoring UI Layout
  - Modify `tab-content.html` to display the accordion items with VIDEO, IMAGE, MARKDOWN specific inputs.
  - Bind inputs to the component's state.
  - Apply the two-column grid on desktop viewports.
  - _Depends: 2.1_
  - _Implements: DES-1_

- [x] 2.3 Integrate Live Preview
  - In the right column of `tab-content.html`, render the live preview pane reacting to `contentList` state.
  - _Depends: 2.2_
  - _Implements: DES-2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: add new content blocks
  - Verify options appear and selection appends a block.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 3.2 Test: manage and reorder blocks
  - Verify collapse, remove, and drag-to-reorder functionality.
  - Test type: e2e
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [x] 3.3 Test: content-specific inputs
  - Verify video URL, image upload, and markdown editors render correctly per type.
  - Test type: integration
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 3.4 Test: two-column layout and preview
  - Verify layout splits on desktop and right pane shows real-time preview.
  - Test type: e2e
  - _Implements: REQ-4.1, REQ-4.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm users can add new content blocks.
  - REQ-2: Confirm users can manage and reorder blocks.
  - REQ-3: Confirm content specific inputs behave correctly.
  - REQ-4: Confirm the two-column layout and preview work on large screens.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
