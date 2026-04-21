# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** - Adicionar métodos base em serviços existentes
2. **Roteamento de Revisão** - Ajustar navegação no SubmoduleDetail para lições REVISION
3. **Lógica de Quiz de Revisão** - Adaptar o componente Quiz para modo revisão
4. **Acceptance Criteria Testing** - Verificar comportamentos por requisito
5. **Final Checkpoint** - Validar completude e rastreabilidade

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Add `getLessonById` to LessonService
  - Adicionar método `getLessonById(lessonId: string): Promise<Lesson | null>` no `LessonService`, buscando a lição pelo `id` na tabela `lessons` e retornando `null` caso não encontrada.
  - _Implements: DES-2_

- [x] 1.2 Add `getRevisionQuestions` to QuizService
  - Adicionar método `getRevisionQuestions(lessonId: string, subModuleId: string): Promise<Question[]>` no `QuizService`. O método deve: (1) buscar o `order` da lição atual via `getLessonById`; (2) buscar todos os quizzes do `subModuleId` com `lesson.order < currentOrder` via join `quizzes → lessons`; (3) para cada quiz, buscar questões via `QuestionService.getQuestionsByQuizId`; (4) embaralhar e retornar no máximo 10 questões.
  - _Depends: 1.1_
  - _Implements: DES-3, REQ-2.1, REQ-2.2_

## Phase 2: Roteamento de Revisão

- [x] 2.1 Update `onStartLesson` in SubmoduleDetail to accept lesson type
  - Modificar a assinatura de `onStartLesson(lessonId: string)` para `onStartLesson(lesson: Lesson)`. Quando `lesson.type === LessonType.REVISION`, navegar para `['lesson', lesson.id, 'quiz']` sem chamar `userLessonService.startLesson`. Para demais tipos, manter o comportamento existente (chamar `startLesson` e navegar para `['lesson', lesson.id]`).
  - _Implements: DES-1, REQ-1.1, REQ-1.3_

- [x] 2.2 Update submodule-detail template navigation for REVISION lessons
  - No template `submodule-detail.html`, atualizar a chamada do botão "Iniciar" para `onStartLesson(item.lesson)`. Para o link de "Continuar" e "Rever Aula" (lições não-`notStarted`), usar `[routerLink]` condicional: se `isRevision`, apontar para `['lesson', item.lesson.id, 'quiz']`; caso contrário, manter `['lesson', item.lesson.id]`.
  - _Depends: 2.1_
  - _Implements: DES-1, REQ-1.2, REQ-1.3_

## Phase 3: Lógica de Quiz de Revisão

- [x] 3.1 Add `isRevisionMode` signal and inject LessonService in Quiz component
  - Injetar `LessonService` no componente `Quiz`. Adicionar sinal `isRevisionMode = signal<boolean>(false)` e um sinal `noQuestionsAvailable = signal<boolean>(false)` para controlar o estado vazio.
  - _Implements: DES-2, DES-4_

- [x] 3.2 Bifurcate `ngOnInit` in Quiz to detect and load revision questions
  - Em `ngOnInit`, chamar `LessonService.getLessonById(lessonId)` para obter tipo e `subModuleId` da lição. Se `lesson.type === REVISION`: setar `isRevisionMode(true)`, chamar `QuizService.getRevisionQuestions(lessonId, lesson.subModuleId)`, setar `questions` com o resultado. Se vazio, setar `noQuestionsAvailable(true)` e retornar. Se `lesson.type !== REVISION`, manter o fluxo atual de `getQuizByLessonId`.
  - _Depends: 3.1, 1.2_
  - _Implements: DES-2, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [x] 3.3 Adapt `finishQuiz` for revision mode (skip attempt creation)
  - Em `finishQuiz`, verificar `isRevisionMode()`. No modo revisão, `currentAttempt` é `null` (tentativa não criada previamente). Chamar `quizService.completeQuiz(null, lessonId, ...)` passando `null` como `attemptId`. Garantir que o bloco `if (currentAttempt && lessonId)` seja `if (lessonId)` no modo revisão, para não bloquear a chamada à Edge Function.
  - _Depends: 3.2_
  - _Implements: DES-4, REQ-3.1, REQ-3.2_

- [x] 3.4 Add empty-state UI for revision with no available questions
  - No template `quiz.html`, adicionar bloco `@if (noQuestionsAvailable())` exibindo mensagem de que não há questões disponíveis para revisão e um link para voltar ao submódulo.
  - _Depends: 3.1_
  - _Implements: DES-2, REQ-2.4_

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: iniciar lição REVISION navega direto para /quiz
  - Verificar que ao chamar `onStartLesson` com uma lição de `type === REVISION`, o `Router.navigate` é chamado com `['lesson', lessonId, 'quiz']` e `userLessonService.startLesson` não é chamado.
  - Test type: unit
  - _Depends: 2.1_
  - _Implements: REQ-1.1_

- [x] 4.2 Test: links "Continuar" e "Rever Aula" em REVISION apontam para /quiz
  - Verificar que os `routerLink` de "Continuar" e "Rever Aula" geram rotas com sufixo `/quiz` quando a lição é do tipo REVISION e rotas sem esse sufixo para os demais tipos.
  - Test type: unit
  - _Depends: 2.2_
  - _Implements: REQ-1.2, REQ-1.3_

- [x] 4.3 Test: Quiz em modo revisão carrega questões de lições anteriores
  - Verificar que quando `lesson.type === REVISION`, o `QuizService.getRevisionQuestions` é chamado com `lessonId` e `subModuleId` corretos, e que `questions` recebe no máximo 10 itens embaralhados de quizzes com `order < currentOrder`.
  - Test type: integration
  - _Depends: 3.2_
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 4.4 Test: Quiz normal mantém fluxo de carregamento existente
  - Verificar que quando `lesson.type !== REVISION`, o `QuizService.getQuizByLessonId` é chamado e `getRevisionQuestions` não é chamado.
  - Test type: unit
  - _Depends: 3.2_
  - _Implements: REQ-2.3_

- [x] 4.5 Test: estado vazio quando nenhuma questão de revisão está disponível
  - Verificar que quando `getRevisionQuestions` retorna lista vazia, o sinal `noQuestionsAvailable` é `true` e o template exibe a mensagem de estado vazio.
  - Test type: unit
  - _Depends: 3.4_
  - _Implements: REQ-2.4_

- [x] 4.6 Test: progresso da revisão é salvo com lessonId correto
  - Verificar que ao terminar o quiz em modo revisão, `QuizService.completeQuiz` é chamado com o `lessonId` da lição de revisão e `xpService.refreshXp` é executado após a conclusão.
  - Test type: integration
  - _Depends: 3.3_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Confirmar que lições REVISION redirecionam diretamente para `/quiz` em todos os pontos de entrada (botão "Iniciar", links "Continuar" e "Rever Aula").
  - REQ-2: Confirmar que o Quiz no modo revisão carrega questões de lições anteriores do submódulo, limita a 10, e exibe estado vazio quando não há questões.
  - REQ-3: Confirmar que a Edge Function `complete-quiz` é chamada com `lessonId` correto e a tela de resultado é exibida normalmente.
  - Executar `npm test` e verificar que todos os testes passam sem regressão nos fluxos normais de LESSON e CHALLENGE.
  - _Implements: All requirements_
