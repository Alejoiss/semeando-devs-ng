# Requirements

## Overview

Atualmente, usuários do plano gratuito têm acesso restrito apenas ao primeiro submódulo de cada módulo. Esse modelo limita a percepção de valor da plataforma e reduz as chances de conversão para o plano pago, pois o usuário vê pouco do conteúdo antes de ser bloqueado.

A mudança proposta substitui o bloqueio por submódulo por um modelo de **limite diário de consumo**: usuários free poderão navegar livremente por todos os módulos, submódulos e lições, mas só poderão concluir até **5 lições por dia**. Ao atingir esse limite, o acesso a qualquer nova lição é bloqueado até o dia seguinte ou até o upgrade para o plano Pró.

Essa abordagem aumenta a exposição ao conteúdo, melhora a experiência do usuário free e cria uma motivação clara para o upgrade baseada no valor percebido e não na barreira inicial.

## Glossary

| Term | Definition |
|------|------------|
| Usuário free | Usuário autenticado sem assinatura ativa no plano Pró |
| Usuário Pró | Usuário autenticado com assinatura ativa no plano Pró (`isPro = true`) |
| Lição concluída | Registro em `user_lessons` com `completed = true` e `completed_at` não nulo |
| Limite diário | Máximo de 5 lições concluídas no mesmo dia calendário UTC-3 |
| Indicadores de progresso diário | 5 círculos no menu lateral que representam o consumo diário do usuário free |
| Dia corrente | Dia calendário baseado no fuso UTC-3 (horário de Brasília) |

## Assumptions

- O campo `completed_at` na tabela `user_lessons` é confiável e é preenchido no momento em que a lição é marcada como concluída, sendo suficiente para filtrar as lições concluídas no dia corrente.
- O limite diário é verificado no frontend e reforçado pelo backend/guard de rota.
- A contagem diária considera a data do campo `completed_at` no fuso UTC-3.
- Usuários Pró são identificados pela propriedade `isPro` no `UserService`, já disponível no projeto.
- Não é necessário criar uma nova tabela: a tabela `user_lessons` existente é suficiente como fonte de verdade para o controle do limite diário.
- O bloqueio por submódulo existente (order > 1 para usuários free) será removido junto com esta mudança.
- A rota de lição (`/app/s/:slug/ss/:slugSubmodule/lesson/:lessonId`) e as rotas de quiz e challenge derivadas também estão sujeitas ao bloqueio diário.

## Requirements

### REQ-1: Remoção do bloqueio por submódulo para usuários free

**User Story:** As a usuário free, I want to navigate freely through all submodules and lessons, so that I can experience more of the platform's content before deciding to upgrade.

#### Acceptance Criteria

1.1 WHEN um usuário free acessa a página de submódulos de qualquer módulo, THEN the aplicação SHALL exibir todos os submódulos sem aplicar bloqueio baseado na ordem do submódulo.

1.2 WHEN um usuário free acessa a página de listagem de lições de qualquer submódulo, THEN the aplicação SHALL exibir todas as lições disponíveis sem aplicar bloqueio baseado na ordem do submódulo.

---

### REQ-2: Limite diário de 5 lições concluídas para usuários free

**User Story:** As a usuário free, I want to be clearly informed about my daily lesson limit and its current status, so that I can manage my learning sessions and understand when I need to upgrade.

#### Acceptance Criteria

2.1 WHILE o usuário está no plano free, the aplicação SHALL calcular o número de lições concluídas no dia corrente consultando os registros de `user_lessons` com `completed = true` e `completed_at` dentro do dia corrente.

2.2 WHILE o usuário está no plano free e o número de lições concluídas no dia corrente é menor que 5, THEN the aplicação SHALL permitir o acesso ao conteúdo de qualquer lição.

2.3 WHILE o usuário está no plano Pró, the aplicação SHALL não aplicar nenhum limite diário de lições.

---

### REQ-3: Bloqueio efetivo ao atingir o limite diário

**User Story:** As a usuário free que atingiu o limite diário, I want to be prevented from accessing new lesson content, so that the platform enforces fair usage of the free plan.

#### Acceptance Criteria

3.1 WHILE o usuário está no plano free e o número de lições concluídas no dia corrente é igual ou maior que 5, WHEN o usuário tenta navegar para uma lição não concluída anteriormente no dia, THEN the aplicação SHALL exibir a mensagem de bloqueio "Você atingiu o limite máximo de lições diárias no plano gratuito. Faça o upgrade para o plano Pró ou volte amanhã." em vez do conteúdo da lição.

3.2 WHILE o usuário está no plano free e atingiu o limite diário, WHEN o usuário acessa diretamente por URL a rota de uma lição não concluída no dia corrente, THEN the aplicação SHALL bloquear o acesso e exibir a mensagem de bloqueio sem renderizar o conteúdo da lição.

3.3 WHILE o usuário está no plano free e atingiu o limite diário, WHEN o usuário acessa diretamente por URL a rota de quiz ou challenge de uma lição não concluída no dia corrente, THEN the aplicação SHALL bloquear o acesso e redirecionar para a página de bloqueio.

3.4 IF o usuário free atingiu o limite diário e tenta acessar uma lição já concluída anteriormente (incluindo em dias anteriores), THEN the aplicação SHALL permitir o acesso normalmente, pois a lição já foi concluída.

---

### REQ-4: Reset automático do contador diário

**User Story:** As a usuário free, I want my daily lesson counter to reset automatically at the start of a new day, so that I can continue learning the next day without manual intervention.

#### Acceptance Criteria

4.1 WHEN um novo dia calendário (UTC-3) começa, THEN the aplicação SHALL recalcular o número de lições concluídas no dia corrente do zero, sem considerar as lições dos dias anteriores.

---

### REQ-5: Indicadores de progresso diário no menu lateral

**User Story:** As a usuário free, I want to see my daily lesson consumption progress in the sidebar menu, so that I can track how many lessons I have left for the day.

#### Acceptance Criteria

5.1 WHILE o usuário está no plano free, THEN the menu lateral SHALL exibir 5 indicadores circulares representando o progresso diário do usuário.

5.2 WHILE o usuário está no plano free e tem N lições concluídas no dia corrente (0 ≤ N ≤ 5), THEN the menu lateral SHALL exibir N indicadores circulares na cor verde (concluído) e (5 - N) indicadores circulares na cor cinza (não concluído).

5.3 WHEN o usuário conclui uma lição no dia corrente, THEN the menu lateral SHALL atualizar imediatamente o indicador correspondente de cinza para verde.

5.4 WHILE o usuário está no plano Pró, THEN the menu lateral SHALL não exibir os indicadores circulares de progresso diário.

---

### REQ-6: Acesso livre a lições já concluídas

**User Story:** As a usuário free que já concluiu lições anteriormente, I want to be able to revisit those lessons without counting against my daily limit, so that I can review content I have already completed.

#### Acceptance Criteria

6.1 WHILE o usuário está no plano free, WHEN o usuário acessa uma lição que já possui registro em `user_lessons` com `completed = true`, THEN the aplicação SHALL permitir o acesso sem verificar ou decrementar o limite diário.
