# Requirements

## Overview

The extra materials tab in the lesson creation flow currently allows professors to add links manually, one by one. Professors need a way to bulk-import a pre-defined list of extra materials using a JSON array, following the same import pattern already established in the quiz tab. This reduces friction when preparing lesson content.

The JSON payload format is an array of objects, each with a `title` (string) and a `url` (string). Once imported, the materials replace the current list displayed in the form and behave exactly like manually added entries — they can be individually edited or removed before saving.

## Glossary

| Term | Definition |
|------|------------|
| Extra Material | A supplementary reference link (title + URL) attached to a lesson, intended for students to consult. |
| Import JSON Modal | A modal dialog that accepts a raw JSON payload and converts it into form entries in the extra materials tab. |
| JSON Payload | A JSON array of objects, where each object contains a `title` string and a `url` string representing one extra material entry. |

## Assumptions

- The JSON import for extra materials does not need a Monaco code editor (unlike the quiz import); a plain `<textarea>` is sufficient, matching the simpler data structure.
- Importing JSON replaces only the current in-memory form state; the professor must still press "Salvar Materiais" to persist the changes to the database.
- The URL field must follow the existing `https?://` pattern already enforced on manually added entries.

## Requirements

### REQ-1: Open Import JSON Modal

**User Story:** As a professor, I want to open a JSON import modal from the extra materials tab, so that I can quickly populate the materials list without adding each link manually.

#### Acceptance Criteria

1.1 WHILE the lesson has been saved and a `lessonId` exists, WHEN the professor clicks the "Importar JSON" button in the extra materials tab header, THEN the application SHALL display the Import JSON Modal.

1.2 WHEN the Import JSON Modal is open, THEN the application SHALL display a `textarea` for the professor to paste the JSON payload, an instruction describing the expected format, a "Cancelar" button, and an "Importar" button.

### REQ-2: Validate and Import JSON Payload

**User Story:** As a professor, I want the system to validate the pasted JSON before applying it, so that only well-formed and correctly structured data is imported.

#### Acceptance Criteria

2.1 WHEN the professor clicks "Importar" with a syntactically invalid JSON string in the textarea, THEN the application SHALL display an inline error message inside the modal stating that the JSON is invalid.

2.2 WHEN the professor clicks "Importar" with a valid JSON string that is not an array, THEN the application SHALL display an inline error message stating that the payload must be an array.

2.3 WHEN the professor clicks "Importar" with a JSON array where any item is missing the `title` field or has an empty `title`, THEN the application SHALL display an inline error message identifying the offending item index.

2.4 WHEN the professor clicks "Importar" with a JSON array where any item is missing the `url` field or has a `url` that does not match the `https?://` pattern, THEN the application SHALL display an inline error message identifying the offending item index.

2.5 WHEN the professor clicks "Importar" with a valid JSON array, THEN the application SHALL replace the current in-memory materials list with the imported entries and close the modal without errors.

### REQ-3: Post-Import Form State

**User Story:** As a professor, I want the imported materials to appear in the editable form just like manually added entries, so that I can review and adjust them before saving.

#### Acceptance Criteria

3.1 WHEN a JSON import succeeds, THEN the application SHALL populate the materials `FormArray` with one reactive form group per imported item, preserving the `title` and `url` values.

3.2 WHEN a JSON import succeeds, THEN the application SHALL clear any previous error messages from the modal before closing it.

3.3 WHEN the professor clicks "Cancelar" or the modal backdrop, THEN the application SHALL close the modal and restore the materials list to its state before the modal was opened.

### REQ-4: Close and Reset Modal

**User Story:** As a professor, I want to dismiss the import modal without losing my existing materials, so that I can cancel the operation if I change my mind.

#### Acceptance Criteria

4.1 WHEN the professor clicks "Cancelar" while the modal is open, THEN the application SHALL close the modal and leave the existing materials list unchanged.

4.2 WHEN the professor clicks the modal backdrop while the modal is open, THEN the application SHALL close the modal and leave the existing materials list unchanged.

4.3 WHEN the Import JSON Modal is closed by any means, THEN the application SHALL reset the textarea content and any displayed import error message.
