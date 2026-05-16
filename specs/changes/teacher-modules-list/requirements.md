# Requirements

## Overview
The teacher area of the Semeando Devs application needs a dedicated view where teachers can see and access the modules they are assigned to. This view will serve as a starting point for managing module content.

The system will fetch modules associated with the logged-in teacher and display them in a responsive grid, allowing the teacher to navigate directly to the editing interface for each module.

## Glossary
| Term | Definition |
|------|------------|
| Teacher Module | A module record in the database linked to a specific user with the 'teacher' role. |
| Neon Terminal | The design system aesthetic characterized by high contrast, neon accents, and depth through background color shifts rather than borders. |

## Assumptions
- The logged-in user has the 'teacher' role.
- The `teacher_modules` table correctly maps teachers to their respective modules.

## Requirements

### REQ-1: Assigned Module Visibility
**User Story:** As a teacher, I want to see only the modules I am assigned to, so that I can focus on the content I am responsible for.

#### Acceptance Criteria
1.1 THE application SHALL display only modules that have a corresponding entry in the `teacher_modules` table for the currently logged-in user.
1.2 IF no modules are assigned to the teacher, THEN the application SHALL show a message indicating that no modules were found.

### REQ-2: Module Information Display
**User Story:** As a teacher, I want to see the title, description, and icon of each module, so that I can easily identify them.

#### Acceptance Criteria
2.1 THE application SHALL display the title, description, and icon (or avatar) for each assigned module.
2.2 THE application SHALL use the "Neon Terminal" aesthetic for the module cards, using background color shifts to define boundaries instead of 1px borders.

### REQ-3: Responsive Grid Layout
**User Story:** As a teacher, I want the module list to be easy to read on any device, so that I can manage my modules from anywhere.

#### Acceptance Criteria
3.1 WHILE viewing on a large screen (desktop/tablet), the application SHALL display modules in a 2-column grid.
3.2 WHILE viewing on a small screen (mobile), the application SHALL display modules in a 1-column grid.

### REQ-4: Module Editing Access
**User Story:** As a teacher, I want to have a clear way to edit my modules, so that I can update my course content.

#### Acceptance Criteria
4.1 THE application SHALL display an "Editar" button in the bottom right corner of each module card.
4.2 WHEN the teacher clicks the "Editar" button, THEN the application SHALL redirect the user to the path `/professor/edit-module/:slug`.

### REQ-5: Page Identity and Accessibility
**User Story:** As a teacher, I want the page to be properly identified and accessible, so that I can navigate and use it efficiently.

#### Acceptance Criteria
5.1 THE application SHALL set the page title to "Meus Módulos - Semeando Devs".
5.2 THE application SHALL include descriptive ARIA labels for the "Editar" buttons to identify which module is being edited.
