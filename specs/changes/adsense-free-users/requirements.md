# Requirements

## Overview

Para monetizar a versão gratuita da plataforma Semeando Devs e incentivar o upgrade para a assinatura paga (plano Pró), será implementada uma camada de anúncios discreta. Esses anúncios serão exibidos exclusivamente para usuários que estão no plano gratuito.

A integração utilizará o Google AdSense como provedor de anúncios, priorizando formatos de banner discretos em áreas como cabeçalho (header) e rodapé (footer) da área interna de conteúdo da plataforma (rotas sob `/app`). A experiência de usuários pagantes (plano Pró) deve permanecer 100% livre de qualquer publicidade ou scripts relacionados.

## Glossary

| Term | Definition |
|------|------------|
| Plano Gratuito / Free | Tipo de conta de usuário autenticado que não possui uma assinatura ativa do plano Pró. |
| Plano Pró | Tipo de conta de usuário autenticado com uma assinatura ativa (`isPro = true`). |
| Google AdSense | Serviço de publicidade do Google usado para exibir banners na plataforma. |
| Área de Conteúdo | Todas as páginas acessadas sob a rota pai `/app` (ex: listagem de módulos, lições, quizzes, ranking, etc.). |
| Bloco de Anúncio / Banner | Container visual integrado ao AdSense para exibição de anúncios responsivos. |

## Assumptions

- O `UserService` fornece a informação se o usuário logado é Pró ou gratuito de forma reativa através de signals (ex: `currentUser()?.isPro`).
- O script do Google AdSense não precisa ser carregado caso o usuário não esteja logado ou seja do plano Pró, otimizando a performance e privacidade.
- Banners do AdSense requerem um identificador de cliente (`data-ad-client`) e um identificador de slot (`data-ad-slot`), que serão configurados via ambiente ou constantes.
- Em ambientes locais de desenvolvimento (localhost), os blocos do AdSense exibem espaços reservados (placeholders) ou se comportam como banners de simulação devido a restrições de exibição de anúncios reais em domínios não homologados.

## Requirements

### REQ-1: Integração e Carregamento Assíncrono do Google AdSense

**User Story:** As a plataforma, I want to load the Google AdSense script asynchronously for free users, so that the page loading performance is not negatively impacted.

#### Acceptance Criteria

1.1 WHILE o usuário está no plano gratuito, the aplicação SHALL carregar o script do Google AdSense de forma assíncrona para inicializar os anúncios.

1.2 WHILE o usuário está no plano Pró, the aplicação SHALL impedir o carregamento do script do Google AdSense e a injeção de tags de script relacionadas.

---

### REQ-2: Controle de Exibição por Tipo de Usuário e Rota

**User Story:** As a usuário Pró, I want to experience the platform completely free of ads, so that I feel the value of my paid subscription.

#### Acceptance Criteria

2.1 WHILE o usuário está no plano Pró, the aplicação SHALL ocultar todos os blocos de anúncio e impedir sua renderização em qualquer tela.

2.2 WHILE o usuário está no plano gratuito e navega na área de conteúdo da plataforma, the aplicação SHALL exibir os blocos de anúncio ativos.

2.3 WHILE o usuário navega fora da área de conteúdo da plataforma, the aplicação SHALL ocultar todos os blocos de anúncio.

---

### REQ-3: Posicionamento dos Banners e Responsividade

**User Story:** As a usuário gratuito, I want to view ads only in discrete areas (header and footer) of the application, so that the ads do not obstruct my reading or navigation of the lessons.

#### Acceptance Criteria

3.1 WHILE o usuário está no plano gratuito e visualizando a interface da plataforma, the aplicação SHALL exibir um banner de anúncio posicionado no cabeçalho.

3.2 WHILE o usuário está no plano gratuito e visualizando a interface da plataforma, the aplicação SHALL exibir um banner de anúncio posicionado no rodapé da página.

3.3 THE blocos de anúncio SHALL redimensionar automaticamente seu tamanho para se ajustarem a telas de desktop e mobile de acordo com as diretrizes de responsividade do Google AdSense.

---

### REQ-4: Resiliência de Layout e Fallback

**User Story:** As a usuário gratuito, I want the page layout to remain intact even if there are no ads available, so that my reading flow is not broken.

#### Acceptance Criteria

4.1 IF a rede do Google AdSense não retornar anúncios disponíveis, THEN the blocos de anúncio SHALL colapsar sua altura ou ocultar seu container para evitar espaços vazios no layout.

4.2 IF a rede do Google AdSense falhar ou for bloqueada por mecanismos do navegador, THEN the aplicação SHALL prosseguir com a renderização normal da interface e ignorar a falha de carregamento.
