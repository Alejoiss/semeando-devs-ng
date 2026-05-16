# Implementation Tasks

## Overview
This implementation is organized into 4 phases:

1. **Foundation** - Prepare folder structures and placeholders for the new teacher views.
2. **Feature Delivery** - Implement the specialized header, aside components, and layout shell.
3. **Acceptance Criteria Testing** - Verify component behavior and routing logic.
4. **Final Checkpoint** - Validate completeness and readiness for production.

**Estimated Effort**: Medium (2-3 sessions)

## Phase 1: Foundation

- [x] 1.1 Create folder structure for teacher components
  - Create directory `src/app/pages/professor/components` to house specialized navigation.
  - _Implements: DES-1_

- [x] 1.2 Create placeholders for child routes
  - Generate `MyModulesComponent` and `CreateModuleComponent` within `src/app/pages/professor/professor-app/`.
  - Use `ng g c` command for generation.
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [x] 2.1 Refactor `ProfessorAppComponent` layout
  - Move template and styles from `professor-app.ts` to `professor-app.html` and `professor-app.scss`.
  - Implement a layout shell similar to `App` with `router-outlet`.
  - _Implements: DES-2, REQ-4.1, REQ-4.2_

- [x] 2.2 Implement `HeaderProfessorComponent`
  - Create the component in `src/app/pages/professor/components/header-professor/`.
  - Adapt code from `InternalHeader`, removing XP/seeds indicators but preserving profile photo and edit menu.
  - _Implements: DES-1, REQ-1.1, REQ-1.2_

- [x] 2.3 Implement `AsideProfessorComponent`
  - Create the component in `src/app/pages/professor/components/aside-professor/`.
  - Adapt logic from `AsideMenu` with links: "Meus cursos", "Criar curso", "Voltar a área de aluno", and "Sair".
  - Ensure "Atualizar para Pró" is explicitly omitted.
  - _Implements: DES-1, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.5, REQ-2.6_

- [x] 2.4 Update routes in `app.routes.ts`
  - Configure child routes for the `professor` path: `meus-cursos` (default) and `criar-curso`.
  - Ensure "Voltar a área de aluno" link in `AsideProfessor` correctly targets the `/app` route.
  - _Implements: DES-2, REQ-2.4, REQ-3.1, REQ-3.2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: profile photo and menu visibility in teacher header
  - Verify that the profile photo and edit menu are present and gamification elements (XP, seeds) are hidden.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 3.2 Test: navigation links in teacher aside
  - Verify that "Meus cursos", "Criar curso", "Voltar a área de aluno", and "Sair" are present and "Atualizar para Pró" is hidden.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.5, REQ-2.6_

- [x] 3.3 Test: routing within teacher area
  - Verify that clicking "Meus cursos" and "Criar curso" routes correctly and "Voltar a área de aluno" navigates to `/app`.
  - Test type: integration
  - _Depends: 2.4_
  - _Implements: REQ-2.4, REQ-3.1, REQ-3.2_

- [x] 3.4 Test: layout integrity
  - Verify that the layout renders correctly with persistent navigation elements and active child views in the outlet.
  - Test type: e2e
  - _Depends: 2.1_
  - _Implements: REQ-4.1, REQ-4.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - Confirm all navigation, layout, and component requirements are fully met.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
