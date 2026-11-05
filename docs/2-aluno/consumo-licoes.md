# Consumo de Lições (Visão Geral)

## 1. Objetivo do Fluxo
Explicar as regras que valem para todos os tipos de lição: o que cada tipo entrega, quando a lição é considerada concluída, quanto XP rende e como funciona o limite diário.

## 2. Público-Alvo
Alunos logados (Free e PRÓ).

## 3. Passo a Passo (Jornada do Usuário)
Cada submódulo lista suas lições em ordem. O aluno percorre uma a uma, e a próxima só libera depois que a anterior é concluída.

| Tipo | O que o aluno faz | Quando conclui | XP |
|---|---|---|---|
| Aula | Lê o conteúdo (e o material extra, se houver) e responde ao quiz de 10 perguntas | Aprovação no quiz (70% ou mais) | 50 |
| Revisão | Responde a 10 perguntas aleatórias das lições anteriores do mesmo submódulo | Aprovação no quiz (70% ou mais) | 50 |
| Desafio | Escreve código no editor e envia para feedback da IA | Envio avaliado pela IA | 100 |

- Os Seeds ganhos são sempre 10% do XP da lição.
- Detalhes de cada tipo: [Aula teórica](consumo-aula-teorica.md), [Quiz e Revisão](consumo-quiz.md) e [Desafio de código](consumo-desafio-codigo.md).
- Ao concluir a última lição do último submódulo, o aluno vai para a [tela de conclusão do módulo](conclusao-modulo.md).

**Limite diário**
- Plano Free: até 5 lições concluídas por dia. O dia segue o horário de Brasília.
- Plano PRÓ: lições ilimitadas.
- Ao atingir o limite, o aluno é impedido de abrir novas lições e vê o convite para assinar o PRÓ. O contador volta a zero no dia seguinte.
- Os envios de código à IA têm limite à parte (5 por dia no Free e 30 no PRÓ).

## 4. Gatilhos de Marketing e Comunicação
- O bloqueio por limite diário é o principal ponto de conversão para o plano PRÓ.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Não consigo abrir mais lições hoje".
  - **Solução:** O plano Free permite 5 lições concluídas por dia. Orientar a voltar no dia seguinte ou assinar o PRÓ.
- **Problema:** "Reprovei no quiz, perdi o dia?".
  - **Solução:** Só lições concluídas contam para o limite. Reprovar não conclui a lição, então o aluno pode tentar de novo.

## 6. Casos de Erro e Tratamento
- Falha de rede ao abrir a aula exibe `"Erro ao carregar a aula."`.
