# Painel do Professor

## 1. Objetivo do Fluxo
Oferecer ao professor autenticado uma visão geral de todos os módulos de curso sob sua responsabilidade, permitindo gerenciar a disponibilidade (visibilidade) de cada um e acessar rapidamente as telas de edição.

## 2. Público-Alvo
Professores e Administradores da plataforma.

## 3. Passo a Passo (Jornada do Usuário)
1. O professor acessa a área logada e clica em **Área do Professor** no menu lateral, sendo direcionado para `/professor/meus-modulos`.
2. A tela exibe uma lista em formato de *cards* com todos os módulos atrelados à conta do professor logado.
3. **Visibilidade (Toggle):** Em cada módulo, existe um controle de disponibilidade (Ativo / Em Revisão). Ao tentar ativar um módulo, o sistema verifica se *todas as lições internas estão validadas*. Se não estiverem, o módulo não pode ser publicado.
4. Ao clicar sobre um módulo, o professor é redirecionado para a tela de edição detalhada do módulo (`/professor/editar-modulo/:id`).
5. Existe um botão principal **"Novo Módulo"** que o direciona para a rota de criação (`/professor/criar-modulo`).

## 4. Gatilhos de Marketing e Comunicação
- Nenhum diretamente neste momento.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Tento publicar meu módulo mas o sistema não deixa e avisa que há lições não validadas".
  - **Solução:** Orientar o professor a entrar na edição do módulo, acessar os submódulos, revisar e validar todas as lições (teóricas, quizzes, desafios) que ele criou internamente. Nenhuma lição pode estar pendente.

## 6. Casos de Erro e Tratamento
- **Erro de Disponibilidade:** Exibe a mensagem de erro específica: `"O módulo X possui lições não validadas. Valide todas as lições antes de disponibilizá-lo."`
- **Erro de carregamento:** Caso o serviço falhe ou caia a conexão, a tela exibe uma mensagem de erro na interface: `"Erro ao carregar seus módulos"`.
