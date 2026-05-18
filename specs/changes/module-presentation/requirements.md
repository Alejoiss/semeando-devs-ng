# Requirements

## Overview
This feature introduces a "Module Presentation" ("Apresentação do módulo") capability to the Semeando Devs platform. Currently, course modules only have a basic description and a list of submodules/lessons. To make the learning experience more engaging and gamified (aligning with the "Neon Terminal" design philosophy), teachers need to be able to present a high-octane summary of what the module brings: its learning objectives, modules, and chapter goals. 

On the administrative side, teachers can add, delete, and reorder rich content sections (Markdown, Images, and Videos) in the module creation/edition screen, with a real-time preview side-by-side. On the student side, the presentation will be displayed as a collapsible accordion directly under the module description in the module content page, keeping the view clean by default but easily expandable for an immersive overview.

## Glossary
| Term | Definition |
|------|------------|
| Section Content | A block of educational content that can be of type TEXT, MARKDOWN, IMAGE, or VIDEO. |
| Creator Interface | The authoring interface used by teachers and administrators to create and edit modules, lessons, and submodules. |
| Student Interface | The viewing interface used by students to access courses, modules, and lesson content. |
| Accordion | A collapsible user interface element that expands to show content or collapses to hide it when toggled. |

## Assumptions
- The database schema already contains the `section_content` table which will be extended with a foreign key to the `modules` table.
- Section contents used for module presentations only support the types `MARKDOWN`, `IMAGE`, and `VIDEO`.
- The AI content evaluation feature (available in lessons) is out of scope for the module presentation page and is not required in the creator interface.

## Requirements

### REQ-1: Database Schema Extension

**User Story:** As a developer, I want to associate section contents with a module, so that I can store module presentation media and text.

#### Acceptance Criteria
1.1 THE database SHALL store a nullable `module_id` foreign key referencing the `modules` table in the `section_content` table.
1.2 THE database SHALL allow administrators and assigned teachers to manage section contents that are linked to a module.

### REQ-2: Module Presentation Authoring Interface

**User Story:** As a teacher, I want to add, remove, and reorder presentation content sections for a module, so that I can introduce the module topics to students.

#### Acceptance Criteria
2.1 WHEN a teacher edits an existing module, the creator interface SHALL display a module presentation section below the submodule list.
2.2 THE creator interface SHALL allow the teacher to append new section contents of type `MARKDOWN`, `IMAGE`, or `VIDEO`.
2.3 THE creator interface SHALL allow the teacher to delete existing presentation section contents.
2.4 THE creator interface SHALL allow the teacher to drag and drop presentation section contents to modify their sequence order.
2.5 THE creator interface SHALL render a real-time preview of the presentation section contents on the right side of the authoring section.
2.6 WHEN the teacher saves the module, the application SHALL store all added, updated, or reordered presentation section contents, and delete all removed presentation section contents in the database.

### REQ-3: Module Presentation Display for Students

**User Story:** As a student, I want to view a module's presentation content within an accordion, so that I can optionally learn about the module goals.

#### Acceptance Criteria
3.1 WHILE a student views a module's content page, the student interface SHALL display a collapsible accordion titled "Apresentação do módulo" below the module description and above the submodules list.
3.2 THE student interface SHALL keep the "Apresentação do módulo" accordion collapsed by default.
3.3 WHEN a student expands the accordion, the student interface SHALL render all presentation section contents of the module in their defined order according to their content type.
