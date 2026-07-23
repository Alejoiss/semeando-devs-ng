# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** — Guard de rota e registro no router
2. **Layout Shell** — Componente raiz AdminApp com header e overlay mobile
3. **Sidebar e Placeholder Pages** — AsideAdmin e quatro páginas placeholder
4. **Acceptance Criteria Testing** — Verificação de comportamento por requisito
5. **Final Checkpoint** — Validação de completude e rastreabilidade

**Estimated Effort**: Small (1-2 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Create admin guard
  - Criar `src/app/components/guards/admin.guard.ts` como `CanActivateFn` que injeta `UserService` e `Router`, chama `getUserProfile()` e retorna `true` se `role === 'admin'`, ou navega para `/app` e retorna `false` em qualquer outro caso (incluindo erros).
  - Criar `src/app/components/guards/admin.guard.spec.ts` com testes unitários cobrindo os dois caminhos.
  - _Implements: DES-2, REQ-2.1, REQ-2.2_

- [x] 1.2 Register `/admin` route with guards and sub-routes
  - Em `src/app/app.routes.ts`, adicionar o bloco de rota `/admin` com `canActivate: [authGuard, adminGuard]`, `loadComponent` para `AdminApp`, redirect para `dashboard`, e as quatro sub-rotas (`dashboard`, `lista-de-alunos`, `cadastro-de-cupons`, `envio-de-newsletter`) com `loadComponent` para os respectivos placeholders e `title` descritivos.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.4, REQ-6.1, REQ-6.3_

---

## Phase 2: Layout Shell

- [x] 2.1 Create AdminApp shell component
  - Gerar o componente `src/app/pages/admin/admin-app/admin-app.ts` via `ng g c` e implementar o shell: importar `RouterModule`, `HeaderAdmin`, `AsideAdmin`; injetar `NavigationService`; sem nenhuma lógica de termos de uso.
  - Implementar `admin-app.html` com a estrutura: `<app-header-admin>`, overlay mobile condicional (`@if`) com `(click)` para `closeSidebar()`, `<app-aside-admin>` e `<main>` com `<router-outlet>`.
  - _Depends: 1.2_
  - _Implements: DES-3, REQ-1.1, REQ-5.1, REQ-5.2, REQ-7.1_

- [x] 2.2 Create HeaderAdmin component
  - Gerar `src/app/pages/admin/components/header-admin/header-admin.ts` via `ng g c`, injetando `UserService` e `NavigationService`.
  - Implementar `header-admin.html` com: logo com `routerLink="/admin"`, botão hambúrguer (`md:hidden`) que chama `navigationService.toggleSidebar()`, e avatar com `routerLink="/app/perfil"`.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-3.1, REQ-3.2, REQ-3.3_

---

## Phase 3: Sidebar e Placeholder Pages

- [x] 3.1 Create AsideAdmin component
  - Gerar `src/app/pages/admin/components/aside-admin/aside-admin.ts` via `ng g c`, injetando `UserService`, `NavigationService` e `Router`.
  - Implementar `aside-admin.html` com os quatro itens de navegação usando `routerLink` e `routerLinkActive` para destaque visual, `(click)` para `closeSidebar()`, comportamento responsivo (oculta em mobile, fixa em `md`), e opção de logout na base.
  - Implementar o método `logout()` que chama `userService.signOut()` e navega para `/`.
  - _Depends: 2.1_
  - _Implements: DES-5, REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6_

- [x] 3.2 Create placeholder pages for all four admin sub-routes
  - Criar quatro componentes standalone mínimos:
    - `src/app/pages/admin/admin-app/dashboard/dashboard.ts`
    - `src/app/pages/admin/admin-app/students/students.ts`
    - `src/app/pages/admin/admin-app/coupons/coupons.ts`
    - `src/app/pages/admin/admin-app/newsletter/newsletter.ts`
  - Cada componente deve exibir o nome da seção e uma mensagem visual de "em construção". Usar inline template.
  - _Depends: 1.2_
  - _Implements: DES-6, REQ-6.2_

- [x] 4.1 Test: redirect unauthenticated users to login
  - Verificar que ao acessar `/admin` sem sessão, `authGuard` redireciona para `/auth/login`.
  - Test type: unit
  - _Implements: REQ-1.3_

- [x] 4.2 Test: redirect authenticated non-admin users to app
  - Verificar que `adminGuard` redireciona para `/app` quando `role !== 'admin'` (ex: `'student'`, `'teacher'`).
  - Test type: unit
  - _Implements: REQ-1.2, REQ-2.1_

- [x] 4.3 Test: allow admin users to reach the shell
  - Verificar que `adminGuard` retorna `true` quando `role === 'admin'`, permitindo acesso ao Admin Shell.
  - Test type: unit
  - _Implements: REQ-1.1, REQ-2.1_

- [x] 4.4 Test: redirect to dashboard on base route
  - Verificar que navegar para `/admin` redireciona para `/admin/dashboard`.
  - Test type: unit
  - _Implements: REQ-1.4_

- [x] 4.5 Test: guard redirects to app on profile fetch failure
  - Verificar que `adminGuard` navega para `/app` e retorna `false` quando `getUserProfile()` lança erro.
  - Test type: unit
  - _Implements: REQ-2.2_

- [x] 4.6 Test: header displays logo, hamburger and avatar
  - Verificar que `HeaderAdmin` renderiza o logo com link para `/admin`, o botão hambúrguer (visível em mobile) e o avatar com link para `/app/perfil`.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 4.7 Test: sidebar displays four navigation items with active state
  - Verificar que `AsideAdmin` renderiza os quatro itens de navegação e aplica destaque visual no item ativo via `routerLinkActive`.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2_

- [x] 4.8 Test: sidebar closes on item click (mobile) and logout works
  - Verificar que clicar em um item de navegação chama `closeSidebar()` e que o logout chama `signOut()` e navega para `/`.
  - Test type: unit
  - _Implements: REQ-4.3, REQ-4.6_

- [x] 4.9 Test: sidebar hidden by default on mobile, fixed on desktop
  - Verificar que as classes Tailwind corretas são aplicadas para ocultar a sidebar em mobile e exibi-la fixa em `md`.
  - Test type: unit
  - _Implements: REQ-4.4, REQ-4.5_

- [x] 4.10 Test: overlay appears when sidebar is open on mobile and closes on click
  - Verificar que o overlay semitransparente é exibido quando `isSidebarOpen()` retorna `true` e que clicar nele chama `closeSidebar()`.
  - Test type: unit
  - _Implements: REQ-5.1, REQ-5.2_

- [x] 4.11 Test: all four sub-routes render a placeholder
  - Verificar que cada uma das quatro sub-rotas (`dashboard`, `lista-de-alunos`, `cadastro-de-cupons`, `envio-de-newsletter`) renderiza o componente placeholder correspondente.
  - Test type: unit
  - _Implements: REQ-6.1, REQ-6.2_

- [x] 4.12 Test: sub-routes have correct titles
  - Verificar que cada sub-rota possui `title` descritivo no formato `<Nome> - Semeando Devs`.
  - Test type: unit
  - _Implements: REQ-6.3_

- [x] 4.13 Test: admin shell renders without terms modal
  - Verificar que `AdminApp` não renderiza nenhum componente ou elemento de modal de termos de uso.
  - Test type: unit
  - _Implements: REQ-7.1_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria and build
  - REQ-1: Confirmar que a rota `/admin` está protegida por `authGuard` + `adminGuard` e redireciona para `dashboard`.
  - REQ-2: Confirmar que `adminGuard` verifica estritamente `role === 'admin'` e trata falhas.
  - REQ-3: Confirmar que o header exibe logo, hambúrguer e avatar corretamente.
  - REQ-4: Confirmar que a sidebar tem 4 itens, destaque ativo, comportamento mobile/desktop e logout.
  - REQ-5: Confirmar overlay mobile funcional.
  - REQ-6: Confirmar 4 sub-rotas com placeholder e títulos corretos.
  - REQ-7: Confirmar ausência de modal de termos no Admin Shell.
  - Build `npm run build` verificado com zero erros de compilação.
  - _Implements: All requirements_
