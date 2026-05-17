# Requirements

## Overview
This specification defines the requirements for implementing the "Extra Materials" tab in the professor's lesson creation/editing dashboard. The feature allows professors to manage external links (URL type only) related to a lesson. 

Users can add new links with a title and URL, view a list of existing links, remove unwanted links, and persist all changes to the database by clicking a "Save" button.

## Glossary
| Term | Definition |
|------|------------|
| Extra Material | A supporting resource linked to a lesson, consisting of a title and a URL. |
| Professor | An educator user role authorized to create and edit lessons and submodules. |

## Assumptions
- Only links (`type === 'URL'`) are supported in this implementation phase. File uploads (`type === 'FILE'`) are excluded.
- The "Extra Materials" tab is only active or interactable once a lesson has already been created (meaning `lessonId` is present).

## Requirements

### REQ-1: Extra Materials List

**User Story:** As a professor, I want to view a list of extra materials currently linked to the lesson, so that I can see the supporting resources.

#### Acceptance Criteria
1.1 THE dashboard application SHALL display all saved extra materials associated with the active lesson.
1.2 WHEN the lesson has no associated extra materials, THEN the dashboard application SHALL show a message indicating that no materials are registered yet.
1.3 THE dashboard application SHALL display the title and the URL for each extra material entry.

### REQ-2: Add and Modify Extra Materials

**User Story:** As a professor, I want to add new links and remove unwanted links from the list, so that I can keep the resource references accurate.

#### Acceptance Criteria
2.1 WHEN the professor clicks the add material button, THEN the dashboard application SHALL add a new empty link row to the list containing title and URL input fields.
2.2 WHEN the professor clicks the remove button next to a material row, THEN the dashboard application SHALL remove that item from the local list.
2.3 THE dashboard application SHALL enforce validation requiring each extra material entry to have a non-empty title and a valid URL before allowing saving.

### REQ-3: Persist Extra Materials

**User Story:** As a professor, I want to save all changes to the extra materials, so that they are persisted in the database.

#### Acceptance Criteria
3.1 WHEN the professor clicks the save button, THEN the dashboard application SHALL send the updated list of extra materials and any deleted item IDs to the database service for persistence.
3.2 WHEN the persistence operation completes successfully, THEN the dashboard application SHALL display a temporary success banner.
3.3 IF the persistence operation fails, THEN the dashboard application SHALL display a specific error message to the professor.
