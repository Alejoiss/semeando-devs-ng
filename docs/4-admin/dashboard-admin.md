# Dashboard Admin

## 1. Objetivo do Fluxo
Fornecer uma visão macro de desempenho e engajamento da plataforma Semeando Devs para os administradores, permitindo análises rápidas por meio de gráficos e indicadores-chave (KPIs).

## 2. Público-Alvo
Administradores da plataforma (Equipe Semeando Devs).

## 3. Passo a Passo (Jornada do Usuário)
1. O administrador acessa o painel admin (`/admin/dashboard`).
2. A tela exibe um painel de controle contendo:
   - **Cartões de KPI (Key Performance Indicators):** Métricas consolidadas (ex: total de alunos, assinantes ativos).
   - **Gráficos Visuais:** Gráficos de linha (evolução temporal), Rosca/Donut (proporções) e Barras (comparações).
3. O administrador pode utilizar o **Seletor de Período** no topo da tela para alterar a janela de tempo analisada:
   - 7 dias
   - 30 dias
   - 90 dias
   - 12 meses
4. Ao alterar o período, todos os gráficos e KPIs reagem reativamente (`signals`) e são recalculados e atualizados automaticamente em tela pelo `DashboardService`.

## 4. Gatilhos de Marketing e Comunicação
- Nenhum. Esta é uma ferramenta estrita de consumo de dados analíticos internos.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Os dados de hoje parecem não estar refletindo no gráfico".
  - **Solução:** Explicar ao administrador que alguns dados podem ter *cache* ou necessitarem de recarregamento (D-1), ou simplesmente orientar a atualizar a página.

## 6. Casos de Erro e Tratamento
- Caso o `DashboardService` falhe ao recuperar os dados da API/Supabase, os componentes de gráficos (`KpiCard`, `LineChart`, etc.) exibirão seus respectivos estados de "Sem Dados" ou indicadores de falha para a equipe.
