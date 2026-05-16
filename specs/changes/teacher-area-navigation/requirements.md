# Requirements

## Overview
The Teacher Area needs a dedicated navigation structure and layout shell. This includes a custom header, a specialized aside menu, and the foundational routing for managing modules (viewing and creating courses). The UI must follow the established application design but tailored for educator needs.

## Glossary
| Term | Definition |
|------|------------|
| Teacher Header | The top navigation bar specific to the teacher area, excluding gamification elements like XP and seeds. |
| Teacher Aside | The side navigation menu specific to the teacher area, containing links to module management and returning to the student area. |

## Assumptions
- The base `professor` route is already protected by necessary guards.

## Requirements

### REQ-1: Teacher Header Navigation

**User Story:** As a teacher, I want a header without student gamification elements, so that I can focus on my educator tasks while retaining profile access.

#### Acceptance Criteria
1.1 THE application SHALL display the user profile photo and edit menu in the Teacher Header.
1.2 THE application SHALL hide the gamification indicators for XP and seeds in the Teacher Header.

### REQ-2: Teacher Aside Navigation

**User Story:** As a teacher, I want a side menu with relevant management links, so that I can navigate my tools easily.

#### Acceptance Criteria
2.1 THE application SHALL display a "Meus cursos" item in the Teacher Aside.
2.2 THE application SHALL display a "Criar curso" item in the Teacher Aside.
2.3 THE application SHALL display a "Voltar a área de aluno" item in the Teacher Aside.
2.4 WHEN the "Voltar a área de aluno" item is activated, THEN the application SHALL navigate to the `/app` route.
2.5 THE application SHALL display a "Sair" item in the Teacher Aside.
2.6 THE application SHALL hide the "Atualizar para Pró" item in the Teacher Aside.

### REQ-3: Module Management Routing

**User Story:** As a teacher, I want dedicated pages for my modules and for creating new modules, so that I can manage my educational content.

#### Acceptance Criteria
3.1 WHEN the "Meus cursos" item is activated, THEN the application SHALL route to the "my-modules" view.
3.2 WHEN the "Criar curso" item is activated, THEN the application SHALL route to the "create-module" view.

### REQ-4: Layout Structure Integration

**User Story:** As a teacher, I want a consistent layout across the teacher area, so that my navigation experience is seamless.

#### Acceptance Criteria
4.1 THE application SHALL render the Teacher Header and Teacher Aside as persistent layout elements in the teacher area.
4.2 THE application SHALL display active child views within the main content area of the teacher layout.
