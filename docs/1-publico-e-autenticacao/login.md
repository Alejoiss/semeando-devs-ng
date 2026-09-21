# Fluxo de Login

## 1. Objetivo do Fluxo
Permitir que usuários previamente cadastrados autentiquem-se na plataforma de forma segura, garantindo o acesso à área restrita de estudos (`/app`), ao painel do professor (`/professor`) ou ao painel administrativo (`/admin`).

## 2. Público-Alvo
Visitantes que já possuem uma conta registrada na plataforma (Alunos, Alunos PRÓ, Professores e Administradores).

## 3. Passo a Passo (Jornada do Usuário)
1. O usuário acessa a página de login através da URL `/auth/login` (ou através de um redirecionamento ao tentar acessar áreas restritas).
2. O usuário preenche o campo **E-mail**.
3. O usuário preenche o campo **Senha** (mínimo de 6 caracteres).
4. O usuário clica no botão principal **"Entrar"** (o botão altera para o estado *"Validando..."* e fica inativo durante o processamento para evitar múltiplos cliques).
5. Após o sucesso da autenticação no provedor (Supabase), o usuário é automaticamente redirecionado para o dashboard/trilha do aluno (`/app`).

*Navegação secundária na mesma interface:*
- **"Esqueci minha senha":** Link rápido que redireciona para `/recuperar-senha`.
- **"Crie sua conta agora":** Link ao final da página que redireciona novos usuários para `/auth/register`.

## 4. Gatilhos de Marketing e Comunicação
- **Reenvio de E-mail de Confirmação:** Caso a conta tenha acabado de ser criada e ainda não ativada, a tentativa de login falha. A própria tela de erro fornece um botão "Reenviar e-mail de confirmação" que, ao ser clicado, dispara o envio do e-mail de ativação através do serviço de autenticação.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Esqueci a senha que cadastrei."
  - **Solução:** Orientar o usuário a utilizar a opção "Esqueci minha senha" localizada logo abaixo do formulário de login. O suporte **nunca** possui acesso à senha em texto puro do usuário.
- **Problema:** "Diz que minha conta não foi verificada, mas eu não recebi nenhum e-mail."
  - **Solução:** Pedir que o usuário insira o e-mail e senha normalmente e tente logar. A tela será bloqueada avisando da falta de verificação, mas exibirá um botão útil: **"Reenviar e-mail de confirmação"**. Orientar o usuário a clicar nele e, em seguida, olhar sua caixa de *Spam*, *Lixo Eletrônico* ou aba *Promoções*.

## 6. Casos de Erro e Tratamento
O fluxo realiza validações imediatas (Client-side) e validações com o servidor (Server-side):

- **Validações de Interface (Impedem o envio ao servidor):**
  - E-mail vazio: Exibe o texto em vermelho `"Email é obrigatório."`
  - E-mail com formato inválido: Exibe `"Email inválido."`
  - Senha vazia: Exibe `"Senha é obrigatória."`
  - Senha com menos de 6 dígitos: Exibe `"Mínimo de 6 caracteres."`

- **Tratamento de Erros do Servidor (Retorno da API):**
  - **Conta pendente de verificação (`email_not_confirmed`):** Abre um bloco informativo na interface avisando `"Sua conta ainda não foi verificada. Verifique seu e-mail para confirmar seu acesso."` e disponibiliza a ação de reenviar e-mail.
  - **Credenciais inválidas:** Abre um bloco informativo com borda de erro avermelhada alertando `"Email ou senha incorretos. Tente novamente."` (ou passa adiante a mensagem específica retornada pelo erro do backend).
