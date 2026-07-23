# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** – Criar o model `AdminStudent` e o service de consulta ao Supabase
2. **Service Implementation** – Implementar a lógica de consulta paginada, filtrada e ordenada
3. **Feature Delivery** – Implementar o componente de listagem, os controles de UI e o placeholder de detalhes
4. **Acceptance Criteria Testing** – Verificar comportamento de cada critério de aceitação
5. **Final Checkpoint** – Validar completude e prontidão da feature

**Estimated Effort**: Medium (3–5 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Create `AdminStudent` model and `StudentListResult` type
  - Create `src/models/admin-student/admin-student.ts` with the `AdminStudent` interface (id, name, email, avatar, isPro, createdAt) and the `StudentListResult` type (students array + total count) and the `StudentQueryParams` type (search, sortField, sortDir, page, pageSize).
  - _Implements: DES-1_

- [x] 1.2 Scaffold `AdminStudentService`
  - Generate the service with `ng g s app/services/admin-student`, inject `SupabaseService`, and define the `getStudents(params: StudentQueryParams): Promise<StudentListResult>` method signature returning an empty result initially.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 1.3 Register child route `lista-de-alunos/:id-aluno` in `app.routes.ts`
  - Add the lazy-loaded route for `AdminStudentDetail` as a child of the `admin` route, with `title: 'Detalhes do Aluno - Semeando Devs'`.
  - _Implements: DES-5_

---

## Phase 2: Service Implementation

- [x] 2.1 Implement server-side filter, sort, and pagination in `AdminStudentService`
  - Build the `getStudents` method using Supabase `.from('profiles')`, filtering by `role = 'student'`, applying `.ilike()` for name/email search, `.order()` for sort field and direction, and `.range()` for pagination. Return rows mapped to `AdminStudent[]` and the total count using `{ count: 'exact', head: false }`.
  - _Depends: 1.2_
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5, REQ-2.1, REQ-2.2, REQ-2.3, REQ-3.2, REQ-3.3_

- [x] 2.2 Write unit tests for `AdminStudentService`
  - Create `src/app/services/admin-student.spec.ts`. Mock the Supabase client. Verify that: (a) the `role = 'student'` filter is always applied, (b) `.ilike()` is called with the search string when provided, (c) `.order()` uses the correct field and direction, (d) `.range()` calculates offset from page and pageSize, (e) the returned `total` matches the Supabase count.
  - _Depends: 2.1_
  - _Implements: DES-1, REQ-1.1, REQ-2.1, REQ-3.2_

---

## Phase 3: Feature Delivery

- [x] 3.1 Scaffold `AdminStudents` component files
  - Convert the existing inline-template `students.ts` into a multi-file component: create `students.html` and `students.scss`, update `students.ts` to reference them via `templateUrl` and `styleUrl`. Set `ChangeDetectionStrategy.OnPush`.
  - _Implements: DES-2_

- [x] 3.2 Add reactive state signals to `AdminStudents`
  - Declare signals: `searchQuery = signal('')`, `sortField = signal<'name' | 'created_at'>('name')`, `currentPage = signal(0)`, `pageSize = signal(10)`, `students = signal<AdminStudent[]>([])`, `totalCount = signal(0)`, `isLoading = signal(false)`, `error = signal<string | null>(null)`.
  - Add `loadStudents()` async method that calls `AdminStudentService.getStudents()` and sets the signals.
  - Add `effect()` that watches all filter/sort/page signals and calls `loadStudents()`. Reset `currentPage` to 0 when `searchQuery` changes.
  - _Depends: 3.1_
  - _Implements: DES-2, REQ-1.2, REQ-1.3, REQ-1.4, REQ-3.1, REQ-3.3, REQ-3.4_

- [x] 3.3 Build the search, sort, and page-size controls in the template
  - Add `<input id="student-search-input">` with debounced `input` event updating `searchQuery`.
  - Add `<select id="student-sort-select">` with options "Nome (A-Z)" and "Data de Cadastro" updating `sortField`.
  - Add `<select id="student-page-size-select">` with options 10, 25, 50, 100 updating `pageSize`.
  - All controls must have visible `<label>` elements with matching `for` attributes and `aria-label` where needed.
  - _Depends: 3.2_
  - _Implements: DES-4, REQ-2.2, REQ-2.3, REQ-3.1, REQ-6.1, REQ-6.3_

- [x] 3.4 Build the pagination controls and result counter in the template
  - Add "Anterior" and "Próxima" `<button>` elements with unique `id` attributes and descriptive `aria-label` attributes. Disable buttons at boundaries (first/last page).
  - Display a result counter string computed from `currentPage`, `pageSize`, and `totalCount` (e.g., "1–10 de 87 alunos").
  - _Depends: 3.2_
  - _Implements: DES-4, REQ-1.4, REQ-1.5, REQ-6.1, REQ-6.3_

- [x] 3.5 Build the student card/row template
  - Render each student with `@for (student of students(); track student.id)`.
  - Display avatar using `<img>` with `NgOptimizedImage` when URL is present; fall back to `<span class="material-symbols-outlined">person</span>` when absent (using `@if`/`@else`).
  - Display name, email, registration date (formatted with `DatePipe` locale `pt-BR`, format `'dd MMM yyyy'`), and Pro badge.
  - Pro badge: use `secondary` (#fe69ac) glassmorphic badge for Pro users; neutral `surface_container` badge for non-Pro users.
  - Each card must be clickable (keyboard and mouse) and navigate to `/admin/lista-de-alunos/:id` on activation.
  - _Depends: 3.2_
  - _Implements: DES-3, REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-5.1_

- [x] 3.6 Add loading, error, and empty states to the template
  - Show a skeleton loader (animated placeholder cards) while `isLoading()` is true.
  - Show an inline error message with a "Tentar novamente" button when `error()` is non-null.
  - Show an empty-state illustration with message "Nenhum aluno encontrado" when `students()` is empty and `isLoading()` is false.
  - _Depends: 3.2_
  - _Implements: DES-2_

- [x] 3.7 Create `AdminStudentDetail` placeholder component
  - Generate `src/app/pages/admin/admin-app/students/student-detail/student-detail.ts`.
  - Display an inline placeholder template with an icon and the message "Detalhes do aluno em construção." consistent with the visual pattern used in other admin placeholders.
  - _Depends: 1.3_
  - _Implements: DES-5, REQ-5.2_

- [x] 3.8 Apply design system styling to the student list page
  - Apply the "Neon Terminal" design system: surface hierarchy (`surface_container` cards on `surface_container_low` section on `surface` base), `Plus Jakarta Sans` for headings, `Inter` for body text, `Space Grotesk` for labels and badges.
  - Ensure no 1px solid borders; use background color shifts per the No-Line Rule.
  - Ensure Pro badge uses a glassmorphic style with `secondary` glow.
  - _Depends: 3.5, 3.6_
  - _Implements: DES-3, DES-4_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: only students are displayed in the list
  - Verify that the list page fetches and displays only users with `role = 'student'`.
  - Test type: unit
  - _Implements: REQ-1.1_

- [x] 4.2 Test: default and configurable page sizes apply correctly
  - Verify the list renders 10 records by default and re-renders with 25, 50, or 100 records when page size is changed.
  - Test type: unit
  - _Implements: REQ-1.2, REQ-1.3_

- [x] 4.3 Test: page navigation controls show the correct page of records
  - Verify clicking "Próxima" and "Anterior" loads the corresponding page and updates the result counter.
  - Test type: unit
  - _Implements: REQ-1.4, REQ-1.5_

- [x] 4.4 Test: default sort is by name ascending
  - Verify that on initial load, the sort order sent to the service is `name` ascending.
  - Test type: unit
  - _Implements: REQ-2.1_

- [x] 4.5 Test: changing sort order re-renders the list accordingly
  - Verify that selecting "Data de Cadastro" triggers a service call with `created_at` descending, and selecting "Nome" triggers a call with `name` ascending.
  - Test type: unit
  - _Implements: REQ-2.2, REQ-2.3_

- [x] 4.6 Test: filter input narrows the list and resets to page one
  - Verify that typing a search query shows only students whose name or email contains the query (case-insensitive) and resets `currentPage` to 0.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 4.7 Test: clearing the filter restores the full list
  - Verify that clearing the search input removes the filter and the full student list is restored with the current sort order.
  - Test type: unit
  - _Implements: REQ-3.4_

- [x] 4.8 Test: all required student fields are displayed per card
  - Verify each card renders avatar (or placeholder), name, email, formatted registration date, and Pro badge.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4_

- [x] 4.9 Test: clicking a student navigates to the detail route
  - Verify that clicking a student card navigates to `/admin/lista-de-alunos/<student-id>`.
  - Test type: unit
  - _Implements: REQ-5.1_

- [x] 4.10 Test: detail page shows the placeholder
  - Verify that navigating to `/admin/lista-de-alunos/:id-aluno` renders the `AdminStudentDetail` placeholder.
  - Test type: unit
  - _Implements: REQ-5.2_

- [x] 4.11 Test: interactive elements are keyboard-navigable and have unique IDs
  - Verify that the filter input, sort selector, page-size selector, and pagination buttons all have unique `id` attributes and are reachable and operable by keyboard.
  - Test type: unit
  - _Implements: REQ-6.1, REQ-6.3_

- [x] 4.12 Test: text and UI elements meet WCAG AA contrast
  - Run an automated accessibility audit (e.g., using axe-core in the component spec or in the browser DevTools) on the student list page and verify no contrast violations.
  - Test type: integration
  - _Implements: REQ-6.2_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm the list shows only students, pagination works with configurable page sizes, navigation controls function, and the result counter is accurate.
  - REQ-2: Confirm default sort is by name ascending; "Data de Cadastro" sort triggers descending order.
  - REQ-3: Confirm the filter input narrows results case-insensitively, resets to page one on filter, and restores the full list on clear.
  - REQ-4: Confirm each student card displays avatar (with placeholder fallback), name, email, formatted date, and Pro badge.
  - REQ-5: Confirm clicking a card navigates to the detail route and the detail page shows a placeholder.
  - REQ-6: Confirm all interactive elements have unique IDs, meet WCAG AA contrast, and are keyboard-navigable.
  - Run unit tests (`npm test`) and resolve any failing tests or remaining traceability gaps.
  - _Implements: All requirements_
