# Requirements

## Overview
This feature introduces a submodule creation and editing interface for professors. It allows educators to structure their courses by adding submodules to existing modules. The interface features a two-column design with a creation form on one side and a live preview on the other, followed by a section to manage lessons within the saved submodule.

## Glossary
| Term | Definition |
|------|------------|
| Submodule | A structural component of a course that belongs to a Module and contains multiple Lessons. |
| Slug | A URL-friendly string automatically generated from the submodule's title, used for routing and identification. |

## Assumptions
- The parent Module's ID will be passed via route parameters (e.g., `/professor/criar-submodulo/:moduleId`) or query parameters to maintain the relationship.
- Submodule avatars are uploaded to the same Supabase storage bucket used for modules.
- The drag-and-drop reordering functionality for lessons requires a visual indicator (drag icon), but the actual reordering logic might depend on a separate future task if not fully defined yet (we will implement the visual list and basic actions first).

## Requirements

### REQ-1: Submodule Form Initialization and Layout

**User Story:** As a professor, I want to access a dedicated layout to create or edit a submodule, so that I can input its details clearly.

#### Acceptance Criteria
1.1 WHEN the user accesses the submodule creation route, THEN the application SHALL display a form with inputs for title, description, and visual identity (image or icon).
1.2 THE application SHALL display a read-only slug input.
1.3 THE application SHALL include a "Back to Module" navigation button.
1.4 THE application SHALL display the form and the live preview side-by-side on desktop layouts.

### REQ-2: Auto-generating Submodule Slug

**User Story:** As a professor, I want the system to automatically generate a slug from the title, so that I do not have to manually format URL-friendly strings.

#### Acceptance Criteria
2.1 WHEN the user inputs a title, THEN the application SHALL automatically generate a URL-friendly slug and populate the read-only slug input.

### REQ-3: Submodule Visual Identity Selection

**User Story:** As a professor, I want to choose between uploading an image or specifying an icon for my submodule, so that it has an appropriate visual representation.

#### Acceptance Criteria
3.1 THE application SHALL provide a toggle or selection mechanism to choose between an image upload and an icon text input.
3.2 WHEN the image option is selected, THEN the application SHALL display a file upload field.
3.3 WHEN the icon option is selected, THEN the application SHALL display a text input for the icon name and a helper link to the Google Fonts icons library.

### REQ-4: Submodule Live Preview

**User Story:** As a professor, I want to see a live preview of the submodule card as I fill out the form, so that I can verify its appearance before saving.

#### Acceptance Criteria
4.1 WHEN the user modifies the title, description, or visual identity inputs, THEN the application SHALL update the preview card in real-time to reflect the changes.

### REQ-5: Submodule Creation and Validation

**User Story:** As a professor, I want to save my new submodule, so that it is added to the system and linked to the parent module.

#### Acceptance Criteria
5.1 WHEN the user clicks the save button, THEN the application SHALL validate that the title and description are present.
5.2 IF the validation fails, THEN the application SHALL display appropriate error messages.
5.3 WHEN the form is valid and submitted, THEN the application SHALL create the submodule linked to the provided module ID.

### REQ-6: Submodule Edit Mode

**User Story:** As a professor, I want to access an existing submodule, so that I can update its details.

#### Acceptance Criteria
6.1 WHEN the user accesses the edit route with a valid submodule ID, THEN the application SHALL populate the form with the existing submodule's data.
6.2 WHEN the user saves changes in edit mode, THEN the application SHALL update the existing submodule record.

### REQ-7: Lesson List Management

**User Story:** As a professor, I want to see and manage the lessons belonging to the submodule, so that I can organize the curriculum.

#### Acceptance Criteria
7.1 WHILE the submodule is unsaved (newly created and not yet submitted), the application SHALL hide the lesson list section.
7.2 WHILE the submodule is saved (edit mode), the application SHALL display a section containing an "Add Lesson" button and a list of existing lessons.
7.3 THE application SHALL display each lesson as a full-width row card containing a drag icon, the lesson's visual identity, title, an edit button, and a delete button.
