# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Component Logic** - Add import signals, types, and methods to `TabQuiz`
2. **Template & UX** - Add the import button and modal markup to the template
3. **Acceptance Criteria Testing** - Verify all requirement behaviors
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small (1-2 sessions)

---

## Phase 1: Component Logic

- [x] 1.1 Add internal import types to `tab-quiz.ts`
  - Define the `JsonImportQuestion` and `JsonImportAnswer` interfaces (used only within `importFromJson`).
  - _Implements: DES-3_

- [x] 1.2 Add import modal signals to `TabQuiz`
  - Add `isImportModalOpen` (boolean), `isImporting` (boolean), `importError` (string | null), and `importJsonContent` (string) signals.
  - _Depends: 1.1_
  - _Implements: DES-1, DES-4_

- [x] 1.3 Add `importCodeModel` for the JSON Monaco editor
  - Define a `CodeModel` property with `language: 'json'` and an empty initial value, used exclusively by the import modal editor instance.
  - _Depends: 1.2_
  - _Implements: DES-2_

- [x] 1.4 Add `openImportModal()` and `closeImportModal()` methods
  - `openImportModal()` sets `isImportModalOpen` to `true`.
  - `closeImportModal()` sets `isImportModalOpen` to `false` and resets `importError`, `importJsonContent`, and `importCodeModel` value to empty string.
  - _Depends: 1.2_
  - _Implements: DES-1, REQ-1.2, REQ-2.3_

- [x] 1.5 Add `updateImportJson(content: string)` method
  - Updates `importJsonContent` signal when the Monaco editor value changes inside the modal.
  - _Depends: 1.3_
  - _Implements: DES-2_

- [x] 1.6 Implement `importFromJson()` validation guards
  - Sequentially: try `JSON.parse`, assert `Array.isArray`, cap to first 10 items, assert each item has `question: string` and `answers` array of length 4, assert each answer has `text`, `isCorrect`, and `reason`.
  - Set `importError` with a Portuguese-language message on the first failing guard and return early.
  - _Depends: 1.4, 1.5_
  - _Implements: DES-3, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-4.1, REQ-4.2_

- [x] 1.7 Implement `importFromJson()` persistence loop
  - After all validation guards pass, set `isImporting` to `true`. Iterate the validated question array (max 10) and call `quizService.saveQuestion` for each item, mapping the JSON shape to the `QuestionFormState` shape expected by the service. Catch per-question errors, set `importError`, and return early without closing the modal. Use a `finally` block to reset `isImporting` to `false`.
  - _Depends: 1.6_
  - _Implements: DES-4, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4_

- [x] 1.8 Implement post-import state reset in `importFromJson()`
  - After successful persistence of all questions, build a fresh `QuestionFormState[]` from the saved results (identical shape to `loadQuiz`). Call `this.questions.set(newState)` and reset `this.codeModels = {}` so Monaco instances rebuild with the imported statement text. Then call `closeImportModal()`.
  - _Depends: 1.7_
  - _Implements: DES-5, REQ-6.1, REQ-6.2_

---

## Phase 2: Template & UX

- [x] 2.1 Add "Importar JSON" button to the quiz header in `tab-quiz.html`
  - Place the button next to the existing header row (alongside the `CONFIGURAÇÃO OBRIGATÓRIA` label). Style it as a secondary ghost button matching the design system (secondary color, outline variant border at 20% opacity). The button is only visible when the quiz is not in a loading state. Bind its click to `openImportModal()`.
  - _Depends: 1.4_
  - _Implements: DES-1, REQ-1.1, REQ-1.2_

- [x] 2.2 Add the import modal overlay to `tab-quiz.html`
  - Conditionally render the modal using `@if (isImportModalOpen())`. Structure: full-screen fixed backdrop with `backdrop-blur`, centered panel using `surface_container` background following the glassmorphic pattern from `NewsletterModal`. Include a modal header with title and close button wired to `closeImportModal()`.
  - _Depends: 1.4_
  - _Implements: DES-2, REQ-2.3_

- [x] 2.3 Add Monaco editor instance inside the import modal
  - Place an `<ngs-code-editor>` inside the modal body, bound to `importCodeModel`, with `theme: 'vs-dark'`, `language: 'json'`, minimap disabled, word wrap on. Wire `(valueChanged)` to `updateImportJson($event)`.
  - _Depends: 2.2, 1.5_
  - _Implements: DES-2, REQ-2.1_

- [x] 2.4 Add error banner inside the modal
  - Conditionally render an error banner using `@if (importError())` inside the modal body, above the action row. Style it as an error state (`bg-error/10`, `text-error`, left border `border-error`) consistent with the existing per-question error pattern in the quiz editor.
  - _Depends: 2.2_
  - _Implements: DES-3, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [x] 2.5 Add "Cancelar" and "Importar" action buttons inside the modal
  - Place both buttons in the modal footer row. "Cancelar" is wired to `closeImportModal()`. "Importar" is wired to `importFromJson()` and is disabled while `isImporting()` is true, showing a spinner when loading. Style "Importar" with the gradient primary button style matching the existing `SALVAR QUESTÃO` button.
  - _Depends: 2.4, 1.7_
  - _Implements: DES-1, DES-4, REQ-2.2, REQ-5.2_

---

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: import button is visible and opens the modal
  - Verify "Importar JSON" button appears in the quiz header when the quiz is loaded and not in a loading state. Verify clicking the button opens the modal overlay.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 3.2 Test: modal displays Monaco editor and action buttons
  - Verify the open modal contains a Monaco code editor element, an "Importar" button, and a "Cancelar" button.
  - Test type: integration
  - _Depends: 3.1_
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 3.3 Test: cancel closes modal without changing quiz state
  - Open the modal, type some text into the editor, click "Cancelar". Verify the modal is no longer visible and the `questions` signal retains its pre-modal state.
  - Test type: integration
  - _Depends: 3.1_
  - _Implements: REQ-2.3_

- [x] 3.4 Test: invalid JSON shows parse error inside modal
  - Paste malformed JSON into the editor and click "Importar". Verify an error message appears inside the modal and the modal does not close.
  - Test type: unit
  - _Implements: REQ-3.1_

- [x] 3.5 Test: non-array JSON shows type error inside modal
  - Paste a valid JSON object (not an array) and click "Importar". Verify an error message indicating array requirement appears inside the modal.
  - Test type: unit
  - _Implements: REQ-3.2_

- [x] 3.6 Test: structural validation errors are shown per question
  - Paste a JSON array where one item is missing `question` or has fewer than 4 answers. Verify the error message identifies the specific malformed question.
  - Test type: unit
  - _Implements: REQ-3.3_

- [x] 3.7 Test: answer field validation errors are shown per answer
  - Paste a JSON array where one answer is missing `text`, `isCorrect`, or `reason`. Verify the error message identifies the specific malformed answer.
  - Test type: unit
  - _Implements: REQ-3.4_

- [x] 3.8 Test: more than 10 questions are capped to 10
  - Pass a JSON array with 12 questions to `importFromJson`. Verify only the first 10 are persisted and the remaining slots are empty.
  - Test type: unit
  - _Implements: REQ-4.1_

- [x] 3.9 Test: fewer than 10 questions fills only the provided slots
  - Pass a JSON array with 3 questions to `importFromJson`. Verify 3 questions are persisted and 7 slots remain empty.
  - Test type: unit
  - _Implements: REQ-4.2_

- [x] 3.10 Test: loading state disables "Importar" button during persistence
  - Verify `isImporting` is `true` while `saveQuestion` calls are in flight and the "Importar" button is disabled during that period.
  - Test type: unit
  - _Implements: REQ-5.2_

- [x] 3.11 Test: persistence error shows per-question error without closing modal
  - Mock `QuizService.saveQuestion` to throw on the second question. Verify the error message references the failed question and the modal remains open.
  - Test type: unit
  - _Depends: 3.10_
  - _Implements: REQ-5.3_

- [x] 3.12 Test: successful import closes modal and updates quiz state
  - Mock `QuizService.saveQuestion` to succeed for all questions. Verify the modal closes and the `questions` signal contains the imported data.
  - Test type: unit
  - _Depends: 3.10_
  - _Implements: REQ-5.1, REQ-5.4_

- [x] 3.13 Test: post-import quiz editor reflects imported content
  - After a successful import, verify the `questions` signal contains the correct statements, answer texts, justifications, and correct-answer flags.
  - Test type: integration
  - _Depends: 3.12_
  - _Implements: REQ-6.1_

- [x] 3.14 Test: post-import code models are rebuilt with imported statements
  - After a successful import, verify `codeModels` is reset (`{}`) and that calling `getCodeModel(index, statement)` for each imported slot returns a model with the correct statement content.
  - Test type: unit
  - _Depends: 3.12_
  - _Implements: REQ-6.2_

---

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm "Importar JSON" button appears in the quiz header and opens the modal.
  - REQ-2: Confirm the modal contains a Monaco JSON editor, "Importar" and "Cancelar" buttons, and that cancel closes without state change.
  - REQ-3: Confirm validation errors appear inside the modal for malformed JSON, non-array, bad question structure, and bad answer fields.
  - REQ-4: Confirm >10 questions are capped to 10 and <10 leaves remaining slots empty.
  - REQ-5: Confirm all valid questions are persisted before modal closes, loading state disables the button, per-question errors keep the modal open, and success closes the modal.
  - REQ-6: Confirm `questions` signal and `codeModels` reflect imported content immediately after success.
  - Run `npm test` and resolve any remaining traceability or coverage gaps.
  - _Implements: All requirements_
