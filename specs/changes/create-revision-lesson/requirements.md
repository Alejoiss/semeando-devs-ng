# Requirements

## Overview
The system currently allows teachers to create and edit lessons of type `LESSON`. This feature adds a new lesson type `REVISION` which represents a simplified lesson that acts as a checkpoint for students. Teachers should be able to create a revision lesson directly from the submodule edit page with a single click, using pre-defined titles and descriptions, without leaving the page. To ensure revision lessons remain consistent, they must not be editable by the teacher, and any attempt to edit one must redirect the user back to the submodule page.

## Glossary
| Term | Definition |
|------|------------|
| Submodule | A subunit of a teaching module containing a list of lessons, challenges, and revisions. |
| Revision | A lesson type designed to review content, which is pre-configured and not editable. |

## Assumptions
- The database schema already supports the `REVISION` type in the `lessons` table's type column.
- The student app already contains appropriate routing and rendering logic for lessons of type `REVISION`.

## Requirements

### REQ-1: Create Revision Button in Submodule Page

**User Story:** As a teacher, I want to add a revision lesson to a submodule with a single click, so that I can quickly define a review checkpoint without filling out a detailed form.

#### Acceptance Criteria
1.1 WHEN the teacher clicks the create revision button, THEN the application SHALL send a request to create a new lesson with type REVISION, title "Revisão do submodule " followed by the submodule title, and description "Vamos revisar o que aprendemos até aqui neste submódulo".
1.2 WHEN the application successfully creates the revision lesson, THEN the application SHALL append the new lesson to the end of the lessons list and update the list display.
1.3 IF the revision lesson creation request fails, THEN the application SHALL display an error message to the teacher.

### REQ-2: Prevent Editing of Revision Lessons

**User Story:** As a teacher, I want to be blocked from editing revision lessons, so that their content remains standard across the platform.

#### Acceptance Criteria
2.1 THE application SHALL hide the edit button for all lessons in the lessons list that have the type REVISION.
2.2 WHEN the teacher attempts to access the edit URL of a revision lesson directly, THEN the application SHALL retrieve the lesson details to check its type.
2.3 WHILE the teacher is accessing the edit lesson page, WHEN the application determines the lesson type is REVISION, THEN the application SHALL redirect the teacher to the corresponding submodule edit page.
