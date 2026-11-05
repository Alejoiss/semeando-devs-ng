# Consumo de Quiz e Revisão

## 1. Objetivo do Fluxo
Avaliar a absorção de conhecimento do aluno através de perguntas objetivas (*múltipla escolha*). Aplicável tanto para Quizzes rápidos ao final de aulas, quanto para Lições massivas de *Revisão Inteligente*.

## 2. Público-Alvo
Alunos logados.

## 3. Passo a Passo (Jornada do Usuário)
A interface é controlada pelo `quiz.ts`, localizada geralmente após uma aula (`.../lesson/:lessonId/quiz`) ou acessada diretamente se for uma lição do tipo `REVISION`.

1. O sistema carrega as 10 perguntas do quiz, embaralhando a ordem das perguntas e alternativas (*shuffle*).
2. Um cronômetro interno silencioso (`spentTimeSeconds`) é disparado.
3. A pergunta atual é exibida. O aluno pode usar atalhos de teclado (A, B, C, D) ou o mouse para escolher uma alternativa.
4. Após selecionar, o aluno confirma. O sistema vai ao backend validar se está correta.
5. Se estiver errada, a alternativa pisca em vermelho e a certa é revelada em verde, acompanhada por um texto explicativo (*Reason*).
6. Antes de confirmar, o aluno pode gastar **50 Seeds** (moeda virtual) para comprar uma **Dica**. A dica exibe a justificativa da resposta correta.
7. O aluno avança (`Enter`) até terminar todas as questões.
8. Ao finalizar, o frontend envia os resultados para a API (*Edge Function*).
9. O aluno recebe o resultado (aprovação fixa com 70% ou mais). Se aprovado, a lição é concluída e ele recebe XP (50 por lição ou revisão) e Seeds (10% do XP). Se reprovado, não avança e pode refazer o quiz.

## 4. Gatilhos de Marketing e Comunicação
- Conclusão do Quiz com maestria frequentemente desencadeia o desbloqueio de novas **Conquistas**, gerando uma notificação e sensação de *dopamina*.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Gastei Seeds mas não ajudou".
  - **Solução:** A dica mostra a justificativa da resposta correta, que o professor cadastra para cada resposta. Não há reembolso automático de Seeds.

## 6. Casos de Erro e Tratamento
- Demora na confirmação da questão devido à rede lenta deixa o botão de confirmar em estado de carregamento (*loading*).
