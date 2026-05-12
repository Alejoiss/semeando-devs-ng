# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** - Database schema and model updates
2. **Service Integration** - Create the data fetching and mutation service
3. **UI Implementation** - Build and integrate the modal component
4. **Acceptance Criteria Testing** - Verify requirement behavior
5. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (2-3 sessions)

## Phase 1: Foundation

- [x] 1.1 Add viewed column to user_newsletter
  - Create a Supabase migration to add the boolean `viewed` column (default false) to the `user_newsletter` table.
  - _Implements: DES-1_

- [x] 1.2 Update UserNewsletter model
  - Add the `viewed` boolean property to the `UserNewsletter` TypeScript interface.
  - _Implements: DES-1_

## Phase 2: Service Integration

- [x] 2.1 Create NewsletterService data fetching
  - Implement a new `NewsletterService` with a method to fetch unviewed newsletters for the authenticated user, joining with the `newsletter` table.
  - _Depends: 1.2_
  - _Implements: DES-2_

- [x] 2.2 Add markAsViewed mutation to NewsletterService
  - Add a method to update the `viewed` status of a specific `user_newsletter` record to `true`.
  - _Depends: 2.1_
  - _Implements: DES-2_

## Phase 3: UI Implementation

- [~] 3.1 Create NewsletterModal component
  - Build a standalone Angular component that displays the newsletter body, a close icon, and conditionally a custom CTA or default close button. Call `markAsViewed` on close actions.
  - _Depends: 2.2_
  - _Implements: DES-3_

- [ ] 3.2 Integrate NewsletterModal into the home screen
  - Add the `NewsletterModal` to the main app layout or home component so it automatically initializes and checks for unviewed newsletters.
  - _Depends: 3.1_
  - _Implements: DES-3_

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: fetch and display unviewed newsletter on home screen
  - Verify that navigating to the home screen queries for unviewed newsletters and displays the modal if one exists, or proceeds without displaying if none exist.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 4.2 Test: render correct CTA or default close button
  - Verify the modal correctly displays a close icon and either a custom CTA (if configured) or a default "Close" button.
  - Test type: unit
  - _Depends: 3.1_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 4.3 Test: acknowledge newsletter and close modal
  - Verify that clicking the close icon, custom CTA, or default Close button marks the newsletter as viewed and closes the modal.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm the home screen correctly identifies and displays unviewed newsletters.
  - REQ-2: Confirm the modal interface matches the design requirements for CTAs and close buttons.
  - REQ-3: Confirm acknowledgement correctly updates the database and dismisses the modal.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
