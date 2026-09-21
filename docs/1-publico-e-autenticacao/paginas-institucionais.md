# Páginas Institucionais

## 1. Objetivo do Fluxo
Apresentar a plataforma "Semeando Devs" ao público em geral, detalhando a metodologia gamificada de ensino, os cursos disponíveis, as formas de contato e as regras jurídicas (Termos). O objetivo macro destas páginas é o convencimento e a captação de leads (cadastros).

## 2. Público-Alvo
Visitantes (tráfego orgânico, tráfego pago) e Usuários logados (principalmente para Suporte e Termos de Uso).

## 3. Passo a Passo (Jornada do Usuário)
As páginas institucionais são abertas e não exigem autenticação.

**Landing Page (`/home`):**
1. O usuário chega à página principal. O bloco inicial (Hero) destaca o modelo de aprendizado e fornece um Call To Action (CTA) claro: "Começar Minha Jornada", que direciona para a criação de conta ou login.
2. Ao rolar, ele encontra os Módulos de Aprendizado em formato de vitrine.
3. Em seguida, descobre a Metodologia dividida em 3 passos (Teoria, Revisão e Desafios de Código).
4. É apresentado ao ecossistema de Gamificação (XP, Seeds, Ranking e Conquistas).
5. Acessa uma área de Perguntas Frequentes (FAQ) retráteis.
6. Encontra o CTA final convidando à inscrição gratuita.

**Página de Contato (`/support/contact`):**
1. Usuário busca ajuda.
2. A tela exibe o canal oficial (E-mail de Suporte) em um painel estilizado.
3. Existe um botão de conveniência **"Copiar E-mail"** que envia o endereço de e-mail automaticamente para a área de transferência do usuário, facilitando o envio via seu aplicativo de e-mail favorito.

**Demais Páginas (`/cursos`, `/termos-de-uso`):**
- Listam os cursos disponíveis ou exibem conteúdo puramente textual referente às políticas e regulamentos da Semeando Devs.

## 4. Gatilhos de Marketing e Comunicação
- **Pixels e Analytics:** A Landing Page é o coração das campanhas. Visualizações nela disparam eventos básicos de `page_view` vitais para remarketing em ferramentas de tráfego (Google Ads, Meta Ads).
- **Sem formulários embutidos:** Atualmente, a página de Contato não coleta a dúvida e dispara um e-mail. Ela atua como um redirecionador (informa o e-mail oficial ao usuário).

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Mandei um e-mail de contato mas ninguém me respondeu".
  - **Solução:** Como não há formulário, a garantia de envio depende do e-mail do próprio aluno. A equipe de suporte deve sempre orientar a verificar a caixa de Spam na resposta e garantir que o e-mail copiado da plataforma esteja recebendo mensagens.
- **Problema:** "Como volto para o app se eu acidentalmente cliquei na Home?".
  - **Solução:** Existe um menu fixo superior (Header) que reconhece quando o usuário está logado e permite retornar à sua dashboard facilmente.

## 6. Casos de Erro e Tratamento
Como essas páginas são essencialmente de exibição de conteúdo estático ou navegação, os únicos erros mapeados seriam:
- Falha ao renderizar imagens ou ícones de gamificação (tratamento de imagem quebrada).
- Funcionalidade "Copiar E-mail" indisponível caso o navegador do visitante restrinja APIs de *clipboard* por motivo de privacidade. (Botão pode falhar silenciosamente neste caso).
