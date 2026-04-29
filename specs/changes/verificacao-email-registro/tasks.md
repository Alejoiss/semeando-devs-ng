# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare `.env` configurations and backend authentication service methods
2. **Feature Delivery** - Implement the UI states and actions on the Login component
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Configurar variáveis de e-mail no .env
  - Atualizar arquivo `.env` / `.env.example` com o template de variáveis SMTP do Supabase.
  - _Implements: DES-3_

- [x] 1.2 Tratar erro de e-mail não verificado no AuthService
  - Mapear a exceção do Supabase ("Email not confirmed") no fluxo de login para torná-la identificável pelo frontend.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 1.3 Adicionar método de reenvio de e-mail no AuthService
  - Criar método `resendConfirmationEmail(email)` que invoca a API do Supabase para reenvio.
  - _Depends: 1.2_
  - _Implements: DES-2_

## Phase 2: Feature Delivery

- [x] 2.1 Exibir bloqueio de login no LoginComponent
  - Adicionar o controle de estado (`isEmailUnverified`) no TS e a UI de aviso de pendência no HTML do login.
  - _Depends: 1.2_
  - _Implements: DES-1_

- [x] 2.2 Adicionar ação de reenvio no LoginComponent
  - Inserir botão de reenvio na UI de bloqueio e conectá-lo ao `AuthService`, incluindo feedbacks visuais de loading, erro e sucesso.
  - _Depends: 1.3, 2.1_
  - _Implements: DES-2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: envio de e-mail de confirmação e infraestrutura
  - Verificar se a infraestrutura provê variáveis para envio e se o status inicial após o registro é 'não verificado'.
  - Test type: e2e
  - _Depends: 1.1_
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-4.1_

- [x] 3.2 Test: bloqueio de login por e-mail não verificado
  - Verificar se tentativas de login sem e-mail validado são rejeitadas e alertam o usuário.
  - Test type: e2e
  - _Depends: 2.1_
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 3.3 Test: reenvio de e-mail de confirmação
  - Verificar se a opção de reenvio é apresentada durante o bloqueio e se dispara o e-mail com feedback correspondente.
  - Test type: e2e
  - _Depends: 2.2_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: E-mail enviado e status preservado corretamente.
  - REQ-2: Bloqueio do login funcional e interface alertando o bloqueio.
  - REQ-3: Reenvio executando chamada de API correta.
  - REQ-4: Configuração provida em `.env`.
  - _Implements: All requirements_
