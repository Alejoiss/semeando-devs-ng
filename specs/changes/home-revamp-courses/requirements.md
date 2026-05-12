# Requirements

## Overview
The platform needs to be upgraded to a Progressive Web App (PWA) to allow offline access and installability. The landing page requires several content and functional updates to improve user experience and navigation, including dynamic data for learning modules and interactive methodology cards. Finally, a new dedicated Courses page will be introduced to showcase all available courses and their corresponding modules and lessons.

## Glossary
| Term | Definition |
|------|------------|
| PWA | Progressive Web App, enabling offline capabilities and installation. |
| Learning Module | A structured section containing lessons, quizzes, or challenges within a course. |
| Course | A collection of learning modules grouped under a specific topic. |
| Submodule | A division of a course containing specific lessons. |

## Assumptions
- The database schema for modules already exists and can be extended with an `in_revision` field.
- Images for the methodology cards exist at the specified paths (`src/assets/screens/...`).
- Mock data for the weekly ranking will be hardcoded in the frontend for now.
- The FAQ questions and answers will be provided later, so placeholder data will be used initially.
- PWA conversion can be achieved using standard Angular PWA features (`@angular/pwa`).

## Requirements

### REQ-1: Progressive Web App Conversion
**User Story:** As a user, I want to install the application and access it offline, so that I can study seamlessly without an internet connection.

#### Acceptance Criteria
1.1 THE system SHALL act as a Progressive Web App (PWA) allowing installation on mobile and desktop devices.
1.2 THE system SHALL cache core assets to support offline loading.

### REQ-2: Landing Page Hero Section Adjustments
**User Story:** As a visitor, I want a responsive hero section with clear calls to action, so that I can easily start my journey or explore courses.

#### Acceptance Criteria
2.1 WHEN rendered on mobile devices, the landing page SHALL display the phrase "Semeie seu futuro no Desenvolvimento Web" without line breaks that break the layout.
2.2 WHEN the user clicks "Começar minha jornada", THEN the system SHALL navigate to the login page.
2.3 WHEN the user clicks "Explorar cursos", THEN the system SHALL navigate to the courses page.
2.4 THE landing page SHALL display the image `src/assets/screens/home.png` in place of the previous "Plataforma Semeando Devs" image.

### REQ-3: Dynamic Learning Modules Display
**User Story:** As a visitor, I want to see accurate and dynamic learning modules on the landing page, so that I understand what the platform offers.

#### Acceptance Criteria
3.1 THE system SHALL fetch module data including title, icon, description, and lesson count from the database.
3.2 IF a module has the `in_revision` field set to true, THEN the landing page SHALL display the module with a disabled visual style.
3.3 IF a module has the `in_revision` field set to false, THEN the landing page SHALL display the module with a normal visual style.

### REQ-4: Interactive Methodology Cards
**User Story:** As a visitor, I want to interact with the methodology section, so that I can visually understand each learning method.

#### Acceptance Criteria
4.1 WHEN the user clicks "Teoria & Quiz", THEN the landing page SHALL display the image `src/assets/screens/teoria_e_quiz.png`.
4.2 WHEN the user clicks "Revisão Inteligente", THEN the landing page SHALL display the image `src/assets/screens/revisao_inteligente.png`.
4.3 WHEN the user clicks "Desafios de Código", THEN the landing page SHALL display the image `src/assets/screens/desafios_de_codigo.png`.
4.4 THE landing page SHALL display the "Teoria & Quiz" image by default before any user interaction.

### REQ-5: Progression Ecosystem Mock Ranking
**User Story:** As a visitor, I want to see an example of the progression ecosystem, so that I am motivated by the gamification features.

#### Acceptance Criteria
5.1 THE landing page SHALL display a mock weekly ranking component similar to the one in the modules page.

### REQ-6: Landing Page FAQ Section
**User Story:** As a visitor, I want to view frequently asked questions, so that I can get quick answers to common doubts.

#### Acceptance Criteria
6.1 THE landing page SHALL display an expandable FAQ list below the Progression Ecosystem section.
6.2 THE system SHALL populate the FAQ list using an internal data structure of questions and answers.

### REQ-7: Global Footer Updates
**User Story:** As a visitor, I want accurate footer links, so that I can navigate to legal and educational pages easily.

#### Acceptance Criteria
7.1 THE system SHALL remove the documentation link from the footer.
7.2 THE system SHALL merge the Terms of Use and Privacy Policy into a single "Termos de Uso/Política de privacidade" link.
7.3 THE system SHALL display a link to the Courses page in the footer.
7.4 WHEN the user clicks "Começar Agora — É Grátis", THEN the system SHALL navigate to the registration page.

### REQ-8: Dedicated Courses Page
**User Story:** As a visitor, I want a dedicated page to browse all courses, so that I can explore the full curriculum.

#### Acceptance Criteria
8.1 THE system SHALL fetch and display all courses, submodules, and lessons from the database.
8.2 WHEN the user clicks a course, THEN the courses page SHALL display its submodules.
8.3 WHEN the user clicks a submodule, THEN the courses page SHALL display only lessons of type `LESSON`.
8.4 THE courses page SHALL display a "Começar Agora — É Grátis" button at the bottom linking to the registration page.

### REQ-9: Public Access to Course Content Metadata
**User Story:** As an unauthenticated visitor, I want to see the course catalog, so that I can decide if I want to sign up.

#### Acceptance Criteria
9.1 THE system SHALL allow public read access to the modules, submodules, and lessons database tables.
