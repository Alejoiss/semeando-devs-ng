# Implementation Tasks

## Overview
This implementation is organized into 4 phases:
1. **Foundation** - Update submodule interface triggering, router integration, and base lesson creation to support `CHALLENGE` lesson types.
2. **Feature Delivery** - Create the `TabCode` component and integrate it within the tab-based lesson authoring page.
3. **Acceptance Criteria Testing** - Verify requirement behaviors using automated and integration test cases.
4. **Final Checkpoint** - Validate completeness and readiness of the feature.

**Estimated Effort**: Medium (2-3 sessions)

## Phase 1: Foundation

- [ ] 1.1 Update submodule interface to support challenge creation trigger
  - Add the "Criar Desafio" button next to "Criar Lição" in `create-submodule.html`. The button routes to the lesson creation page with query parameter `type=CHALLENGE`.
  - _Implements: DES-1, REQ-1.1, REQ-1.2_

- [ ] 1.2 Update CreateLesson page to support query parameter parsing and lesson type initialization
  - Parse the `type` query parameter from the active route in `create-lesson.ts`. Initialize the lesson type as `CHALLENGE` when the query parameter is present.
  - _Implements: DES-1, REQ-1.3_

- [ ] 1.3 Update TabContent component to accept a lessonType input
  - Add a `lessonType` input signal to `TabContent` and pass the type when creating a new lesson through `LessonService`.
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [ ] 2.1 Update CreateLesson to support dynamic tab filtering
  - In `create-lesson.ts` and `create-lesson.html`, display only the "Conteúdo" and "Código" tabs when the lesson type is `CHALLENGE`. Enable the "Código" tab only when `lessonId` is present.
  - _Implements: DES-2, REQ-2.1, REQ-2.2_

- [ ] 2.2 Create the TabCode component files
  - Create the `TabCode` component files under `src/app/pages/professor/professor-app/create-lesson/tab-code/` with properties for language control and ngs-code-editor configuration.
  - _Implements: DES-3, REQ-3.1, REQ-3.3_

- [ ] 2.3 Implement TabCode component logic
  - Bind reactive form values to language and initialCode. Enforce lowercase formatting on the language input. Bind language changes to update the code model configuration. Call `LessonService.updateLesson` to save changes on submit.
  - _Implements: DES-3, REQ-3.2, REQ-3.4, REQ-3.5_

- [ ] 2.4 Integrate TabCode component inside CreateLesson page
  - Import `TabCode` into `CreateLesson` imports array. Render `<app-tab-code>` when the active tab is "code".
  - _Implements: DES-2, REQ-2.3_

## Phase 3: Acceptance Criteria Testing

- [ ] 3.1 Test: navigate to lesson creation with challenge query parameters
  - Verify that clicking "Criar Desafio" correctly routes to `create-lesson` with the challenge type.
  - Test type: integration
  - _Depends: 1.1, 1.2_
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [ ] 3.2 Test: filter and render tabs based on challenge lesson type
  - Verify that only "Conteúdo" and "Código" tabs are visible for challenges, and that the "Código" tab is disabled until the lesson is saved.
  - Test type: integration
  - _Depends: 2.1, 2.4_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3_

- [ ] 3.3 Test: enforce lowercase language and update code model
  - Verify that typing language values in the language input transforms the text to lowercase and updates the `ngs-code-editor` configuration.
  - Test type: unit
  - _Depends: 2.2, 2.3_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [ ] 3.4 Test: save challenge code configuration to database
  - Verify that clicking the save button invokes the `LessonService.updateLesson` method with the language and initial code.
  - Test type: unit
  - _Depends: 2.3_
  - _Implements: REQ-3.5_

## Phase 4: Final Checkpoint

- [ ] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm that professors can trigger challenge creation from the submodule interface.
  - REQ-2: Confirm that challenge lessons render only the Content and Code tabs.
  - REQ-3: Confirm that challenge code and lowercase language configuration are fully editable and persisted.
  - Run the test suite and verify no regressions are introduced.
  - _Implements: All requirements_
