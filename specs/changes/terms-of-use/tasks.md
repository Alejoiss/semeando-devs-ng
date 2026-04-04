# Implementation Tasks

## Overview

This implementation adds a standalone "Terms of Use" page and integrates mandatory acceptance into the registration process.

1.  **Foundation** - Setup component and routing.
2.  **Feature Delivery** - Implement page content and registration integration.
3.  **Acceptance Criteria Testing** - Verify that requirements are met.
4.  **Final Checkpoint** - Review and cleanup.

**Estimated Effort**: Small (2 sessions)

## Phase 1: Foundation

- [x] 1.1 Create the terms-of-use component
  - Generate a standalone component `src/app/pages/terms-of-use`.
  - _Implements: DES-1_

- [x] 1.2 Configure terms-of-use routing
  - Add the route `/termos-de-uso` to `src/app/app.routes.ts`.
  - Set title to `Semeando Devs | Termos de Uso`.
  - _Implements: DES-1, REQ-1.1, REQ-1.4_

## Phase 2: Feature Delivery

- [x] 2.1 Implement Terms of Use page layout
  - Use `Header` and `Footer` components in `terms-of-use.ts`.
  - Download and insert terms content into `terms-of-use.html`.
  - _Implements: DES-1, REQ-1.2, REQ-1.3_

- [x] 2.2 Update registration form logic
  - Add `termsAccepted` control with `Validators.requiredTrue` to `Register` class in `register.ts`.
  - _Implements: DES-2, REQ-2.2_

- [x] 2.3 Update registration form template
  - Add checkbox for Terms of Use.
  - Add link to `/termos-de-uso` that opens in a blank page.
  - _Implements: DES-2, REQ-2.1, REQ-2.3, REQ-2.4_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: terms page displays full content
  - Verify that navigating to `/termos-de-uso` shows the terms, header, and footer.
  - Test type: e2e
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 3.2 Test: registration requires terms acceptance
  - Verify that the registration form is invalid and cannot be submitted if the checkbox is unchecked.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 3.3 Test: terms link opens in new tab
  - Verify that clicking the link in the registration form opens the terms page in a new blank tab.
  - Test type: e2e
  - _Implements: REQ-2.3, REQ-2.4_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm Terms of Use page is correctly routed and styled.
  - REQ-2: Confirm registration flow mandates terms acceptance.
  - _Implements: All requirements_
