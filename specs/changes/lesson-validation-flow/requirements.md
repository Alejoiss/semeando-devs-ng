# Requirements

## Overview

Professores precisam verificar manualmente, lição por lição, se o conteúdo está completo antes de disponibilizar um módulo aos alunos. Esse processo é lento e propenso a erros, especialmente em módulos com muitas lições. O objetivo desta feature é automatizar essa verificação com um mecanismo de validação por lição e um controle de disponibilidade por módulo.

O sistema deve permitir que o professor acione a validação de uma lição diretamente na listagem de lições do submódulo. As regras de validação variam conforme o tipo da lição (LESSON, CHALLENGE ou REVISION). O resultado da validação é armazenado no banco de dados e refletido visualmente na interface. Além disso, sempre que o professor editar conteúdo relacionado a uma lição, o campo de validação deve ser resetado para pendente.

Ao concluir o conteúdo de um módulo inteiro, o professor pode marcá-lo como "Disponível" na tela de Meus Módulos. Essa ação só será permitida se todas as lições do módulo (exceto as do tipo REVISION) estiverem validadas com sucesso.

## Glossary

| Term | Definition |
|------|------------|
| Lição (Lesson) | Unidade de conteúdo do tipo LESSON, que contém conteúdo de seção, materiais extras, questões avulsas e um quiz com perguntas. |
| Desafio (Challenge) | Unidade de conteúdo do tipo CHALLENGE, que contém conteúdo de seção, linguagem de programação e código inicial. |
| Revisão (Revision) | Unidade de conteúdo do tipo REVISION, que não requer validação. |
| Validação | Processo automatizado que verifica se uma lição possui todos os conteúdos obrigatórios conforme seu tipo. |
| `is_validated` | Campo booleano nullable na tabela `lessons`. `true` = validada com sucesso, `false` = validação falhou, `null` = nunca validada ou pendente de revalidação. |
| `in_revision` | Campo booleano na tabela `modules`. `true` = módulo em revisão (indisponível para alunos), `false` = módulo disponível. |
| Section Content | Bloco de conteúdo (texto, markdown, vídeo ou imagem) vinculado a uma lição. |
| Material Extra | Arquivo ou link complementar vinculado a uma lição. |
| Quiz | Conjunto de questões de múltipla escolha vinculado a uma lição do tipo LESSON. |

## Assumptions

- Lições do tipo REVISION nunca exigem validação e o botão de Validar não deve ser exibido para elas.
- A verificação de lições validadas para disponibilização do módulo considera todas as lições do módulo (em todos os submódulos), exceto as do tipo REVISION.
- Se um módulo não possui lições (ou somente lições do tipo REVISION), ele pode ser marcado como disponível sem restrições.
- O campo `is_validated` já existe ou será criado na tabela `lessons` do banco de dados Supabase.
- A validação é executada exclusivamente no lado do servidor (via Supabase queries), nunca no cliente.
- O perfil de administrador é identificado pelo campo `role === 'admin'` no modelo de usuário da aplicação.

## Requirements

### REQ-1: Botão de Validar na Listagem de Lições

**User Story:** As a professor, I want a "Validar" button next to each lesson in the submodule lesson list, so that I can trigger the validation of a specific lesson with a single click.

#### Acceptance Criteria

1.1 WHILE a lição exibida for do tipo LESSON ou CHALLENGE, THE sistema de listagem SHALL exibir um botão "Validar" ao lado dos botões de editar e excluir da lição.

1.2 WHILE a lição exibida for do tipo REVISION, THE sistema de listagem SHALL ocultar o botão "Validar" para essa lição.

1.3 WHILE o campo `is_validated` da lição for `true`, THE sistema de listagem SHALL ocultar o botão "Validar" e exibir um ícone de check verde ao lado do nome da lição.

1.4 WHILE o campo `is_validated` da lição for `false`, THE sistema de listagem SHALL exibir o botão "Validar" e exibir um ícone de aviso (warning) ao lado do nome da lição.

1.5 WHILE o campo `is_validated` da lição for `null`, THE sistema de listagem SHALL exibir o botão "Validar" e não exibir nenhum ícone de status ao lado do nome da lição.

---

### REQ-2: Regras de Validação para Lição do Tipo LESSON

**User Story:** As a professor, I want the system to verify that a LESSON type lesson has all required content, so that I know it is ready to be presented to students.

#### Acceptance Criteria

2.1 WHEN o professor acionar a validação de uma lição do tipo LESSON, THEN o sistema de validação SHALL verificar se existe ao menos um section content vinculado à lição.

2.2 WHEN o professor acionar a validação de uma lição do tipo LESSON, THEN o sistema de validação SHALL verificar se existe ao menos um material extra vinculado à lição.

2.3 WHEN o professor acionar a validação de uma lição do tipo LESSON, THEN o sistema de validação SHALL verificar se existe ao menos uma questão avulsa (question) vinculada à lição.

2.4 WHEN o professor acionar a validação de uma lição do tipo LESSON, THEN o sistema de validação SHALL verificar se existe exatamente um quiz vinculado à lição com exatamente 10 questões associadas.

2.5 WHEN o professor acionar a validação de uma lição do tipo LESSON, THEN o sistema de validação SHALL verificar se cada questão do quiz possui exatamente 4 respostas (answers) e exatamente uma delas está marcada como correta (`is_correct = true`).

2.6 WHEN todas as verificações da lição do tipo LESSON passarem, THEN o sistema de validação SHALL atualizar o campo `is_validated` da lição para `true`.

2.7 IF qualquer uma das verificações da lição do tipo LESSON falhar, THEN o sistema de validação SHALL atualizar o campo `is_validated` da lição para `false`.

---

### REQ-3: Regras de Validação para Lição do Tipo CHALLENGE

**User Story:** As a professor, I want the system to verify that a CHALLENGE type lesson has all required content, so that students can effectively complete the coding challenge.

#### Acceptance Criteria

3.1 WHEN o professor acionar a validação de uma lição do tipo CHALLENGE, THEN o sistema de validação SHALL verificar se existe ao menos um section content vinculado à lição.

3.2 WHEN o professor acionar a validação de uma lição do tipo CHALLENGE, THEN o sistema de validação SHALL verificar se os campos `language` e `initial_code` estão preenchidos na lição.

3.3 WHEN todas as verificações da lição do tipo CHALLENGE passarem, THEN o sistema de validação SHALL atualizar o campo `is_validated` da lição para `true`.

3.4 IF qualquer uma das verificações da lição do tipo CHALLENGE falhar, THEN o sistema de validação SHALL atualizar o campo `is_validated` da lição para `false`.

---

### REQ-4: Reset Automático do Campo `is_validated`

**User Story:** As a professor, I want the lesson validation status to be automatically reset whenever I save changes to the lesson content, so that the validation status always reflects the current state of the lesson.

#### Acceptance Criteria

4.1 WHEN o professor salvar conteúdo na aba de Conteúdo de uma lição, THEN o sistema de lições SHALL atualizar o campo `is_validated` da lição para `null`.

4.2 WHEN o professor salvar materiais extras na aba de Materiais Extras de uma lição, THEN o sistema de lições SHALL atualizar o campo `is_validated` da lição para `null`.

4.3 WHEN o professor salvar uma questão na aba de Questões de uma lição, THEN o sistema de lições SHALL atualizar o campo `is_validated` da lição para `null`.

4.4 WHEN o professor salvar código na aba de Código de uma lição, THEN o sistema de lições SHALL atualizar o campo `is_validated` da lição para `null`.

---

### REQ-5: Indicador Visual de Status de Validação na Listagem

**User Story:** As a professor, I want to see visual indicators of validation status next to each lesson in the list, so that I can quickly assess which lessons still need attention.

#### Acceptance Criteria

5.1 WHILE o campo `is_validated` da lição for `true`, THE sistema de listagem SHALL exibir um ícone de check com cor verde ao lado do nome da lição.

5.2 WHILE o campo `is_validated` da lição for `false`, THE sistema de listagem SHALL exibir um ícone de warning com cor de alerta ao lado do nome da lição.

5.3 WHILE o campo `is_validated` da lição for `null`, THE sistema de listagem SHALL não exibir nenhum ícone de status ao lado do nome da lição.

---

### REQ-6: Toggle de Disponibilidade do Módulo

**User Story:** As an admin, I want a "Disponível" toggle next to each module in the My Modules screen, so that I can control whether the module is visible to students.

#### Acceptance Criteria

6.1 WHILE o usuário autenticado possuir perfil de administrador, THE sistema de módulos SHALL exibir um toggle "Disponível" ao lado do botão de editar para cada módulo na tela de Meus Módulos.

6.2 WHILE o usuário autenticado não possuir perfil de administrador, THE sistema de módulos SHALL ocultar o toggle "Disponível" na tela de Meus Módulos.

6.3 WHILE o campo `in_revision` do módulo for `true`, THE sistema de módulos SHALL exibir o toggle "Disponível" no estado desligado (off).

6.4 WHILE o campo `in_revision` do módulo for `false`, THE sistema de módulos SHALL exibir o toggle "Disponível" no estado ligado (on).

---

### REQ-7: Validação de Lições ao Disponibilizar um Módulo

**User Story:** As an admin, I want the system to prevent me from making a module available if any of its lessons are not validated, so that students only access complete and reviewed content.

#### Acceptance Criteria

7.1 WHEN o professor tentar ativar o toggle "Disponível" de um módulo, THEN o sistema de módulos SHALL verificar se todas as lições (exceto as do tipo REVISION) de todos os submódulos do módulo possuem o campo `is_validated` igual a `true`.

7.2 IF alguma lição do módulo possuir o campo `is_validated` diferente de `true`, THEN o sistema de módulos SHALL bloquear a alteração do toggle e exibir um alerta informando ao professor que há lições não validadas.

7.3 WHEN todas as lições do módulo (exceto as do tipo REVISION) estiverem com `is_validated = true`, THEN o sistema de módulos SHALL atualizar o campo `in_revision` do módulo para `false` e refletir o estado ligado no toggle.

7.4 WHEN o professor desativar o toggle "Disponível" de um módulo, THEN o sistema de módulos SHALL atualizar o campo `in_revision` do módulo para `true` sem nenhuma verificação adicional.
