# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Component Logic** — Add modal state signals, interface, and open/close/import methods to the TypeScript component
2. **Template & UI** — Add the "Importar JSON" button to the header and render the modal overlay in the HTML template
3. **Acceptance Criteria Testing** — Verify all requirement behaviors via unit tests in the existing spec file
4. **Final Checkpoint** — Confirm completeness, run the test suite, and review traceability

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Component Logic

- [x] 1.1 Add `JsonImportItem` interface and import signals
  - Declare the local `JsonImportItem` interface (`{ title: string; url: string }`) inside `tab-extra-material.ts`.
  - Add three signals: `isImportModalOpen` (`signal(false)`), `importError` (`signal<string | null>(null)`), and `importRawJson` (`signal('')`).
  - _Implements: DES-1_

- [x] 1.2 Add `openImportModal()` and `closeImportModal()` methods
  - `openImportModal()` sets `isImportModalOpen` to `true`.
  - `closeImportModal()` resets `isImportModalOpen` to `false`, clears `importError` to `null`, and resets `importRawJson` to `''`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.1, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 1.3 Add `updateImportJson()` method
  - Accepts the raw string from the textarea `(input)` event and calls `importRawJson.set(value)`.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 1.4 Add `importFromJson()` validation pipeline
  - Parse the value of `importRawJson()` with `JSON.parse`; on syntax error set `importError` and return.
  - Guard: if parsed value is not an array, set `importError` and return.
  - Guard: iterate items; if any item has no `title` or an empty `title`, set `importError` identifying the item index and return.
  - Guard: iterate items; if any item has no `url` or a `url` that does not match `/https?:\/\/.+/`, set `importError` identifying the item index and return.
  - On all guards passing: clear the `FormArray` with the existing `while` loop pattern, push one new `FormGroup` per item using the same schema as `addMaterial()`, then call `closeImportModal()`.
  - _Depends: 1.2, 1.3_
  - _Implements: DES-2, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [x] 1.5 Wire FormArray rebuild on successful import
  - After all validation guards in `importFromJson()` pass, clear the `FormArray` using the existing `while (this.materials.length !== 0)` pattern and push one `FormGroup` per imported item using the same schema as `addMaterial()` (`id`, `title`, `type`, `url` with validators).
  - Call `closeImportModal()` at the end to reset all modal signals.
  - _Depends: 1.4_
  - _Implements: DES-3, REQ-2.5, REQ-3.1, REQ-3.2, REQ-3.3_

## Phase 2: Template & UI

- [x] 2.1 Add "Importar JSON" button to the header actions row
  - Inside the existing `<div class="flex items-center justify-between flex-wrap gap-4">` header block in `tab-extra-material.html`, add a secondary-styled button with `id="import-json-btn"`, `(click)="openImportModal()"`, and `aria-label` for accessibility.
  - Button is only visible when `lessonId()` is non-null (within the `@else` branch that already guards the whole content area).
  - _Depends: 1.2_
  - _Implements: DES-4, REQ-1.1_

- [x] 2.2 Add modal overlay block to the template
  - Append an `@if (isImportModalOpen())` block at the end of `tab-extra-material.html`.
  - **Backdrop**: `fixed inset-0 z-[9999]` wrapper with `bg-surface/70 backdrop-blur-xl` inner div; `(click)="closeImportModal()"` on the backdrop div; `aria-hidden="true"`.
  - **Panel**: `relative` div with `bg-surface-container`, `max-w-lg`, `rounded-2xl`, `w-full`, `mx-auto`; `role="dialog"`, `aria-modal="true"`, `aria-labelledby="import-extra-modal-title"`; stops click propagation with `(click)="$event.stopPropagation()"`.
  - **Header**: title (`id="import-extra-modal-title"`) + close button calling `closeImportModal()`.
  - **Instructions**: `<p>` with `font-mono text-xs text-on-surface-variant` describing the expected format: array of objects with `"title"` and `"url"` strings.
  - **Textarea**: `<textarea>` bound with `(input)="updateImportJson($any($event.target).value)"`, `[value]="importRawJson()"`, `class="w-full bg-surface-container-lowest rounded-xl p-4 min-h-[200px] resize-y text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"`, `aria-label="Editor JSON de materiais extras"`.
  - **Error banner**: `@if (importError())` block with `bg-error/10 border-l-4 border-error text-error` styling.
  - **Footer**: "Cancelar" ghost button (`(click)="closeImportModal()"`) + "Importar" primary gradient button (`id="import-extra-submit-btn"`, `(click)="importFromJson()"`, `aria-label`).
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-1.2, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-4.1, REQ-4.2, REQ-4.3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: open modal when "Importar JSON" button is clicked
  - Verify `isImportModalOpen()` becomes `true` after calling `openImportModal()`.
  - Verify the button is absent from the template when `lessonId` is null.
  - Test type: unit
  - _Implements: REQ-1.1_

- [x] 3.2 Test: modal renders required elements when open
  - Verify that with `isImportModalOpen()` true the rendered template contains the textarea, instructions paragraph, "Cancelar" button, and "Importar" button.
  - Test type: unit
  - _Implements: REQ-1.2_

- [x] 3.3 Test: reject invalid JSON syntax
  - Call `importFromJson()` with `importRawJson` set to a malformed string; verify `importError()` is non-null and `isImportModalOpen()` remains `true`.
  - Test type: unit
  - _Implements: REQ-2.1_

- [x] 3.4 Test: reject valid JSON that is not an array
  - Call `importFromJson()` with a valid JSON object (not array); verify `importError()` is non-null.
  - Test type: unit
  - _Implements: REQ-2.2_

- [x] 3.5 Test: reject array items with missing or empty title
  - Call `importFromJson()` with an array where one item has `title: ""`; verify `importError()` identifies the item index.
  - Test type: unit
  - _Implements: REQ-2.3_

- [x] 3.6 Test: reject array items with missing or invalid URL
  - Call `importFromJson()` with an array where one item has `url: "not-a-url"`; verify `importError()` identifies the item index.
  - Test type: unit
  - _Implements: REQ-2.4_

- [x] 3.7 Test: successful import populates FormArray and closes modal
  - Call `importFromJson()` with a valid array of two items; verify `materials.length` equals 2, each group preserves `title` and `url`, and `isImportModalOpen()` is `false`.
  - Test type: unit
  - _Implements: REQ-2.5, REQ-3.1, REQ-3.2_

- [x] 3.8 Test: cancel clears modal state and leaves materials unchanged
  - Add two items to the `FormArray`, open the modal, type JSON into `importRawJson`, then call `closeImportModal()`; verify `materials.length` is still 2, `importRawJson()` is `''`, and `importError()` is `null`.
  - Test type: unit
  - _Implements: REQ-3.3, REQ-4.1, REQ-4.2, REQ-4.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm "Importar JSON" button is present only with a saved lessonId and opens the modal with all required elements.
  - REQ-2: Confirm all four validation guards reject bad payloads with informative messages and a valid payload replaces the FormArray and closes the modal.
  - REQ-3: Confirm imported entries appear as editable form groups and cancelling the modal leaves the list unchanged.
  - REQ-4: Confirm cancel, backdrop click, and successful import all reset textarea and error state.
  - Run `npm test` and confirm no regressions in `tab-extra-material.spec.ts`.
  - _Implements: All requirements_
