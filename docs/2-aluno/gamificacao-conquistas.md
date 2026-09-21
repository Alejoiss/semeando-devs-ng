# Gamificação - Conquistas

## 1. Objetivo do Fluxo
Servir como o troféu pessoal do aluno, exibindo todas as medalhas alcançadas durante sua jornada de estudos e listando aquelas que ainda faltam, como forma de incentivo.

## 2. Público-Alvo
Alunos logados na plataforma.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo ocorre na rota `/app/conquistas`.

1. O usuário clica em "Conquistas" no menu lateral.
2. A tela carrega duas informações principais do backend em paralelo: A lista total de conquistas que existem na plataforma (`AchievementsService.getAchievements()`) e a lista daquelas que o usuário de fato já desbloqueou (`getUserAchievements()`).
3. O painel superior exibe o total de XP e Seeds acumulados.
4. A tela constrói um grid com todas as medalhas. 
5. As medalhas que o usuário possui ganham **cores vibrantes (gradientes únicos mapeados pelo ID da conquista)** e exibem a data em que foram alcançadas (ex: 21 SET 2026).
6. As medalhas não alcançadas aparecem opacas (cinzas) e bloqueadas, atiçando a curiosidade do aluno de como desbloqueá-las.

## 4. Gatilhos de Marketing e Comunicação
- N/A. (Uso interno de gamificação pura).

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Como desbloqueio a conquista X?".
  - **Solução:** Faz parte da experiência gamificada que algumas conquistas sejam *secretas* ou descobertas organicamente, mas a descrição técnica costuma indicar o requisito (ex: 'Maratonista do Código: Resolva 10 desafios').

## 6. Casos de Erro e Tratamento
- Em caso de falha no carregamento, o array de medalhas fica vazio.
