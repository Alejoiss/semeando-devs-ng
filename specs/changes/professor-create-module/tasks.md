# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** — Prepare service layer, routes, and data model helpers
2. **Form & Slug** — Build the reactive form with auto-slug and visual identity toggle
3. **Preview & Persistence** — Implement live card preview and module save flow
4. **Sub-module Panel** — Add the sub-module list, drag-to-reorder, and delete
5. **Acceptance Criteria Testing** — Verify all requirement behaviors
6. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Medium (3–4 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Add edit route to app router
  - Register `{ path: 'editar-modulo/:id', loadComponent: CreateModule, title: 'Editar Módulo - Semeando Devs' }` as a child of the `professor` route in `app.routes.ts`.
  - _Implements: DES-6, REQ-6.1, REQ-6.2_

- [x] 1.2 Add `createModule()` to `ModuleService`
  - Accept a `CreateModulePayload` object and insert a row into the `modules` table. Return the created record (including its `id`).
  - _Implements: DES-5, REQ-5.1_

- [~] 1.3 Add `uploadModuleAvatar()` to `ModuleService`
  - Accept a `File`, generate `crypto.randomUUID()` as a folder prefix, upload to `module-avatars/{uuid}/{file.name}` in Supabase Storage, and return the public URL.
  - _Implements: DES-5, REQ-3.6_

- [x] 1.3 Add `uploadModuleAvatar()` to `ModuleService`
  - Accept a `File`, generate `crypto.randomUUID()` as a folder prefix, upload to `module-avatars/{uuid}/{file.name}` in Supabase Storage, and return the public URL.
  - _Implements: DES-5, REQ-3.6_

- [x] 1.4 Add `getSubModulesByModuleId()` to `SubModuleService`
  - Query `submodules` filtered by `module_id`, ordered by `order` ascending. Return `SubModule[]`.
  - _Depends: none_
  - _Implements: DES-7_

- [x] 1.5 Add `updateSubModuleOrder()` to `SubModuleService`
  - Accept `{ id: string; order: number }[]` and batch-update each sub-module's `order` field.
  - _Implements: DES-7, REQ-7.5_

- [x] 1.6 Add `deleteSubModule()` to `SubModuleService`
  - Delete a sub-module row by `id` from the `submodules` table. Throw on error.
  - _Implements: DES-7, REQ-7.6_

---

## Phase 2: Form & Slug

- [x] 2.1 Scaffold `CreateModule` component signals and form
  - Add `ChangeDetectionStrategy.OnPush`. Declare signals: `visualMode`, `selectedFile`, `avatarPreviewUrl`, `iconName`, `savedModuleId`, `isSaving`, `saveError`. Declare a `FormGroup` with `title` (required) and `description` (required) controls. Inject `ModuleService`, `SubModuleService`, `UserService`, and `ActivatedRoute`.
  - _Implements: DES-1, DES-2, DES-3_

- [x] 2.2 Implement slug derivation as a `toSignal`-based computed value
  - Create a `slug` signal that tracks `form.controls.title.valueChanges` (via `toSignal`) and applies: `normalize('NFD')` → strip combining marks → lowercase → replace non-alphanumeric with hyphens → collapse consecutive hyphens → trim hyphens.
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 2.3 Implement visual identity toggle in the template
  - Render two toggle buttons for "Imagem" and "Ícone" modes. Bind to `visualMode` signal. Use `@if` to conditionally show file input (image mode) or icon name text input + Google Icons link (icon mode).
  - _Depends: 2.1_
  - _Implements: DES-3, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [x] 2.4 Implement avatar file selection and local object URL preview
  - On file input `change` event, set `selectedFile` signal to the chosen `File` and set `avatarPreviewUrl` to `URL.createObjectURL(file)`. Revoke the previous object URL to avoid memory leaks.
  - _Depends: 2.3_
  - _Implements: DES-3, REQ-4.3_

- [x] 2.5 Build the two-column form layout in the template
  - Create the first-row two-column grid (`lg:grid-cols-2`). Left column: form fields (title, description, slug readonly, visual identity toggle + input, save button). Right column: preview placeholder. Follow the design system: `surface_container` backgrounds, no borders, `Plus Jakarta Sans` headings, `Inter` body.
  - _Depends: 2.1_
  - _Implements: DES-1, REQ-1.1_

---

## Phase 3: Preview & Persistence

- [x] 3.1 Implement `previewModule` computed signal
  - Assemble a partial `Module` object from `title` signal (via `toSignal`), `description` signal, `slug` computed signal, `iconName` signal, and `avatarPreviewUrl` signal.
  - _Depends: 2.2, 2.4_
  - _Implements: DES-4, REQ-4.1_

- [x] 3.2 Render the module card preview in the template
  - In the right column, mirror the card markup from `modules.html` (icon or avatar, title, description, progress bar placeholder). Bind to `previewModule()`. Use `@if` to switch between icon and image display.
  - _Depends: 3.1_
  - _Implements: DES-4, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 3.3 Implement form submission with validation
  - On save button click: mark all form controls as touched; return early if the form is invalid; validate that an image file or icon name is provided (show a visual identity error if neither). Set `isSaving` to true; disable save button during the operation.
  - _Depends: 2.1, 2.2_
  - _Implements: DES-5, REQ-1.2, REQ-1.3, REQ-1.4, REQ-3.5, REQ-5.4_

- [x] 3.4 Implement avatar upload and module creation on valid submit
  - If image mode and a file is selected, call `ModuleService.uploadModuleAvatar(file)` to get the public URL. Then call `ModuleService.createModule(payload)` with assembled fields including `created_by` from `UserService.currentUser()`. On success, set `savedModuleId`. On failure, set `saveError` (preserve form data). Always reset `isSaving` in a finally block.
  - _Depends: 3.3, 1.2, 1.3_
  - _Implements: DES-5, REQ-5.1, REQ-5.3, REQ-5.4, REQ-3.6_

- [x] 3.5 Display inline validation errors and save error in the template
  - Show per-field validation messages (title, description) when the control is touched and invalid. Show a visual identity error when neither icon name nor file is provided and the form was submitted. Show `saveError()` as a dismissible alert below the form.
  - _Depends: 3.3_
  - _Implements: DES-1, REQ-1.4, REQ-3.5, REQ-5.3_

---

## Phase 4: Sub-module Panel

- [x] 4.1 Load sub-modules when `savedModuleId` is set
  - Use an `effect()` that watches `savedModuleId`. When it becomes truthy, call `SubModuleService.getSubModulesByModuleId(id)` and populate a `subModules` signal array. Handle and display load errors inside the panel.
  - _Depends: 3.4, 1.4_
  - _Implements: DES-7, REQ-7.2_

- [x] 4.2 Render sub-module panel below the form with an "Add Sub-module" button
  - Use `@if (savedModuleId())` to conditionally render the second row. Include a button that navigates to `/professor/criar-submodulo`. The panel is hidden while `savedModuleId` is null.
  - _Depends: 4.1_
  - _Implements: DES-1, DES-7, REQ-7.1, REQ-7.2, REQ-7.3_

- [x] 4.3 Render sub-module row cards
  - Use `@for (sm of subModules(); track sm.id)` to render each sub-module as a full-width row card. Each card contains: `drag_indicator` icon (left), avatar or icon, title, edit button and delete button (right).
  - _Depends: 4.2_
  - _Implements: DES-7, REQ-7.4_

- [x] 4.4 Implement drag-to-reorder with HTML5 Drag and Drop API
  - Add `draggable="true"`, `dragstart`, `dragover`, and `drop` host bindings on each row card element. On drop, update the `subModules` signal array order optimistically and call `SubModuleService.updateSubModuleOrder(updates)`. On failure, revert to the previous order and show an inline error.
  - _Depends: 4.3_
  - _Implements: DES-7, REQ-7.5_

- [x] 4.5 Implement sub-module delete
  - On delete button click, call `SubModuleService.deleteSubModule(id)`. On success, remove the item from the `subModules` signal array. On failure, show an inline error; item remains in the list.
  - _Depends: 4.3, 1.6_
  - _Implements: DES-7, REQ-7.6_

---

## Phase 5: Acceptance Criteria Testing

- [ ] 5.1 Test: two-column layout is displayed on navigation to the creation route
  - Verify the form column and preview column are rendered when navigating to `/professor/criar-modulo`.
  - Test type: unit
  - _Implements: REQ-1.1_

- [ ] 5.2 Test: inline validation errors appear when form is submitted empty
  - Submit the form without filling any fields and verify inline messages appear for title and description.
  - Test type: unit
  - _Implements: REQ-1.2, REQ-1.3, REQ-1.4_

- [ ] 5.3 Test: slug is auto-generated and read-only
  - Type a value with accents and special characters in the title field; verify the slug is computed correctly (lowercase, hyphens, no accents) and the slug input is not editable.
  - Test type: unit
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3_

- [ ] 5.4 Test: visual identity toggle switches inputs correctly
  - Verify that selecting "Imagem" shows the file input; selecting "Ícone" shows the text input and Google Icons link; verify a visual identity error appears when neither is provided on submit.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5_

- [ ] 5.5 Test: avatar upload uses a UUID-prefixed storage path
  - Mock Supabase Storage and verify the upload path matches `{uuid}/{filename}` and that two uploads with the same filename produce different paths.
  - Test type: unit
  - _Implements: REQ-3.6_

- [ ] 5.6 Test: preview card updates in real time
  - Bind form values and verify the preview card reflects the current title, description, icon, and avatar preview without saving.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

- [ ] 5.7 Test: module is created with correct payload and sub-module panel appears
  - Fill valid form data and submit; verify `ModuleService.createModule` is called with the correct `created_by`, `slug`, and visual identity; verify the sub-module panel appears after success.
  - Test type: integration
  - _Implements: REQ-5.1, REQ-5.2_

- [ ] 5.8 Test: save button is disabled during save and error is shown on failure
  - Simulate a save failure; verify the save button is disabled while saving and an error message is displayed without clearing form data.
  - Test type: unit
  - _Implements: REQ-5.3, REQ-5.4_

- [ ] 5.9 Test: edit route is registered and shares the same component
  - Verify the router config includes `editar-modulo/:id` pointing to `CreateModule` with the correct title.
  - Test type: unit
  - _Implements: REQ-6.1, REQ-6.2_

- [ ] 5.10 Test: sub-module panel is hidden before save and visible after
  - Verify the sub-module panel is absent before a module is saved and present after `savedModuleId` is set.
  - Test type: unit
  - _Implements: REQ-7.1, REQ-7.2_

- [ ] 5.11 Test: add sub-module button navigates to the creation page
  - Click the "Add Sub-module" button and verify navigation to `/professor/criar-submodulo`.
  - Test type: unit
  - _Implements: REQ-7.3_

- [ ] 5.12 Test: sub-module row cards display required elements
  - Mock sub-module data and verify each card contains a drag handle, avatar or icon, title, edit button, and delete button.
  - Test type: unit
  - _Implements: REQ-7.4_

- [ ] 5.13 Test: drag-to-reorder updates order and persists to server
  - Simulate a drag-and-drop event; verify the signal array is reordered and `SubModuleService.updateSubModuleOrder` is called with the correct pairs.
  - Test type: unit
  - _Implements: REQ-7.5_

- [ ] 5.14 Test: delete removes sub-module from list after server success
  - Click delete on a sub-module card; verify the item is removed from the list after a successful delete response and remains if the server returns an error.
  - Test type: unit
  - _Implements: REQ-7.6_

---

## Phase 6: Final Checkpoint

- [ ] 6.1 Verify all acceptance criteria
  - REQ-1: Confirm two-column layout renders and required field validation blocks submission.
  - REQ-2: Confirm slug is auto-generated, read-only, and correctly normalized.
  - REQ-3: Confirm toggle, conditional inputs, visual identity validation, and UUID-prefixed upload path.
  - REQ-4: Confirm live preview reflects form values for title, description, icon, and avatar.
  - REQ-5: Confirm module creation payload, sub-module panel reveal, error handling, and loading state.
  - REQ-6: Confirm `editar-modulo/:id` route is registered with the correct component and title.
  - REQ-7: Confirm panel visibility rules, add button navigation, row card elements, reorder persistence, and delete behavior.
  - Run the test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
