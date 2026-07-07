# Implementation Tasks

## Overview

Esta implementação está organizada em 4 fases:

1. **Foundation** - Criação do serviço e configuração de mock das credenciais do AdSense.
2. **Feature Delivery** - Construção do componente reutilizável do banner de anúncios e sua integração no cabeçalho e rodapé.
3. **Acceptance Criteria Testing** - Testes automatizados para validação do comportamento sob diferentes planos e resiliência de rede.
4. **Final Checkpoint** - Validação geral de critérios de aceite e liberação.

**Estimated Effort**: Small-Medium (2-3 sessions)

## Phase 1: Foundation

- [x] 1.1 Criar AdsenseService
  - Criar o serviço que gerencia a injeção dinâmica do script do Google AdSense no DOM condicionado ao plano gratuito do usuário.
  - _Implements: DES-1_

- [x] 1.2 Configurar credenciais mockadas do AdSense
  - Adicionar as chaves mockadas (`data-ad-client`) em constantes ou configurações locais da aplicação para posterior substituição.
  - _Depends: 1.1_
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Criar componente AdBannerComponent
  - Implementar o componente standalone que renderiza o elemento `<ins>` e realiza a inicialização segura com o método `adsbygoogle.push()`.
  - _Depends: 1.1, 1.2_
  - _Implements: DES-2_

- [x] 2.2 Integrar AdBannerComponent no Cabeçalho Interno
  - Adicionar o banner condicionalmente no componente `InternalHeaderComponent` para visualização dos usuários gratuitos.
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-3.1_

- [x] 2.3 Integrar AdBannerComponent no Rodapé do Layout Principal
  - Adicionar o banner condicionalmente no layout principal (`AppComponent`) posicionado no rodapé da página.
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-3.2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: carregar script do AdSense para usuários free
  - Verificar se o script é inserido dinamicamente no DOM quando o usuário logado é free.
  - Test type: unit
  - _Depends: 1.1_
  - _Implements: REQ-1.1_

- [x] 3.2 Test: bloquear script do AdSense para usuários Pró
  - Verificar que nenhum script do AdSense é injetado ou inicializado se o usuário ativo for Pró.
  - Test type: unit
  - _Depends: 1.1_
  - _Implements: REQ-1.2, REQ-2.1_

- [x] 3.3 Test: exibição condicional de banners baseada em rota e plano
  - Validar que os banners de anúncio aparecem na área do `/app` para usuários free, mas ficam ocultos para usuários Pró ou fora do `/app`.
  - Test type: integration
  - _Depends: 2.2, 2.3_
  - _Implements: REQ-2.2, REQ-2.3, REQ-3.1, REQ-3.2_

- [x] 3.4 Test: responsividade dos blocos de anúncio
  - Validar que as propriedades responsivas e classes CSS adequadas são aplicadas ao container do AdSense.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-3.3_

- [x] 3.5 Test: resiliência de layout em falha de rede ou adblocker
  - Validar que o layout não quebra e o container de anúncio é colapsado em caso de erro na rede de anúncios ou ausência do script global.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-4.1, REQ-4.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Verificar todos os critérios de aceite
  - REQ-1: Garantir carregamento assíncrono condicional do script do Google AdSense.
  - REQ-2: Assegurar bloqueio total de anúncios para usuários Pró e exibição em rotas autorizadas para usuários free.
  - REQ-3: Confirmar banners no cabeçalho e rodapé de forma responsiva.
  - REQ-4: Garantir robustez de layout contra adblockers e falhas de inicialização.
  - Executar a suíte completa de testes e validar a navegação no app.
  - _Implements: All requirements_
