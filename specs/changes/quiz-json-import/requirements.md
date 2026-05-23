# Requirements

## Overview

Creating quiz questions manually is time-consuming: professors must fill in each question's statement, four answer alternatives, corresponding justifications, and mark the correct answer one by one. To streamline this process, the quiz editor needs a bulk-import mechanism that lets professors paste a structured JSON payload and have all questions persisted to the database in one action.

The feature adds an "Importar JSON" button to the quiz creation screen. When clicked, a modal opens with a code editor where the professor can paste a JSON array of questions. After clicking "Importar", the system validates and parses the JSON, populates the quiz question slots (up to 10), and persists each imported question and its answers to the database immediately—eliminating the need to save each question individually afterwards.

The import is additive and bounded: if fewer than 10 questions are provided, only those are imported and the remaining slots stay empty; if more than 10 are provided, only the first 10 are imported.

## Glossary

| Term | Definition |
|------|------------|
| Quiz | A set of up to 10 questions associated with a lesson |
| Question | A single quiz item composed of a markdown statement and exactly 4 answer alternatives |
| Answer | One of the four response options for a question, including the answer text, a didactic justification, and a flag indicating whether it is the correct answer |
| JSON Import Payload | A JSON array conforming to the structure `[{ question, answers: [{ text, isCorrect, reason }] }]` pasted by the professor |
| Modal | An overlay dialog that appears over the quiz editor to host the JSON code editor |

## Assumptions

- The `ngs-code-editor` (Monaco-based) component is already installed and available in the project (`@ngstack/code-editor`).
- The `QuizService.saveQuestion` method accepts the same `QuestionFormState`-shaped object already used by the manual save flow, so the import can reuse it.
- The quiz must already exist (i.e., `getOrCreateQuiz` has been called) before importing.
- All imported questions replace blank slots starting from index 0; they do not merge with existing questions already saved in the database.

## Requirements

### REQ-1: Import JSON Button on Quiz Header

**User Story:** As a professor, I want an "Importar JSON" button next to the quiz header actions, so that I can access the JSON import modal without leaving the quiz editor.

#### Acceptance Criteria

1.1 WHILE the quiz editor is displayed and not in a loading state, the application SHALL display an "Importar JSON" button in the quiz header area alongside the existing section title.

1.2 WHEN the professor clicks the "Importar JSON" button, THEN the application SHALL open the JSON import modal.

---

### REQ-2: JSON Import Modal with Code Editor

**User Story:** As a professor, I want a modal with a code editor to paste my JSON, so that I can review and correct the payload before importing.

#### Acceptance Criteria

2.1 WHEN the JSON import modal is open, THEN the application SHALL display a Monaco-based code editor pre-configured for JSON syntax highlighting.

2.2 WHEN the JSON import modal is open, THEN the application SHALL display an "Importar" (import) action button and a "Cancelar" (cancel) button.

2.3 WHEN the professor clicks the "Cancelar" button, THEN the application SHALL close the modal without making any changes to the quiz state.

---

### REQ-3: JSON Payload Validation

**User Story:** As a professor, I want the system to validate my JSON before importing, so that I receive a clear error message if the payload is malformed or missing required fields.

#### Acceptance Criteria

3.1 WHEN the professor clicks "Importar" and the code editor contains text that is not valid JSON, THEN the application SHALL display an error message inside the modal indicating that the JSON is invalid.

3.2 WHEN the professor clicks "Importar" and the parsed JSON is not an array, THEN the application SHALL display an error message inside the modal indicating that the payload must be a JSON array.

3.3 WHEN the professor clicks "Importar" and any item in the array is missing a `question` field or an `answers` array with exactly 4 items, THEN the application SHALL display an error message inside the modal identifying the malformed question.

3.4 WHEN the professor clicks "Importar" and any answer item is missing `text`, `isCorrect`, or `reason` fields, THEN the application SHALL display an error message inside the modal identifying the malformed answer.

---

### REQ-4: Question Count Capping and Slot Filling

**User Story:** As a professor, I want the import to respect the 10-question limit automatically, so that I don't need to manually trim my JSON before pasting.

#### Acceptance Criteria

4.1 WHEN a valid JSON array with more than 10 items is imported, THEN the application SHALL import only the first 10 questions and discard the rest.

4.2 WHEN a valid JSON array with fewer than 10 items is imported, THEN the application SHALL import all provided questions and leave the remaining quiz slots empty.

---

### REQ-5: Bulk Persist Imported Questions to Database

**User Story:** As a professor, I want all imported questions to be saved to the database automatically upon import, so that I don't have to click "Salvar" on each question individually.

#### Acceptance Criteria

5.1 WHEN the professor clicks "Importar" and the payload is valid, THEN the application SHALL persist each imported question and its four answers to the database before closing the modal.

5.2 WHILE the import operation is in progress, the application SHALL display a loading indicator inside the modal and disable the "Importar" button to prevent duplicate submissions.

5.3 IF any question fails to persist during the bulk import, THEN the application SHALL display an error message inside the modal indicating which question failed, and SHALL NOT close the modal.

5.4 WHEN all questions are successfully persisted, THEN the application SHALL close the modal and update the quiz editor to reflect the newly imported questions.

---

### REQ-6: Post-Import State Consistency

**User Story:** As a professor, I want the quiz editor to reflect the imported questions immediately after the import completes, so that I can visually confirm the data without reloading the page.

#### Acceptance Criteria

6.1 WHEN the import completes successfully, THEN the application SHALL update the in-memory question state in the quiz editor to show the imported statements, answers, justifications, and correct-answer markers.

6.2 WHEN the import completes successfully, THEN the application SHALL update the code editors for each imported question slot to display the imported statement text.
