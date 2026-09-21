# Gestão de Alunos

## 1. Objetivo do Fluxo
Permitir que a equipe administrativa visualize, busque e gerencie a base de alunos cadastrados na plataforma Semeando Devs, ajudando no controle e suporte direto aos usuários.

## 2. Público-Alvo
Administradores da plataforma.

## 3. Passo a Passo (Jornada do Usuário)
1. O administrador acessa a aba de alunos (`/admin/lista-de-alunos`).
2. A interface exibe uma tabela listando os estudantes. O carregamento possui um esqueleto visual (*skeleton*) enquanto os dados são buscados no servidor.
3. **Pesquisa Inteligente:** O administrador pode utilizar a Barra de Pesquisa. Ao digitar, o sistema aguarda 300ms (*debounce*) e realiza a busca automaticamente por nome ou e-mail (retornando à primeira página de resultados).
4. **Ordenação:** É possível ordenar a lista clicando nas colunas "Nome" ou "Data de Cadastro" (crescente ou decrescente).
5. **Paginação:** A lista é paginada por lotes (10 alunos por página por padrão). O admin usa os controles de navegação para ir e voltar.
6. **Detalhes do Aluno:** Ao clicar sobre a linha de um estudante, o administrador é direcionado para a rota `/admin/lista-de-alunos/:id-aluno` para investigar a fundo os dados, progresso e faturamento daquele usuário específico.

## 4. Gatilhos de Marketing e Comunicação
- Nenhum gatilho direto a partir da listagem. No entanto, é desta listagem que a equipe extrai ou visualiza o status (ativo/inativo) de um lead ou aluno PRO.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "A lista demora muito a carregar".
  - **Solução:** Como a paginação e busca são feitas diretamente no banco (Supabase) via `AdminStudentService` em tempo real, lentidões geralmente estão associadas à conexão de rede local.

## 6. Casos de Erro e Tratamento
O componente possui um controle de estado reativo e lida com falhas da seguinte maneira:
- **Falha de Carregamento:** Se ocorrer qualquer problema na requisição (ex: permissões RLS no Supabase, queda de rede), a tabela ficará vazia e exibirá no topo a mensagem: `"Não foi possível carregar os alunos. Tente novamente."` ou a mensagem técnica originada pelo banco.
- **Nenhum resultado:** Se a pesquisa não encontrar nenhum nome ou e-mail correspondente, a tabela apresentará um estado de lista vazia.
