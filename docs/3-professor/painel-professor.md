# Painel do Professor

## 1. Objetivo do Fluxo
Oferecer ao professor autenticado uma visão geral de todos os cursos sob sua responsabilidade, permitindo gerenciar a disponibilidade (visibilidade) de cada um e acessar rapidamente as telas de edição.

## 2. Público-Alvo
Professores e Administradores da plataforma.

## 3. Passo a Passo (Jornada do Usuário)
1. O professor acessa a área logada e clica em **Área do Professor** no menu lateral, sendo direcionado para `/professor/meus-cursos`.
2. A tela exibe uma lista em formato de *cards* com todos os cursos atrelados à conta do professor logado.
3. **Visibilidade (Toggle):** Em cada curso, existe um controle de disponibilidade (Ativo / Em Revisão). Ao tentar ativar um curso, o sistema verifica se *todas as lições internas estão validadas*. Se não estiverem, o curso não pode ser publicado.
4. Ao clicar sobre um curso, o professor é redirecionado para a tela de edição detalhada do curso (`/professor/editar-curso/:id`).
5. Existe um botão principal **"Novo Curso"** que o direciona para a rota de criação (`/professor/criar-curso`).

## 4. Gatilhos de Marketing e Comunicação
- Nenhum diretamente neste momento.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Tento publicar meu curso mas o sistema não deixa e avisa que há lições não validadas".
  - **Solução:** Orientar o professor a entrar na edição do curso, acessar os módulos, revisar e validar todas as lições (teóricas, quizzes, desafios) que ele criou internamente. Nenhuma lição pode estar pendente.

## 6. Casos de Erro e Tratamento
- **Erro de Disponibilidade:** Exibe a mensagem de erro específica: `"O curso X possui lições não validadas. Valide todas as lições antes de disponibilizá-lo."`
- **Erro de carregamento:** Caso o serviço falhe ou caia a conexão, a tela exibe uma mensagem de erro na interface: `"Erro ao carregar seus cursos"`.
