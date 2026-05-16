# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare the component, routing, and base layout.
2. **Feature Delivery** - Implement the reactive form, auto-slug, live preview, persistence, and lesson list.
3. **Acceptance Criteria Testing** - Verify all required behaviors.
4. **Final Checkpoint** - Validate completeness and readiness.

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Foundation

- [x] 1.1 Scaffold component and routing
  - Generate the `CreateSubModule` standalone component and add routes for `/professor/criar-submodulo/:moduleId` and `/professor/editar-submodulo/:id`.
  - _Implements: DES-1_

- [x] 1.2 Implement base layout
  - Build the two-column grid layout for the form and preview, including the "Back to Module" button.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.1, REQ-1.3, REQ-1.4_

## Phase 2: Feature Delivery

- [x] 2.1 Implement reactive form and identity toggle
  - Create the form controls for title and description. Add a signal-driven toggle for selecting between image upload and icon text input.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-3.1, REQ-3.2, REQ-3.3_

- [~] 2.2 Implement auto-generating slug
  - Add logic to generate a URL-friendly slug whenever the title changes and bind it to a read-only input.
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-1.2, REQ-2.1_

- [x] 2.3 Implement live preview card
  - Bind the reactive form values to the existing `SubmoduleCard` component.
  - _Depends: 2.1_
  - _Implements: DES-3, REQ-4.1_

- [x] 2.4 Implement submission logic and edit mode population
  - Handle form validation, map to the Supabase service for insert/update, and load existing data if an ID is provided via the route.
  - _Depends: 2.1_
  - _Implements: DES-1, DES-3, REQ-5.1, REQ-5.2, REQ-5.3, REQ-6.1, REQ-6.2_

- [x] 2.5 Implement lessons list
  - Fetch and conditionally render the lessons list along with the "Add Lesson" button when the submodule is saved or in edit mode.
  - _Depends: 2.4_
  - _Implements: DES-4, REQ-7.1, REQ-7.2, REQ-7.3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: render creation and edit layouts
  - Verify the application displays the form, read-only slug, "Back" button, side-by-side layout, and populates data in edit mode.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-6.1_

- [x] 3.2 Test: generate slug from title
  - Verify entering a title automatically populates the formatted slug.
  - Test type: integration
  - _Implements: REQ-2.1_

- [x] 3.3 Test: toggle visual identity fields
  - Verify the form shows the correct fields depending on the selected image/icon option.
  - Test type: integration
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 3.4 Test: form validation rules
  - Verify minimum length requirements and required field errors block submission.
  - Test type: integration
  - _Implements: REQ-5.2, REQ-5.3_

- [x] 3.5 Test: live preview updates
  - Verify that typing in the form immediately updates the preview card component.
  - Test type: integration
  - _Implements: REQ-4.1_

- [x] 3.6 Test: save logic flow
  - Verify successful creation updates URL, displays success message, and shows lesson list.
  - Test type: e2e/integration
  - _Implements: REQ-5.1, REQ-6.2_

- [x] 3.7 Test: render conditional lesson list
  - Verify the list and Add Lesson button do not appear until the submodule has a valid ID.
  - Test type: integration
  - _Implements: REQ-7.1, REQ-7.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Walkthrough & User Sign-off
  - Ensure all features work as defined, and present for review.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
  - REQ-5 & 6: Confirm submission and edit mode persistence.
  - _Implements: All requirements_
