# Requirements

## Overview
A plataforma atualmente realiza apenas validação sintática do e-mail durante o registro. Para aumentar a segurança e garantir a veracidade dos contatos, é necessário implementar a verificação real de e-mail utilizando a funcionalidade padrão do Supabase (Email Confirmation). Adicionalmente, caso o usuário tente acessar a plataforma sem ter confirmado o e-mail, o sistema deverá permitir o reenvio do e-mail de confirmação a partir da tela de login. O template do e-mail enviado deve ser customizado com a identidade visual da plataforma, estar em português e utilizar um tom amigável.

## Assumptions
- O envio de e-mails será configurado no Supabase (configurações SMTP ou via provider padrão configurado localmente).
- O layout do e-mail deverá refletir a identidade visual "Neon Terminal" descrita no Design System da plataforma.

## Requirements

### REQ-1: Envio de E-mail de Confirmação no Registro

**User Story:** As a novo usuário, I want receber um e-mail de confirmação após o registro, so that eu possa comprovar a posse do meu endereço de e-mail.

#### Acceptance Criteria
1.1 WHEN o usuário submete um formulário de registro válido, THEN the sistema de autenticação SHALL enviar um e-mail de confirmação para o endereço fornecido.
1.2 THE e-mail de confirmação SHALL apresentar o conteúdo em português com tom amigável e layout visualmente consistente com a plataforma.
1.3 THE sistema de autenticação SHALL manter o status do usuário como não verificado até que o link de confirmação do e-mail seja acessado.

### REQ-2: Restrição de Login por E-mail Não Verificado

**User Story:** As a usuário com e-mail não verificado, I want ser informado que não posso acessar a plataforma, so that eu saiba que preciso confirmar meu e-mail.

#### Acceptance Criteria
2.1 IF o usuário tentar fazer login e seu e-mail não estiver verificado, THEN the sistema de autenticação SHALL rejeitar a tentativa de login.
2.2 WHEN o login for rejeitado por falta de verificação de e-mail, THEN the interface de login SHALL exibir uma mensagem alertando o usuário sobre a pendência.

### REQ-3: Reenvio do E-mail de Confirmação

**User Story:** As a usuário com e-mail não verificado, I want poder solicitar o reenvio do e-mail de confirmação, so that eu possa validar meu acesso caso não tenha recebido a primeira mensagem.

#### Acceptance Criteria
3.1 WHERE o login é bloqueado por e-mail não verificado, the interface de login SHALL exibir uma opção para solicitar o reenvio do e-mail de confirmação.
3.2 WHEN o usuário aciona a opção de reenvio, THEN the sistema de autenticação SHALL disparar um novo e-mail de confirmação para o endereço correspondente.
3.3 WHEN a solicitação de reenvio for processada, THEN the interface de login SHALL apresentar um feedback visual de sucesso ou de aguardo para o usuário.

### REQ-4: Arquivo de Configuração de E-mail

**User Story:** As a administrador do sistema, I want que o repositório forneça o template com as variáveis de ambiente necessárias, so that eu possa configurar as credenciais de envio de e-mail do Supabase posteriormente.

#### Acceptance Criteria
4.1 THE ambiente de desenvolvimento SHALL possuir um arquivo `.env` com a definição das chaves SMTP essenciais necessárias para o funcionamento do envio de e-mail pelo Supabase.
