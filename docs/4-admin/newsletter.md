# Envio de Newsletter

## 1. Objetivo do Fluxo
Oferecer uma ferramenta interna para a equipe administrativa redigir e disparar e-mails em massa para a base de alunos cadastrados, permitindo engajamento e venda sem depender de ferramentas externas.
*(Nota: a tela cobre listagem, cadastro, duplicação, envio de teste, envio e reenvio. Só administradores podem disparar e-mails.)*

## 2. Público-Alvo
Administradores da plataforma (Equipe de Conteúdo e Marketing).

## 3. Passo a Passo (Jornada do Usuário)
1. O administrador acessa `/admin/envio-de-newsletter` e vê a lista de newsletters (20 por página), com busca por assunto (contém) e ordenação por data de criação.
2. Clicar em uma linha abre a visualização do e-mail.
3. "Nova newsletter" abre o formulário, agrupado em Assunto, Conteúdo (mensagem e HTML opcional) e Botão de ação, com pré-visualização do e-mail ao lado.
4. "Duplicar", na lista, abre o formulário já preenchido com os dados da newsletter escolhida.
5. "Enviar teste" manda o conteúdo do formulário (mesmo sem salvar) para o e-mail de teste fixo.
6. "Salvar" abre uma advertência com duas opções: "Salvar" (apenas guarda) e "Salvar e enviar" (guarda e dispara para os inscritos, com barra de progresso). Depois, o administrador volta para a lista.
7. "Reenviar", na lista, envia somente para quem ainda não recebeu aquela newsletter.

## 4. Gatilhos de Marketing e Comunicação
- *[Futuro]*: Este será o centro de comando para comunicações ativas da plataforma.

## 5. Dúvidas Frequentes e Suporte
- N/A (Em desenvolvimento).

## 6. Casos de Erro e Tratamento
- N/A (Em desenvolvimento).
