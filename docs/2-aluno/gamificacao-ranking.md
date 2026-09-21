# Gamificação - Ranking

## 1. Objetivo do Fluxo
Estimular a competição saudável entre os estudantes, incentivando a consistência diária nos estudos através da disputa por posições no quadro de líderes.

## 2. Público-Alvo
Todos os alunos da plataforma.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo ocorre na rota `/app/ranking`.

1. O aluno clica em "Ranking" no menu lateral.
2. O componente carrega e exibe 3 abas de filtro de tempo: **Geral**, **Mensal** e **Semanal**. (O padrão inicial é o Geral).
3. A interface destaca graficamente os 3 primeiros colocados em um pódio.
4. Abaixo, lista os demais usuários ranqueados.
5. Um rodapé fixo ou bloco em destaque sempre mostra a **posição atual do usuário logado** (para que ele não precise rolar a lista infinitamente para se achar).
6. Ao trocar de aba, o sistema busca os novos dados no serviço correspondente (`RankingMonthlyService`, etc.) e recalcula as posições.

## 4. Gatilhos de Marketing e Comunicação
- O Ranking Semanal e Mensal permite ações de marketing (ex: "O top 3 do mês ganhará uma mentoria ou camiseta").

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Fiz XP mas minha posição não mudou na hora".
  - **Solução:** Dependendo da infraestrutura, algumas views de ranking no banco de dados Supabase podem ser materializadas (*cacheadas*) para não sobrecarregar o sistema. A atualização pode não ser imediata.

## 6. Casos de Erro e Tratamento
- Se a API falhar ao buscar o ranking, as listas são esvaziadas e a posição do usuário reseta para Nulo.
