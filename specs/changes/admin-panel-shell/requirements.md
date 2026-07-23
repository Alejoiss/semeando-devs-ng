# Requirements

## Overview

O sistema Semeando Devs possui um perfil de usuário `admin` definido no modelo `User`. Atualmente, não existe uma área exclusiva para esse perfil: administradores precisam acessar funcionalidades via rota do professor ou de forma ad hoc. Esta feature cria a estrutura base do Painel Administrativo, composta por uma rota protegida, um layout shell com header e sidebar, e navegação entre quatro seções futuras — sem nenhuma implementação de conteúdo dessas seções nesta fase.

O escopo desta entrega é deliberadamente limitado à **casca** (shell) do painel administrativo: rota, guard, layout principal, header e sidebar com itens de navegação. Subcomponentes funcionais (Dashboard, Lista de Alunos, Cadastro de Cupons, Envio de Newsletter) são planejados para tarefas futuras e não fazem parte desta entrega.

Ao contrário do fluxo do professor, o administrador não precisa aceitar termos de uso para acessar o painel.

## Glossary

| Term | Definition |
|------|------------|
| Admin | Usuário com `role === 'admin'` no modelo `User` do sistema |
| Painel Administrativo | Área restrita de gestão acessível exclusivamente ao perfil Admin |
| Admin Shell | Layout raiz do Painel Administrativo, composto por header, sidebar e `<router-outlet>` |
| Admin Guard | Guard de rota que verifica se o usuário autenticado possui `role === 'admin'` |
| Sidebar | Menu lateral de navegação do Painel Administrativo |
| Placeholder Page | Componente mínimo que ocupa uma rota para futura implementação |

## Assumptions

- O campo `role` no modelo `User` já possui o valor `'admin'` como opção válida e é retornado pelo `UserService`.
- O `authGuard` existente verifica autenticação (sessão ativa) e já pode ser reutilizado como primeiro guard da rota admin.
- O `NavigationService` existente provê `isSidebarOpen()`, `toggleSidebar()` e `closeSidebar()`, sendo reutilizável pelo Painel Administrativo.
- O design do Painel Administrativo segue o mesmo sistema de design (cores, tipografia, Tailwind CSS) já utilizado no painel do professor.
- A URL base do Painel Administrativo será `/admin`, seguindo o padrão de URLs em português/amigável do projeto.

## Requirements

### REQ-1: Rota protegida para o Painel Administrativo

**User Story:** As an admin user, I want a dedicated route for the admin panel, so that I can access exclusive administrative features without accessing the teacher area.

#### Acceptance Criteria

1.1 WHEN um usuário autenticado com `role === 'admin'` navega para `/admin`, THEN the application SHALL exibir o Admin Shell com o layout completo (header, sidebar e área de conteúdo).

1.2 WHEN um usuário autenticado sem `role === 'admin'` tenta acessar qualquer sub-rota de `/admin`, THEN the admin guard SHALL redirecionar o usuário para `/app`.

1.3 WHEN um usuário não autenticado tenta acessar qualquer sub-rota de `/admin`, THEN the auth guard SHALL redirecionar o usuário para `/auth/login`.

1.4 THE application SHALL redirecionar automaticamente `/admin` para `/admin/dashboard` quando o caminho base for acessado sem sub-rota.

---

### REQ-2: Admin Guard exclusivo para o perfil admin

**User Story:** As an admin user, I want route protection that allows only admins to access the panel, so that administrative data and features remain secure.

#### Acceptance Criteria

2.1 WHEN o Admin Guard é ativado, THEN the admin guard SHALL verificar se o `role` do usuário autenticado é estritamente igual a `'admin'`.

2.2 IF o perfil do usuário não puder ser obtido, THEN the admin guard SHALL redirecionar o usuário para `/app`.

---

### REQ-3: Header do Painel Administrativo

**User Story:** As an admin user, I want a header bar at the top of the admin panel, so that I can identify the context and access my profile.

#### Acceptance Criteria

3.1 THE admin header SHALL exibir o logotipo da plataforma Semeando Devs com link de retorno para `/admin`.

3.2 WHILE o painel estiver em tela móvel (viewport menor que `md`), the admin header SHALL exibir um botão de hambúrguer que aciona o toggle da sidebar.

3.3 THE admin header SHALL exibir o avatar do usuário autenticado com link para `/app/perfil`.

---

### REQ-4: Sidebar de navegação do Painel Administrativo

**User Story:** As an admin user, I want a sidebar with navigation items, so that I can switch between the different sections of the admin panel.

#### Acceptance Criteria

4.1 THE admin sidebar SHALL exibir quatro itens de navegação: "Dashboard", "Lista de alunos", "Cadastro de cupons" e "Envio de newsletter".

4.2 WHEN um item de navegação está ativo (rota correspondente ativada), THEN the admin sidebar SHALL aplicar destaque visual no item ativo, diferenciando-o dos itens inativos.

4.3 WHEN o usuário clica em um item de navegação na sidebar em tela móvel, THEN the admin sidebar SHALL fechar automaticamente após a navegação.

4.4 WHILE a viewport for menor que `md`, the admin sidebar SHALL ser ocultada por padrão, deslizando para fora da tela.

4.5 WHILE a viewport for maior ou igual a `md`, the admin sidebar SHALL ser exibida de forma fixa (sem sobreposição).

4.6 THE admin sidebar SHALL exibir uma opção de logout na parte inferior, que, quando acionada, encerra a sessão e redireciona o usuário para a página inicial.

---

### REQ-5: Overlay móvel da sidebar

**User Story:** As an admin user, I want a darkened overlay behind the sidebar on mobile, so that I can close the sidebar by tapping outside of it.

#### Acceptance Criteria

5.1 WHILE a viewport for menor que `md` e a sidebar estiver aberta, the application SHALL exibir um overlay semitransparente cobrindo o conteúdo principal.

5.2 WHEN o usuário clica no overlay, THEN the application SHALL fechar a sidebar.

---

### REQ-6: Placeholder pages para sub-rotas do painel

**User Story:** As an admin user, I want navigable sub-routes within the admin panel, so that future features can be progressively delivered without breaking navigation.

#### Acceptance Criteria

6.1 THE application SHALL registrar quatro sub-rotas sob `/admin`: `dashboard`, `lista-de-alunos`, `cadastro-de-cupons` e `envio-de-newsletter`.

6.2 WHEN o usuário navega para qualquer uma das quatro sub-rotas, THEN the application SHALL exibir um componente placeholder indicando que a funcionalidade está em construção.

6.3 THE application SHALL atribuir um `title` descritivo a cada sub-rota, seguindo o padrão `<Nome da Seção> - Semeando Devs`.

---

### REQ-7: Ausência de modal de termos de uso no Painel Administrativo

**User Story:** As an admin user, I want to access the admin panel immediately after login, so that I am not blocked by terms-of-use modals that are not applicable to my role.

#### Acceptance Criteria

7.1 THE admin shell SHALL NOT exibir nenhum modal ou bloqueio relacionado a termos de uso ao ser renderizado.
