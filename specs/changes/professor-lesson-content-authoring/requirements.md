# Requirements

## Overview
This feature introduces the ability for professors to add, edit, and reorder lesson contents when editing an existing lesson. Lesson contents can be of type VIDEO, IMAGE, or MARKDOWN. The interface will feature a two-column layout on large screens, with the authoring tools on the left and a live student preview on the right.

## Glossary
| Term | Definition |
|------|------------|
| Lesson Content | A specific block of learning material within a lesson (Video, Image, or Markdown). |
| Markdown Editor | The `ngs-code-editor` component used for text input. |

## Requirements

### REQ-1: Add Lesson Content

**User Story:** As a professor, I want to add new content sections to a lesson, so that I can provide learning materials to students.

#### Acceptance Criteria
1.1 WHERE the professor is editing an existing lesson, the application SHALL display a section to manage lesson contents.
1.2 WHEN the professor clicks the button to add new content, THEN the application SHALL present options to select the content type (VIDEO, IMAGE, or MARKDOWN).
1.3 WHEN the professor selects a content type, THEN the application SHALL append a new content block of the selected type to the list.

### REQ-2: Manage Content Blocks

**User Story:** As a professor, I want to edit, collapse, and remove content blocks, so that I can organize the lesson material effectively.

#### Acceptance Criteria
2.1 THE application SHALL display each content block within a collapsible container displaying its content type in the title.
2.2 WHEN the professor clicks the expand/collapse icon, THEN the application SHALL toggle the visibility of the content block's body.
2.3 WHEN the professor clicks the remove icon on a content block, THEN the application SHALL remove the content block from the lesson.
2.4 WHEN the professor drags the reorder icon, THEN the application SHALL reorder the content block within the list based on the drop position.

### REQ-3: Content Specific Inputs

**User Story:** As a professor, I want to input specific data based on the content type, so that the material is correctly formatted.

#### Acceptance Criteria
3.1 WHERE the content block type is VIDEO, the application SHALL display an input field for a video URL.
3.2 WHERE the content block type is IMAGE, the application SHALL display an interface to upload an image.
3.3 WHERE the content block type is MARKDOWN, the application SHALL display a markdown editor for text input.

### REQ-4: Layout and Preview

**User Story:** As a professor, I want to see a live preview of the lesson alongside my edits, so that I can ensure the student experience is correct.

#### Acceptance Criteria
4.1 WHERE the screen is large (desktop), the application SHALL display the lesson content authoring interface on the left half of the screen.
4.2 WHERE the screen is large (desktop), the application SHALL display a live preview of the lesson on the right half of the screen.
