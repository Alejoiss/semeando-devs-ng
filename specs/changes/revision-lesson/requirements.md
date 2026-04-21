# Requirements

## Overview

O sistema de aprendizado possui lições de três tipos: `LESSON`, `CHALLENGE` e `REVISION`. As lições do tipo `REVISION` têm um comportamento distinto das demais: ao invés de exibir conteúdo novo, elas apresentam ao usuário 10 questões aleatórias extraídas de quizzes de lições **anteriores** (com `order` menor que o da revisão) dentro do mesmo submódulo.

O fluxo atual exige que o usuário clique em "Iniciar" no `submodule-detail`, seja direcionado para a rota `/lesson/:lessonId` e, de lá, navegue para o quiz. Para lições do tipo `REVISION`, essa rota intermediária é desnecessária. O usuário deve ir diretamente para a rota do quiz, recebendo questões de revisão agregadas de múltiplos quizzes anteriores.

No componente do quiz, a lógica de carregamento precisa ser capaz de diferenciar uma sessão de revisão de um quiz normal, buscando e embaralhando questões de múltiplos quizzes já respondidos, limitando a 10 questões.

## Glossary

| Term | Definition |
|------|------------|
| Lição de Revisão | Lição com `type === 'REVISION'` que serve como ponto de revisão de conteúdo já estudado. |
| Quiz de Revisão | Sessão de quiz gerada dinamicamente para uma lição de revisão, composta por questões aleatórias de quizzes de lições anteriores do mesmo submódulo. |
| Lições Anteriores | Lições do mesmo submódulo cujo `order` é menor que o `order` da lição de revisão atual. |
| Submódulo Atual | O submódulo identificado pelo parâmetro de rota `slugSubmodule` da URL ativa. |

## Assumptions

- Um quiz está associado a uma lição através do campo `lesson_id` na tabela `quizzes`.
- Cada lição possui um campo `order` que define sua posição sequencial no submódulo.
- O banco de dados possui dados suficientes de questões respondidas (`user_questions`) para compor a revisão.
- A lição de revisão em si não possui um quiz próprio associado na tabela `quizzes`; suas questões são coletadas de outros quizzes.
- O progresso da revisão é salvo da mesma forma que um quiz normal, usando a mesma Edge Function `complete-quiz`.
- Caso existam menos de 10 questões disponíveis de lições anteriores, o sistema exibe todas as disponíveis.

## Requirements

### REQ-1: Redirecionamento Direto para Quiz em Lições de Revisão

**User Story:** As a usuário, I want que ao iniciar uma lição de revisão eu seja levado diretamente para a tela do quiz, so that eu não passe por uma tela de conteúdo de lição que não existe para esse tipo.

#### Acceptance Criteria

1.1 WHEN o usuário clica em "Iniciar" em uma lição com `type === 'REVISION'` na tela `submodule-detail`, THEN the application SHALL navegar diretamente para a rota `s/:slug/ss/:slugSubmodule/lesson/:lessonId/quiz`, sem passar pela rota `s/:slug/ss/:slugSubmodule/lesson/:lessonId`.

1.2 WHEN o usuário clica em "Rever Aula" ou "Continuar" em uma lição com `type === 'REVISION'` na tela `submodule-detail`, THEN the application SHALL navegar diretamente para a rota `s/:slug/ss/:slugSubmodule/lesson/:lessonId/quiz`.

1.3 WHILE a lição possui `type !== 'REVISION'`, WHEN o usuário clica em qualquer botão de ação de lição, THEN the application SHALL manter o comportamento de navegação existente.

### REQ-2: Carregamento de Questões de Revisão no Quiz

**User Story:** As a usuário, I want ver 10 questões aleatórias dos quizzes que já respondi em lições anteriores do mesmo submódulo, so that eu possa revisitar e fixar o conteúdo já estudado.

#### Acceptance Criteria

2.1 WHEN a rota `quiz` é carregada para uma lição de `type === 'REVISION'`, THEN the quiz component SHALL buscar todos os quizzes associados a lições do mesmo submódulo cujo `order` seja menor que o `order` da lição de revisão atual.

2.2 WHEN os quizzes de revisão são identificados, THEN the quiz component SHALL buscar as questões de todos esses quizzes e selecionar aleatoriamente até 10 questões para compor a sessão de revisão.

2.3 WHEN a rota `quiz` é carregada para uma lição de `type !== 'REVISION'`, THEN the quiz component SHALL manter o comportamento atual de buscar o quiz diretamente associado à lição pelo `lesson_id`.

2.4 IF nenhuma questão de lições anteriores for encontrada para uma lição de revisão, THEN the quiz component SHALL exibir uma mensagem informando que não há questões disponíveis para revisão.

### REQ-3: Persistência de Progresso da Revisão

**User Story:** As a usuário, I want que meu progresso ao concluir uma revisão seja salvo, so that o sistema reconheça que completei a lição de revisão e libere o próximo conteúdo.

#### Acceptance Criteria

3.1 WHEN o usuário conclui todas as questões de um quiz de revisão, THEN the quiz component SHALL salvar o progresso da tentativa utilizando a mesma Edge Function `complete-quiz` usada pelos quizzes normais.

3.2 WHEN o progresso é salvo após uma revisão, THEN the quiz component SHALL passar o `lessonId` da lição de revisão para a Edge Function `complete-quiz`.

3.3 WHEN a sessão de revisão é concluída, THEN the quiz component SHALL exibir a tela de resultado com as mesmas informações (pontuação, tempo, questões corretas/erradas) exibidas em um quiz normal.
