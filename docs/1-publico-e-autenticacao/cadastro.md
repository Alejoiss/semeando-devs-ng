# Fluxo de Cadastro

## 1. Objetivo do Fluxo
Permitir que novos visitantes criem uma conta gratuita na plataforma, dando o primeiro passo para se tornarem alunos e acessarem os módulos abertos ou comprarem a assinatura PRÓ.

## 2. Público-Alvo
Visitantes (futuros alunos) que ainda não possuem conta na Semeando Devs.

## 3. Passo a Passo (Jornada do Usuário)
1. O visitante acessa a página de registro através da URL `/auth/register` (ou clicando no botão de Criar Conta no Login/Landing Page).
2. O visitante preenche o **Nome completo** (mínimo de 3 caracteres).
3. O visitante preenche o **E-mail**.
4. O visitante cria uma **Senha** e repete a mesma senha no campo **Confirmar senha** (mínimo de 6 caracteres).
5. O visitante **obrigatoriamente** marca a caixa de aceite dos *Termos de uso*.
6. O visitante **opcionalmente** marca a caixa de aceite para receber *novidades e e-mails promocionais*.
7. O visitante clica em **"Criar Minha Conta"**.
8. Se bem-sucedido, um **Modal de Sucesso ("Conta criada!")** sobrepõe a tela, informando que um e-mail de confirmação foi enviado.
9. O usuário clica em **"Ir para o Login"** no modal e é redirecionado para a tela de login (`/auth/login`).

## 4. Gatilhos de Marketing e Comunicação
- **E-mails enviados:** 
  - Imediatamente após a criação no banco de dados (Supabase), um **E-mail de Confirmação de Conta (Ativação)** é disparado para o e-mail cadastrado.
- **Eventos de Analytics/CRM:**
  - O opt-in da Newsletter salva o valor no banco (`newsletter_active: true/false`), que pode ser usado para segmentação de e-mail marketing.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Criei a conta mas não recebi o e-mail de ativação".
  - **Solução:** Orientar a olhar a caixa de Spam. Se mesmo assim não achar, o aluno deve ir para a tela de Login e tentar logar. O sistema o impedirá e oferecerá um botão para **Reenviar o e-mail**.
- **Problema:** "Diz que o E-mail já está em uso".
  - **Solução:** Orientar o usuário a utilizar a tela de recuperação de senha caso já possua conta e tenha esquecido os dados.

## 6. Casos de Erro e Tratamento
- **Validações na Interface:**
  - Campos em branco: Mostra mensagem "X é obrigatório."
  - Senhas divergentes: Mostra mensagem "As senhas não conferem."
  - Termos de uso desmarcados: Mostra mensagem em vermelho exigindo o aceite.
- **Erros do Servidor:**
  - Se a conta já existir ou houver falha na rede, uma mensagem vermelha aparecerá abaixo do botão: `"Erro ao criar conta. Tente novamente."` (ou a mensagem nativa do erro).
