# Implementation Tasks

## Overview
This implementation is organized into 4 phases:

1. **Foundation** - Prepare core structures and entry points
2. **Feature Delivery** - Implement the main design elements
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Low (1-2 sessions)

## Phase 1: Foundation

- [ ] 1.1 Import LessonType in create-submodule.ts
  - Import `LessonType` from `src/models/lesson/lesson` in the submodule creation component.
  - _Implements: DES-1_

- [ ] 1.2 Prepare CreateLesson component for redirect
  - Inject `LessonService` in `CreateLesson` component (`create-lesson.ts`) and import `LessonType`.
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [ ] 2.1 Add "Criar Revisão" button in submodule HTML
  - Add the "Criar Revisão" button next to the "Adicionar Lição" button in `create-submodule.html`.
  - _Implements: DES-1, REQ-1.1_

- [ ] 2.2 Implement createRevision() method in create-submodule.ts
  - Implement `createRevision()` method to call `lessonService.createLesson(...)` with title `"Revisão do submodule " + submoduleName` and description `"Vamos revisar o que aprendemos até aqui neste submódulo"`, order = `lessonCount + 1`, and refresh the lesson list.
  - _Depends: 1.1, 2.1_
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3_

- [ ] 2.3 Hide edit button for revision lessons
  - Wrap the edit button in a conditional flow in `create-submodule.html` to hide it if `lesson.type === 'REVISION'`.
  - _Implements: DES-2, REQ-2.1_

- [ ] 2.4 Implement redirection check in CreateLesson
  - Implement the check in `CreateLesson` component constructor or initialization: load the lesson by ID, and if it's of type `REVISION`, redirect the user to `/professor/editar-submodulo/:subModuleId`.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-2.2, REQ-2.3_

## Phase 3: Acceptance Criteria Testing

- [ ] 3.1 Test: create revision lesson successfully
  - Verify that calling `createRevision` successfully creates a revision lesson with the correct title, description, type, and order, and reloads the lessons list.
  - Test type: unit
  - _Depends: 2.2_
  - _Implements: REQ-1.1, REQ-1.2_

- [ ] 3.2 Test: handle revision lesson creation failure
  - Verify that if revision creation fails, the error message is displayed to the user via alert or UI error state.
  - Test type: unit
  - _Depends: 2.2_
  - _Implements: REQ-1.3_

- [ ] 3.3 Test: edit button visibility for revision lessons
  - Verify that the edit button is not visible for lessons of type `REVISION`.
  - Test type: unit
  - _Depends: 2.3_
  - _Implements: REQ-2.1_

- [ ] 3.4 Test: redirect on revision lesson edit access
  - Verify that accessing the edit lesson page for a revision lesson loads the lesson and redirects to the submodule edit page.
  - Test type: unit
  - _Depends: 2.4_
  - _Implements: REQ-2.2, REQ-2.3_

## Phase 4: Final Checkpoint

- [ ] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm that the "Criar Revisão" button is styled properly, creates a revision lesson at the end of the list with the correct pre-defined fields, and handles errors gracefully.
  - REQ-2: Confirm that the edit button is hidden for revision lessons in the list, and that attempts to edit a revision lesson via URL are redirected to the submodule edit page.
  - Run the test suite and verify the application builds and runs correctly.
  - _Implements: All requirements_
