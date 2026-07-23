# Requirements

## Overview

Administradores da plataforma precisam visualizar e gerenciar os alunos cadastrados. A lista de alunos no painel administrativo deve permitir consultar rapidamente quem está registrado, filtrar por nome ou e-mail, ordenar os registros e navegar por paginação para não sobrecarregar a interface.

Além da listagem, cada aluno deve ter uma página de detalhes acessível a partir da lista, que será implementada futuramente. Por ora, a tela de detalhes exibirá um estado de placeholder.

O escopo deste documento cobre a rota `/admin/lista-de-alunos` (listagem paginada) e a rota `/admin/lista-de-alunos/:id-aluno` (detalhes do aluno – placeholder).

## Glossary

| Term | Definition |
|------|------------|
| Aluno | Usuário com `role === 'student'` registrado na plataforma. |
| Admin | Usuário com `role === 'admin'` autenticado no painel administrativo. |
| Paginação | Divisão dos resultados em páginas de tamanho configurável para facilitar a navegação. |
| isPro | Indicador booleano que representa se o aluno possui assinatura Pro ativa. |

## Assumptions

- A consulta de alunos é feita diretamente ao Supabase, filtrando pelo campo `role = 'student'` na tabela `profiles`.
- Os dados de nome e avatar do aluno vêm de `user_metadata` do Supabase Auth e/ou da tabela `profiles`.
- A data de cadastro corresponde ao campo `created_at` do registro do usuário no Supabase Auth.
- O campo `avatar` pode ser vazio ou nulo; nesses casos, exibe-se um placeholder visual.
- Somente usuários com `role === 'admin'` podem acessar as rotas `/admin/*`; o guard de autenticação já protege essas rotas.

## Requirements

### REQ-1: Listagem de Alunos Paginada

**User Story:** As an admin, I want to view a paginated list of students, so that I can browse all registered students without being overwhelmed by the full list at once.

#### Acceptance Criteria

1.1 WHEN the admin navigates to `/admin/lista-de-alunos`, THEN the student list page SHALL display a list containing only users whose `role` is `student`.

1.2 THE student list page SHALL display students in pages of 10 records by default.

1.3 WHEN the admin selects a different page size, THEN the student list page SHALL re-render the list showing 10, 25, 50, or 100 records per page according to the selection.

1.4 WHEN the admin clicks a page navigation control, THEN the student list page SHALL display the corresponding page of student records.

1.5 THE student list page SHALL display the total number of students and the current page range (e.g., "1–10 de 87 alunos").

---

### REQ-2: Ordenação da Lista

**User Story:** As an admin, I want to sort the student list by name or registration date, so that I can find students more efficiently.

#### Acceptance Criteria

2.1 THE student list page SHALL display students ordered by name in ascending alphabetical order by default.

2.2 WHEN the admin selects the "Data de Cadastro" sort option, THEN the student list page SHALL re-render the list ordered by registration date in descending order (newest first).

2.3 WHEN the admin selects the "Nome" sort option, THEN the student list page SHALL re-render the list ordered by name in ascending alphabetical order.

---

### REQ-3: Filtro por Nome ou E-mail

**User Story:** As an admin, I want to filter the student list by name or email, so that I can quickly locate a specific student.

#### Acceptance Criteria

3.1 THE student list page SHALL display a text input field that accepts a search query for filtering students.

3.2 WHEN the admin types a search query in the filter input, THEN the student list page SHALL display only students whose name or email contains the query string (case-insensitive).

3.3 WHEN a filter is applied, THEN the student list page SHALL reset to the first page and update the result count accordingly.

3.4 WHEN the admin clears the filter input, THEN the student list page SHALL restore the full student list with the current sort order applied.

---

### REQ-4: Informações por Aluno na Listagem

**User Story:** As an admin, I want to see key information for each student at a glance, so that I can identify and assess students without opening their detail page.

#### Acceptance Criteria

4.1 THE student list page SHALL display the following fields for each student: avatar image (or a placeholder icon if absent), full name, email address, registration date, and Pro status.

4.2 IF a student's avatar is absent or empty, THEN the student list page SHALL display a visual placeholder in place of the avatar.

4.3 THE student list page SHALL display the Pro status as a distinct visual badge that differentiates Pro students from non-Pro students.

4.4 THE student list page SHALL format the registration date in a human-readable format (e.g., "23 jul. 2026").

---

### REQ-5: Navegação para Detalhes do Aluno

**User Story:** As an admin, I want to click on a student to view their detail page, so that I can access more information about that student.

#### Acceptance Criteria

5.1 WHEN the admin clicks on a student row or card, THEN the student list page SHALL navigate to `/admin/lista-de-alunos/:id-aluno` where `:id-aluno` is the student's unique identifier.

5.2 WHEN the admin navigates to `/admin/lista-de-alunos/:id-aluno`, THEN the student detail page SHALL display a placeholder indicating that the detailed view is under construction.

---

### REQ-6: Acessibilidade da Lista

**User Story:** As an admin, I want the student list to be accessible and navigable, so that the interface works for all users.

#### Acceptance Criteria

6.1 THE student list page SHALL assign a unique, descriptive `id` attribute to all interactive elements (filter input, sort selector, pagination controls).

6.2 THE student list page SHALL pass WCAG AA color contrast requirements for all text and interactive elements.

6.3 THE student list page SHALL be navigable via keyboard for all interactive elements including filter input, sort selector, page size selector, and pagination controls.
