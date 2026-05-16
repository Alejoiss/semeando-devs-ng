# Implementation Tasks

## Overview

This implementation is organized into 4 phases to deliver the initial structure of the lesson creation feature:

1. **Foundation** - Scaffold components and configure routing
2. **Feature Delivery** - Implement the tabbed layout and integration entry points
3. **Acceptance Criteria Testing** - Verify navigation, tab behavior, and layout aesthetics
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Scaffold lesson creation components
  - Generate `CreateLesson` standalone component in `src/app/pages/professor/professor-app/create-lesson/`.
  - Generate `TabContent`, `TabExtraMaterial`, and `TabQuiz` standalone components as children of `CreateLesson`.
  - _Implements: DES-1_

- [x] 1.2 Configure lesson authoring routes
  - Add routes for `criar-licao/:idSubModule` and `editar-licao/:id` to `src/app/app.routes.ts`.
  - Ensure routes are protected by `authGuard` and `teacherGuard`.
  - _Implements: DES-2, REQ-1.1, REQ-1.2_

## Phase 2: Feature Delivery

- [x] 2.1 Implement tabbed layout shell
  - Build the UI for `CreateLesson` with a 3-tab navigation bar (Conteúdo, Materiais extras, Quiz).
  - Use Angular signals to manage the active tab and conditionally render child components.
  - Apply Neon Terminal design system tokens (surface tiers, glassmorphism).
  - _Implements: DES-3, DES-1, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-4.1, REQ-4.2_

- [x] 2.2 Wire submodule entry points
  - Update `CreateSubmodule` component to include the "Adicionar lição" button linked to the creation route.
  - Update the lesson list in `CreateSubmodule` to link the edit buttons to the editing route.
  - _Implements: DES-2, REQ-3.1, REQ-3.2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: lesson authoring navigation
  - Verify navigation to `/professor/criar-licao/:idSubModule` and `/professor/editar-licao/:id` within the professor layout.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 3.2 Test: tab switching behavior
  - Verify that clicking each tab correctly displays its corresponding component without page reload.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [x] 3.3 Test: entry points from submodule page
  - Verify that the "Adicionar lição" button and lesson edit buttons navigate to the correct lesson authoring routes.
  - Test type: integration
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 3.4 Test: layout aesthetics and design system
  - Verify that the interface follows the Neon Terminal style (no 1px borders, surface layering, smooth transitions).
  - Test type: integration
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - Confirm all initial structure requirements for lesson creation are met.
  - Run the application and perform manual walkthrough of the new routes and tabs.
  - _Implements: All requirements_
