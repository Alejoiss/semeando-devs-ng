# Requirements

## Overview
The "Professor Create Lesson" feature enables educators to author and manage educational content within submodules. It provides a structured, tabbed interface to organize lesson content, supplementary materials, and interactive quizzes. This feature is essential for building the learning path of a course, allowing professors to create a cohesive learning experience that includes theory, practice, and evaluation.

## Glossary
| Term | Definition |
|------|------------|
| Lesson | A single unit of learning content within a submodule, which can include text, video, and interactive elements. |
| Submodule | A logical grouping of lessons within a module. |
| Extra Material | Supplementary resources provided with a lesson, such as PDFs, links, or code samples. |
| Quiz | A set of questions associated with a lesson to test the learner's knowledge. |
| Professor Area | A secure section of the application reserved for users with teacher privileges to manage content. |

## Assumptions
- The user is authenticated and has the "teacher" role.
- The parent submodule already exists before a lesson can be created.
- The "Lesson" model in the database supports content, extra materials, and quiz associations (or will be updated to do so).
- The "Professor Area" layout (Header, Aside) is already implemented and will wrap this new component.

## Requirements

### REQ-1: Lesson Authoring Navigation

**User Story:** As a professor, I want to navigate to a dedicated lesson creation or editing page, so that I can manage my course content efficiently.

#### Acceptance Criteria
1.1 THE application SHALL provide a route for lesson creation at `/professor/criar-licao/:idSubModule`.
1.2 THE application SHALL provide a route for lesson editing at `/professor/editar-licao/:id`.
1.3 THE application SHALL display the lesson authoring interface within the Professor Area layout.

### REQ-2: Tabbed Authoring Interface

**User Story:** As a professor, I want the lesson creation page to be organized into tabs, so that I can focus on one part of the lesson at a time (Content, Materials, Quiz).

#### Acceptance Criteria
2.1 THE lesson authoring interface SHALL display three distinct tabs: "Conteúdo", "Materiais extras", and "Quiz".
2.2 THE application SHALL load a specific component for each tab: `TabContent`, `TabExtraMaterial`, and `TabQuiz`.
2.3 THE lesson authoring interface SHALL highlight the currently active tab.
2.4 WHEN a professor clicks on a tab, THEN the application SHALL display the corresponding component without reloading the page.

### REQ-3: Lesson Creation Entry Point

**User Story:** As a professor, I want to access the lesson creation page directly from the submodule management view, so that I can easily add content to a specific submodule.

#### Acceptance Criteria
3.1 THE submodule creation/editing page SHALL include an "Adicionar lição" button.
3.2 WHEN a professor clicks the "Adicionar lição" button, THEN the application SHALL navigate to the lesson creation route with the correct submodule ID.

### REQ-4: Layout Aesthetics

**User Story:** As a professor, I want a premium and modern interface for authoring lessons, so that my workflow feels professional and engaging.

#### Acceptance Criteria
4.1 THE lesson authoring interface SHALL follow the "Neon Terminal" design system, avoiding 1px solid borders and using tonal layering for depth.
4.2 THE application SHALL use `surface_container` tiers to define nested containers.
4.3 THE tabs navigation SHALL use smooth transitions and micro-animations for interactive states.
