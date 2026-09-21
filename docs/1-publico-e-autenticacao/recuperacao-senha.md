# Fluxo de Recuperação e Redefinição de Senha

## 1. Objetivo do Fluxo
Oferecer autonomia para que usuários que esqueceram sua senha possam redefini-la de forma segura através do próprio e-mail, sem intervenção direta do suporte.

## 2. Público-Alvo
Alunos, Professores e Administradores que perderam o acesso.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo é dividido em duas etapas/telas diferentes:

**Etapa 1: Solicitar Recuperação (`/recuperar-senha`)**
1. O usuário acessa a página de *Esqueci Minha Senha*.
2. Preenche o campo **E-mail** com o endereço utilizado no cadastro.
3. Clica em **"Enviar Link de Recuperação"**.
4. O sistema processa e exibe uma mensagem de sucesso em verde: *"Se o e-mail existir em nossa base, um link de recuperação foi enviado."* (Nota: O sistema não diz explicitamente se o e-mail falhou por não existir na base, por medida de segurança e privacidade).

**Etapa 2: Redefinir a Senha (`/redefinir-senha`)**
1. O usuário recebe o e-mail e clica no link (que o direciona para `/redefinir-senha`, contendo um token embutido da sessão de auth).
2. Na nova tela, ele preenche a **Nova Senha** (min. 6 caracteres).
3. Preenche **Confirmar Nova Senha**.
4. Clica em **"Salvar Nova Senha"**.
5. Se validado, exibe a mensagem *"Senha atualizada com sucesso! Redirecionando..."* e o envia de volta para a tela de Login após 2 segundos.

## 4. Gatilhos de Marketing e Comunicação
- **E-mails enviados:**
  - **E-mail de Reset de Senha:** Enviado (via Supabase) contendo o link exclusivo, mágico e com validade de tempo para resetar a senha.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Eu peço o link de recuperação, diz que enviou, mas não chega."
  - **Solução:** 1. Verificar o lixo eletrônico (spam). 2. Confirmar com o usuário se ele não está digitando o e-mail com algum erro de digitação. 3. O usuário pode não ter conta ativa (o sistema diz que enviou de qualquer forma por segurança).
- **Problema:** "O link de recuperação dá erro/expirou."
  - **Solução:** O link do provedor possui prazo de validade ou expira após o uso (ou clique anterior mal processado). Orientar o usuário a solicitar um **novo link** na página de recuperação.

## 6. Casos de Erro e Tratamento
- **Tela de Solicitação:** E-mail inválido/vazio ou falha de conexão exibem blocos de alerta em vermelho abaixo do botão.
- **Tela de Redefinição:**
  - Tentativa de usar senhas desiguais exibe o erro em tempo real "As senhas não conferem".
  - Tentativa de usar o formulário se o token do link estiver inválido/expirado exibirá um card vermelho com a mensagem `"Falha ao redefinir a senha. Tente novamente."` ou a string de erro do provedor.
