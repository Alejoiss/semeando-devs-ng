# Gestão de Submódulos

## 1. Objetivo do Fluxo
Organizar o conteúdo de um Módulo em blocos menores (Submódulos), permitindo ao professor estruturar etapas lógicas, definir o escopo de um grupo de aulas e gerenciar a ordenação das lições internas.

## 2. Público-Alvo
Professores e Administradores.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo ocorre na rota `/professor/criar-submodulo/:moduleId` ou `/professor/editar-submodulo/:id`.

**Aba 1: Dados do Submódulo**
1. O professor preenche **Título** (min. 3 caracteres) e **Descrição** (min. 10 caracteres).
2. Escolhe um ícone nativo ou envia uma imagem customizada.
3. Salva os dados para consolidar a estrutura no banco de dados.

**Aba 2: Lições**
1. O painel lista em formato de blocos todas as aulas teóricas, desafios e revisões criadas.
2. O professor pode usar o botão **Nova Lição** para redigir teoria ou **Novo Desafio** para exercícios focados em código prático.
3. O professor pode gerar automaticamente uma **Revisão** clicando no botão específico. O sistema criará (*server-side*) uma lição agregadora que compila informações dos conteúdos anteriores.
4. **Ordenação:** Assim como nos submódulos, as lições podem ser reordenadas via *Drag and Drop*.
5. **Validação:** Cada lição possui um botão de "Validar". O professor realiza uma checagem técnica de que a lição não tem erros grosseiros (falta de texto, quiz sem resposta correta marcada). Somente se todas estiverem validadas, o módulo-mãe ganha permissão de ser publicado.

## 4. Gatilhos de Marketing e Comunicação
- N/A. O trabalho nesta área é apenas de organização de currículo.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Mudei a ordem da lição mas ela voltou pro lugar".
  - **Solução:** Em caso de microqueda de conexão à internet, a reordenação pelo Supabase falha. O sistema bloqueia a visualização mentirosa e restaura a lista como estava originalmente. O professor deve refazer o arraste.

## 6. Casos de Erro e Tratamento
- Validações de Formulário para campos em branco impedem o salvamento.
- Falha ao gerar revisão exibe um alerta de interface: `"Erro ao criar lição de revisão."`
