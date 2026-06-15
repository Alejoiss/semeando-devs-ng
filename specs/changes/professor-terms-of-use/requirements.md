# Requirements

## Overview

Professores que acessam a área restrita (`/professor`) da plataforma Semeando Devs precisam concordar com termos de uso específicos antes de utilizar qualquer funcionalidade. Atualmente, esses termos não existem, e nenhuma verificação é realizada no momento do acesso.

O objetivo desta funcionalidade é persistir o aceite dos termos do professor (data e flag booleana) na tabela `profiles` do banco de dados e, em cada acesso à rota `/professor`, verificar se o aceite já ocorreu. Caso o professor ainda não tenha aceitado, o sistema exibirá uma modal com os termos completos, bloqueando o uso da área até que o aceite seja confirmado.

O componente de termos deve reutilizar o mesmo sistema visual já adotado nos termos de usuário existentes, garantindo consistência estética no design system da plataforma.

## Glossary

| Term | Definition |
|------|------------|
| Professor Parceiro | Usuário da plataforma com `role = 'teacher'` ou `role = 'admin'`, habilitado a publicar cursos. |
| Termos do Professor | Documento legal que define as condições de disponibilização de cursos na plataforma Semeando Devs. |
| Aceite dos Termos | Ação do professor de confirmar, de forma explícita, que leu e concorda com os termos do professor. |
| Modal de Termos | Elemento de interface que exibe os termos do professor de forma sobreposta ao conteúdo da área restrita, impedindo o uso até o aceite. |
| `teacher_terms_accepted` | Campo booleano na tabela `profiles` que indica se o professor aceitou os termos do professor. |
| `teacher_terms_accepted_at` | Campo timestamp na tabela `profiles` que registra a data e hora do aceite dos termos do professor. |

## Assumptions

- O banco de dados Supabase já possui a tabela `profiles` com campos `terms_accepted` e `terms_accepted_at` para usuários alunos; os novos campos `teacher_terms_accepted` e `teacher_terms_accepted_at` seguirão o mesmo padrão.
- A verificação do aceite dos termos do professor ocorre no momento em que o componente de shell da área do professor (`ProfessorApp`) é inicializado.
- O professor só consegue fechar a modal de termos ao clicar no botão de aceite; não é possível dispensá-la de outra forma.
- Administradores com `role = 'admin'` também são tratados como professores e estão sujeitos à mesma verificação de aceite.
- O texto completo dos termos é estático e embutido no componente; não é carregado de uma API externa.
- A action de aceite dos termos persiste os dados no Supabase por meio do `UserService` (ou serviço equivalente), nunca diretamente no componente.

## Requirements

### REQ-1: Campos de Aceite dos Termos do Professor no Banco de Dados

**User Story:** As a developer, I want two new columns in the `profiles` table to record teacher terms acceptance, so that the system can persistently track whether a teacher has agreed to the terms.

#### Acceptance Criteria

1.1 THE sistema SHALL adicionar à tabela `profiles` o campo `teacher_terms_accepted` do tipo booleano, com valor padrão `false`.

1.2 THE sistema SHALL adicionar à tabela `profiles` o campo `teacher_terms_accepted_at` do tipo `timestamptz`, sem valor padrão (nullable).

1.3 WHEN uma migration for aplicada ao banco de dados, THEN o sistema SHALL criar um arquivo de migration SQL na pasta `supabase/migrations` para os novos campos.

1.4 THE interface `Profile` no modelo TypeScript SHALL incluir os campos `teacher_terms_accepted` e `teacher_terms_accepted_at` com os tipos correspondentes.

---

### REQ-2: Verificação de Aceite ao Acessar a Área do Professor

**User Story:** As a professor, I want the platform to check if I have accepted the teacher terms every time I access the professor area, so that I am always aware of my obligations before using the features.

#### Acceptance Criteria

2.1 WHEN o componente de shell da área do professor for inicializado, THEN o sistema SHALL verificar no perfil do usuário autenticado se `teacher_terms_accepted` é `true`.

2.2 WHILE `teacher_terms_accepted` for `false` ou `null`, o sistema SHALL exibir a modal dos termos do professor de forma sobreposta ao conteúdo da área restrita.

2.3 WHILE a modal dos termos do professor estiver visível, o sistema SHALL impedir que o professor interaja com o conteúdo da área restrita ao fundo.

2.4 IF o professor já tiver aceito os termos (`teacher_terms_accepted = true`), THEN o sistema SHALL carregar a área do professor normalmente, sem exibir a modal.

---

### REQ-3: Conteúdo e Estrutura dos Termos do Professor

**User Story:** As a professor, I want to read the full terms of use for course publication before accepting, so that I can make an informed decision.

#### Acceptance Criteria

3.1 THE componente de termos do professor SHALL exibir o texto completo dos Termos para Disponibilização de Cursos na Plataforma Semeando Devs, organizado em 13 seções numeradas.

3.2 THE componente de termos do professor SHALL incluir um índice de navegação rápida que liste todas as seções do documento.

3.3 WHEN o professor clicar em um item do índice, THEN o sistema SHALL rolar a visualização para a seção correspondente do documento.

3.4 THE componente de termos do professor SHALL seguir o mesmo sistema visual dos termos de usuário existentes, utilizando os mesmos padrões de tipografia, paleta de cores, espaçamentos e classes do design system da plataforma.

---

### REQ-4: Ação de Aceite dos Termos do Professor

**User Story:** As a professor, I want to explicitly accept the teacher terms with a single action, so that I can immediately access the platform's features after agreeing.

#### Acceptance Criteria

4.1 THE modal dos termos do professor SHALL exibir um botão de aceite claramente identificado.

4.2 WHEN o professor clicar no botão de aceite, THEN o sistema SHALL registrar `teacher_terms_accepted = true` e `teacher_terms_accepted_at` com o timestamp atual no perfil do professor na tabela `profiles`.

4.3 WHEN o aceite for registrado com sucesso, THEN o sistema SHALL fechar a modal e exibir a área do professor normalmente.

4.4 WHILE o aceite estiver sendo persistido no banco de dados, o sistema SHALL desabilitar o botão de aceite para evitar submissões duplicadas.

4.5 IF ocorrer um erro ao persistir o aceite, THEN o sistema SHALL exibir uma mensagem de erro ao professor e reabilitar o botão de aceite.

4.6 THE persistência do aceite dos termos do professor SHALL ser realizada por meio de um método no serviço de usuário (`UserService`), nunca diretamente no componente.

---

### REQ-5: Sincronização do Estado do Usuário após Aceite

**User Story:** As a professor, I want my user profile to be updated immediately after I accept the terms, so that subsequent navigations within the professor area do not show the terms modal again.

#### Acceptance Criteria

5.1 WHEN o aceite dos termos for registrado com sucesso, THEN o sistema SHALL atualizar o estado do usuário em memória (`userSignal`) para refletir `teacher_terms_accepted = true`.

5.2 WHILE o usuário permanecer na sessão ativa após o aceite, o sistema SHALL não exibir novamente a modal dos termos do professor em nenhuma navegação subsequente dentro da área do professor.
