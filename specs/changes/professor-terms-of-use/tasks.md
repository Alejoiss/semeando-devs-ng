# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** — Database migration, TypeScript model updates, and service method
2. **Shell Integration** — Computed signal and conditional rendering in `ProfessorApp`
3. **Modal Component** — New `ProfessorTermsModal` standalone component with full terms content
4. **Acceptance Criteria Testing** — Verify all requirement behaviors with unit and component tests
5. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Medium (2-3 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Create migration SQL for teacher terms columns
  - Adicionar os campos `teacher_terms_accepted` (boolean, default false) e `teacher_terms_accepted_at` (timestamptz, nullable) à tabela `profiles` via arquivo de migration SQL em `supabase/migrations/`.
  - _Implements: DES-1, REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 1.2 Update Profile TypeScript interface
  - Adicionar `teacher_terms_accepted?: boolean` e `teacher_terms_accepted_at?: string | null` à interface `Profile` em `src/models/profile/profile.ts`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.4_

- [x] 1.3 Update User TypeScript interface
  - Adicionar `teacherTermsAccepted?: boolean` e `teacherTermsAcceptedAt?: Date | null` à interface `User` em `src/models/user/user.ts`.
  - _Depends: 1.2_
  - _Implements: DES-1, REQ-1.4_

- [x] 1.4 Update getUserProfile to include new fields
  - Ampliar o `SELECT` em `UserService.getUserProfile()` para incluir `teacher_terms_accepted` e `teacher_terms_accepted_at`, e mapear os valores para os campos correspondentes no objeto `User` retornado.
  - _Depends: 1.3_
  - _Implements: DES-1, DES-2_

- [x] 1.5 Add acceptTeacherTerms method to UserService
  - Implementar o método público `acceptTeacherTerms()` no `UserService`. O método deve executar um `UPDATE` em `profiles` definindo `teacher_terms_accepted = true` e `teacher_terms_accepted_at = NOW()` para o usuário autenticado, e em seguida atualizar o `userSignal` em memória para refletir o novo estado sem recarregar o perfil completo.
  - _Depends: 1.4_
  - _Implements: DES-2, REQ-4.2, REQ-4.6, REQ-5.1_

---

## Phase 2: Shell Integration

- [x] 2.1 Add showTermsModal computed signal to ProfessorApp
  - No componente `ProfessorApp`, injetar o `UserService` (se ainda não injetado) e criar um signal `computed()` chamado `showTermsModal` que retorna `true` quando `currentUser()?.teacherTermsAccepted` for `false` ou `null/undefined`.
  - _Depends: 1.5_
  - _Implements: DES-3, REQ-2.1, REQ-2.4_

- [x] 2.2 Render ProfessorTermsModal conditionally in ProfessorApp template
  - No template `professor-app.html`, adicionar `@if (showTermsModal())` envolvendo a renderização do componente `<app-professor-terms>`. O componente deve ser posicionado como overlay (fixed, z-alto) sobre o conteúdo existente, com o conteúdo da área do professor mantido ao fundo porém bloqueado. Importar `ProfessorTermsModal` no array `imports` do componente.
  - _Depends: 2.1_
  - _Implements: DES-3, REQ-2.2, REQ-2.3_

---

## Phase 3: Modal Component

- [x] 3.1 Generate ProfessorTermsModal component scaffold
  - Executar `ng g c pages/professor/components/professor-terms` para criar os arquivos base do componente standalone (`professor-terms.ts`, `professor-terms.html`, `professor-terms.scss`).
  - _Implements: DES-4_

- [x] 3.2 Implement ProfessorTermsModal logic
  - No arquivo `professor-terms.ts`, injetar `UserService`, declarar o signal `isAccepting = signal(false)` e o signal `errorMessage = signal<string | null>(null)`. Implementar o método `onAccept()` que: (1) define `isAccepting = true`, (2) chama `userService.acceptTeacherTerms()`, e em caso de erro define `errorMessage` com a mensagem e reverte `isAccepting = false`. Implementar `scrollToSection(id)` para navegação suave entre seções.
  - _Depends: 3.1_
  - _Implements: DES-4, REQ-4.4, REQ-4.5, REQ-4.6_

- [x] 3.3 Build ProfessorTermsModal template with terms content
  - Implementar `professor-terms.html` com: overlay fixo com `backdrop-blur` e `bg-black/60`; painel glassmorphic com `overflow-y-auto` e altura máxima limitada; cabeçalho com título e data de versão; índice de navegação rápida com links para as 13 seções; o texto completo das 13 seções dos termos do professor formatado seguindo o mesmo padrão visual de `terms-of-use.html` (badges numeradas, `font-headline`, `font-body`, `font-label`, `text-primary`, `bg-surface-container-low`, etc.); rodapé com botão de aceite que exibe spinner quando `isAccepting()` é true e exibe mensagem de erro quando `errorMessage()` é não-nulo.
  - _Depends: 3.2_
  - _Implements: DES-4, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-4.1, REQ-4.3_

- [x] 3.4 Apply glassmorphic styles to ProfessorTermsModal
  - Implementar `professor-terms.scss` com os mesmos estilos do `terms-of-use.scss`: `.glass-panel`, `.neon-glow-primary`, `[id] { scroll-margin-top: 128px; }` e `.visible-btn`.
  - _Depends: 3.3_
  - _Implements: DES-4, REQ-3.4_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: migration adds correct columns to profiles
  - Verificar que a migration cria os campos `teacher_terms_accepted` e `teacher_terms_accepted_at` com os tipos e defaults corretos.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 4.2 Test: Profile and User interfaces include new fields
  - Verificar que as interfaces `Profile` e `User` possuem os novos campos.
  - Test type: unit
  - _Implements: REQ-1.4_

- [x] 4.3 Test: acceptTeacherTerms updates database and userSignal
  - Verificar que o método executa UPDATE correto e atualiza o `userSignal` em memória.
  - Test type: unit
  - _Depends: 1.5_
  - _Implements: REQ-4.2, REQ-4.6, REQ-5.1_

- [x] 4.4 Test: showTermsModal computed signal reflects teacherTermsAccepted state
  - Verificar que `showTermsModal` retorna `true` quando `teacherTermsAccepted` é `false` ou `null`, e `false` quando é `true`.
  - Test type: unit
  - _Depends: 2.1_
  - _Implements: REQ-2.1, REQ-2.4_

- [x] 4.5 Test: modal is displayed and blocks interaction when terms not accepted
  - Verificar que o `ProfessorTermsModal` é renderizado sobreposto quando `showTermsModal()` é `true`.
  - Test type: unit
  - _Depends: 2.2_
  - _Implements: REQ-2.2, REQ-2.3_

- [x] 4.6 Test: modal displays all 13 sections and quick-navigation index
  - Verificar que o template renderiza o índice de navegação e as 13 seções dos termos.
  - Test type: unit
  - _Depends: 3.3_
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 4.7 Test: clicking index item scrolls to corresponding section
  - Verificar que `scrollToSection()` é chamado com o ID correto ao clicar num item do índice.
  - Test type: unit
  - _Depends: 3.2_
  - _Implements: REQ-3.3_

- [x] 4.8 Test: accept button is disabled during persistence and shows error on failure
  - Verificar que o botão fica desabilitado durante `isAccepting`, exibe erro em caso de falha, e a modal fecha após aceite bem-sucedido.
  - Test type: unit
  - _Depends: 3.2_
  - _Implements: REQ-4.1, REQ-4.3, REQ-4.4, REQ-4.5_

- [x] 4.9 Test: userSignal update prevents modal re-display in active session
  - Verificar que após o aceite o `userSignal` atualizado faz `showTermsModal()` retornar `false`.
  - Test type: unit
  - _Depends: 1.5, 2.1_
  - _Implements: REQ-5.2_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirmar migration, modelos TypeScript atualizados.
  - REQ-2: Confirmar exibição da modal e bloqueio de interação.
  - REQ-3: Confirmar 13 seções completas com índice funcional e visual idêntico ao `TermsOfUse`.
  - REQ-4: Confirmar persistência via `UserService`, desabilitação durante salvamento e tratamento de erros.
  - REQ-5: Confirmar atualização imediata do `userSignal` e não re-exibição da modal na sessão.
  - Executar `npm test` e resolver quaisquer falhas remanescentes.
  - _Implements: All requirements_
