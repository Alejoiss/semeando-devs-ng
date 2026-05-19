# Requirements

## Overview
This feature enables professors to create and edit coding challenges within submodules. It adds a "Criar Desafio" button to the submodule authoring screen, which routes to a specialized lesson authoring page for challenges. For challenge-type lessons, the authoring interface displays only "Conteúdo" and "Código" tabs (omitting extra materials and quizzes). The new "Código" tab allows the professor to specify the programming language (saved in lowercase) and the initial template code using an integrated code editor.

## Glossary
| Term | Definition |
|------|------------|
| CHALLENGE | A lesson type requiring the student to write and submit source code to solve a coding exercise. |
| Submodule Interface | The workspace where a professor manages metadata and lessons for a specific submodule. |
| Code Tab Component | The TabCode component that manages code editor configuration, programming language, and initial template code. |

## Assumptions
- The database schema for the `lessons` table already contains columns `language` and `initial_code` to store challenge metadata.
- The `LessonService` in the application already exposes methods to fetch, create, and update lesson objects with language and initial code fields.

## Requirements

### REQ-1: Challenge Creation Trigger
**User Story:** As a professor, I want to initiate the creation of a challenge from the submodule interface, so that I can add coding exercises to the curriculum.

#### Acceptance Criteria
1.1 THE submodule interface SHALL display a button labeled "Criar Desafio" next to the "Criar Lição" button.
1.2 WHEN the professor clicks the "Criar Desafio" button, THEN the application SHALL navigate to the lesson creation route passing a query parameter indicating that the type is CHALLENGE.
1.3 WHEN the application navigates to the lesson creation page with the CHALLENGE type query parameter, THEN the application SHALL initialize the new lesson with the CHALLENGE type.

### REQ-2: Challenge Editing and Tab Navigation
**User Story:** As a professor, I want to see only relevant tabs for a challenge lesson, so that I do not configure quizzes or extra materials by mistake.

#### Acceptance Criteria
2.1 WHILE editing or creating a lesson of type CHALLENGE, the application SHALL display only the "Conteúdo" and "Código" navigation tabs.
2.2 WHILE editing a lesson of type CHALLENGE, the application SHALL disable the "Código" navigation tab if the lesson has not yet been saved to the database.
2.3 WHEN the professor clicks the "Código" tab, THEN the application SHALL display the Code Tab Component.

### REQ-3: Challenge Code Configuration
**User Story:** As a professor, I want to configure the programming language and initial code template for a challenge, so that students have a starting codebase.

#### Acceptance Criteria
3.1 THE Code Tab Component SHALL display a text input field for the programming language.
3.2 THE Code Tab Component SHALL convert any input in the programming language field to lowercase characters.
3.3 THE Code Tab Component SHALL render the `ngs-code-editor` component for editing the initial code.
3.4 THE Code Tab Component SHALL configure the `ngs-code-editor` programming language option using the value from the programming language input field.
3.5 WHEN the professor clicks the save button on the Code Tab Component, THEN the application SHALL call the lesson service to save the language and initial code values to the database.
