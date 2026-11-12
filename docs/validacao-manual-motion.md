# Validação manual: animações, acessibilidade e ajustes de 12/11/2026

Este documento tem duas partes: **o que foi feito** (para não esquecer nada) e **o checklist** para validar manualmente.
Tudo foi verificado por teste automatizado, build e navegador, mas o checklist cobre o que só o olho humano valida.

## 1. O que foi feito

| # | Tema | Resumo |
|---|---|---|
| 1 | **Fundação de motion** | Tokens `--motion-*` e `--ease-*` em `styles.scss`. Keyframes unificados (o `fadeInOut` estava copiado em 5 arquivos, agora é `.success-message`). `prefers-reduced-motion` global. |
| 2 | **Modais sem `@angular/animations`** | Conquista e newsletter usam `animate.enter` / `animate.leave` com CSS global (`sd-modal-*`, `sd-overlay-*`). `provideAnimations()` removido. |
| 3 | **`transition-all` → específico** | 198 usos em templates e 3 em SCSS trocados por `transition` (cor, sombra, opacidade, transform). Barras de progresso usam `transition-[width]`. |
| 4 | **GSAP no app** | `gsap` instalado e carregado sob demanda. Loader de marca (`app-brand-loader`), diretiva `appMotionReveal` (contagem, anel e confete) aplicada ao resultado do quiz e ao modal de conquista. |
| 5 | **Landing page `/`** | Hero com título dividido por palavras, orbes e print em 3D. Cards em cascata ao rolar. Ranking que sobe e XP que conta. FAQ animado e acessível. Troca da metodologia. CTA com logo e botão magnético. Barra de progresso de rolagem. |
| 6 | **Acessibilidade** | Lighthouse de 82 para 100: contraste, ordem de headings (`h4`→`h3`), nome acessível nos links sociais, parágrafos de seção em 18px. |
| 7 | **LinkedIn** | Ícone no rodapé e na barra lateral, com `aria-label`. |
| 8 | **Voltar ao site** | Logo clicável e link "Voltar ao site" em `/auth/login` e `/auth/register`. |
| 9 | **Dados de teste locais** | Scripts em `supabase/dev-seed/` (seção 2). |
| 10 | **Animações dentro do quiz** | Barra de progresso, transição entre questões com opções em cascata, feedback de acerto (pulso e check) e erro (tremida e X), justificativa/dica que abrem deslizando, pulso nos contadores e anúncio de "Resposta correta/incorreta" para leitor de tela. |

Arquivos novos: `src/app/utils/motion.ts`, `src/app/directives/motion-reveal.ts`, `src/app/components/brand-loader/`, `src/app/pages/landing-page/landing-motion.ts`, `supabase/dev-seed/`.

## 2. Preparar o ambiente

1. **Supabase local no ar** (`supabase status`). Studio em http://127.0.0.1:54323.
2. **Liberar escritas locais** (uma vez). O Supabase CLI recente cria as tabelas sem INSERT/UPDATE/DELETE para `authenticated`; sem isso o app dá 403 ao iniciar lição, salvar progresso ou fechar a conquista.
   ```bash
   docker exec -i supabase_db_semeandodevsapp psql -U postgres < supabase/dev-seed/local-grants.sql
   ```
   Só vale para o banco local e não mexe em migrations. A RLS continua valendo, e `profiles` fica de fora de propósito.
   - O script também dá acesso às tabelas públicas ao `service_role`, que é o papel das edge functions. Sem isso, o `complete-quiz` falha com `permission denied for table lessons` (visto na aba Network).
   - Se você já tinha rodado o script antes, rode de novo: ele é idempotente.
3. **Popular conteúdo de teste** (pode repetir, é idempotente):
   ```bash
   docker exec -i supabase_db_semeandodevsapp psql -U postgres < supabase/dev-seed/seed-test-content.sql
   ```
4. **Subir o app**: `npx ng serve --port 4201`.
   - Evite `npm start`: o `prestart` baixa o catálogo de **produção** e regrava `public-catalog.snapshot.json`.
5. **Edge functions** (só para concluir quiz): `npx supabase functions serve --env-file .env`.
   - O `debug.sh` usa `--inspect-mode brk`, que pausa a execução esperando um debugger. Rode sem essa flag.
   - Sem as functions no ar, o resultado do quiz fica sem XP/seeds (`complete-quiz` responde 503).
   - Sintoma: você termina o quiz, a tela de resultado aparece, mas XP, seeds e progresso **não mudam**, e as tentativas ficam sem conclusão em `user_quizzes` (`completed = false`). O app só registra o erro no console. Para checar: `curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://127.0.0.1:54321/functions/v1/complete-quiz` deve dar `200`, não `503`.
   - O processo precisa continuar rodando em um terminal seu enquanto você testa.

### O que o seed cria

| Módulo | Submódulo | Lições |
|---|---|---|
| **HTML Essencial** (publicado) | Primeiros passos | 1 O que é HTML? (LESSON, quiz 10 questões) · 2 Estrutura de uma página (LESSON, quiz) · 3 Revisão (REVISION) · 4 Desafio: primeira página (CHALLENGE) |
| | Formulários | 1 Campos de formulário (LESSON, quiz) · 2 Desafio: formulário de contato (CHALLENGE) |
| **CSS na Prática** (publicado) | Seletores e cores | 1 Seletores básicos (LESSON, quiz) · 2 Desafio: estilize um card (CHALLENGE) |
| **JavaScript Moderno** (`in_revision`, "Em breve") | , | , |

- 4 quizzes, 40 questões, cada uma com 4 respostas e 1 correta (em posições variadas).
- Os 3 módulos estão vinculados ao admin em `teacher_modules`, e é isso que faz eles aparecerem em `/professor/meus-modulos`. Sem esse vínculo a tela do professor fica vazia, mesmo com o conteúdo no banco.
- As tabelas de **progresso** (`user_modules`, `user_lessons`, `user_quizzes`, `user_questions`) começam vazias de propósito: elas só enchem quando você estuda no app.
- **Atenção:** as páginas públicas (`/` e `/cursos`) mostram o catálogo de **produção** (arquivo `public-catalog.snapshot.json`). Os módulos de teste aparecem só na área logada (`/app`).

**Ver as respostas corretas de uma lição** (para passar ou reprovar de propósito):
```sql
select row_number() over (order by q.id) n, sc.content as pergunta, a.text as correta
from lessons l join quizzes z on z.lesson_id = l.id join questions q on q.quiz_id = z.id
join section_content sc on sc.question_id = q.id join answers a on a.question_id = q.id and a.is_correct
where l.title = 'O que é HTML?' order by q.id;
```

**Resetar o conteúdo e o progresso de teste:** rode `cleanup-test-content.sql` e depois `seed-test-content.sql`. A remoção é em cascata e apaga o seu progresso nesses módulos. O XP total e as conquistas **não** voltam.

## 3. Checklist

Marque conforme for validando. Em cada item, observe se o movimento é suave, se nada pisca e se não há erro no console.

### A. Base de motion e mensagens
- [ ] No painel do professor (Criar módulo, Criar submódulo, aba de conteúdo), salvar mostra "Salvo com sucesso!" entrando pela direita e sumindo em ~3 s
- [ ] A mensagem aparece em todas essas telas (antes cada uma tinha uma cópia do CSS)
- [ ] Botões, cards e links têm hover suave, sem "arrastar" propriedades de layout
- [ ] Barras de progresso (módulos, submódulo, detalhe do aluno) animam a largura ao carregar

### B. Modais de conquista e newsletter
Preparar os dados (troque o e-mail pelo da conta que está logada):
```sql
-- conquista não vista
insert into user_achievements (user_id, achievement_id, viewed, completed, progress)
select p.id, a.id, false, true, 1 from profiles p, achievements a
where p.email = 'SEU_EMAIL' and a.identification = 'APRENDIZ_DE_TAGS';
-- newsletter não vista
with n as (insert into newsletter (subject, body) values ('[TESTE] Novidade', 'Newsletter de teste.') returning id)
insert into user_newsletter (user_id, newsletter_id) select p.id, n.id from profiles p, n where p.email = 'SEU_EMAIL';
```
- [ ] Ao recarregar `/app`, o modal de **conquista** entra com escala e fade (~0,4 s)
- [ ] O ícone faz ressalto, os textos e botões entram em cascata, e sai confete nas cores da marca
- [ ] "Fechar" e "Mostrar minhas conquistas" fecham o modal com animação de saída (escala e fade) e **sem erro 403** no console
- [ ] O modal de **newsletter** entra e sai com a mesma animação, e "Fechar" marca como lida
- [ ] Com `prefers-reduced-motion` ligado (DevTools → Rendering), os modais aparecem sem movimento

### C. Loader de marca
Forçar o carregamento: DevTools → Network → "Slow 3G" e recarregar cada tela.
- [ ] `/app/ranking`, `/app/checkout`, `/app/gerenciar-assinatura` e `/app/upgrade` mostram o logo de linhas (7 peças entrando e saindo em loop) no lugar do spinner
- [ ] O loader não "pula" de tamanho quando o conteúdo carrega
- [ ] Spinners pequenos dentro de botões continuam girando como antes
- [ ] Com movimento reduzido, o logo aparece parado

### D. Quiz e resultado (precisa das edge functions no ar)
- [ ] `/app` → **HTML Essencial** → Primeiros passos → "O que é HTML?" abre sem erro 403
- [ ] O quiz tem 10 questões e a justificativa aparece ao confirmar a resposta
- [ ] **Aprovado (≥ 7/10):** a tela de resultado mostra score, precisão, XP e seeds **contando de 0 até o valor**, o anel se preenchendo, os cards em cascata e confete
- [ ] **Reprovado (< 7/10):** a tela "Quase lá" mostra o anel e a contagem, sem confete
- [ ] **Barra de progresso** no topo do card enche a cada questão respondida (10% por questão) e acompanha o "Questão X / 10"
- [ ] **Trocar de questão:** a pergunta entra deslizando da direita e as 4 opções aparecem em cascata, sem travar o clique
- [ ] **Selecionar uma opção** destaca a borda, o fundo e a letra (A/B/C/D). Vale também para as teclas A–D e 1–4
- [ ] **Resposta certa:** a opção dá um pulso verde e mostra um check; "Corretas" faz um pulso e sobe 1
- [ ] **Resposta errada:** a opção treme e mostra um X vermelho; "Erradas" faz um pulso e sobe 1. A resposta certa **não** é revelada (o servidor não a expõe)
- [ ] **Justificativa** abre deslizando (sem "pulo" de layout) e a distância até as opções é a mesma nos dois casos
- [ ] **Pedir dica** (precisa de 50 seeds): a confirmação e a dica também abrem deslizando
- [ ] O botão muda de "Confirmar resposta" para "Próxima questão" com troca de cor suave
- [ ] Leitor de tela (ou a árvore de acessibilidade) anuncia "Resposta correta." / "Resposta incorreta." ao confirmar
- [ ] Com `prefers-reduced-motion`, nada se move: só as cores mudam
- [ ] Refazer o quiz repete a animação
- [ ] Os valores finais batem com o que foi ganho (nenhum fica em 0 ou parado no meio)
- [ ] Lição de **revisão** (Primeiros passos, lição 3) sorteia perguntas das lições anteriores
- [ ] Lição de **desafio** abre o editor com o código inicial. A avaliação por IA depende de chave e função locais; ignore se não estiver configurada
- [ ] O progresso aparece nas barras do módulo e do submódulo

### E. Landing page `/` (use uma janela anônima)
- [ ] **Hero:** título sobe palavra por palavra, "Desenvolvimento Web" entra com o gradiente intacto, e o resto aparece em cascata
- [ ] Duas luzes difusas flutuam ao fundo e se movem levemente com a rolagem
- [ ] O print da plataforma entra inclinado em 3D e se endireita ao rolar. Com mouse, ele acompanha o cursor
- [ ] **Barra de progresso** fina no topo cresce com a rolagem
- [ ] **Cursos:** cards entram em cascata e o brilho segue o mouse. O card "Em breve" continua visível e legível
- [ ] **Metodologia:** clicar nos 3 cards troca o preview com fade, sem imagem em branco
- [ ] **Gamificação:** ao chegar no ranking, "Você" sobe da última posição ao topo e o XP conta até o valor
- [ ] **FAQ:** abre e fecha suave, a seta gira, e dá para abrir várias perguntas
- [ ] **FAQ no teclado:** Tab chega em cada pergunta, Enter/Espaço abre e fecha, e o foco fica visível
- [ ] **CTA:** o logo anima ao entrar na tela e o botão "Começar Agora" é atraído pelo cursor
- [ ] Nada fica invisível: role a página inteira devagar e depois rápido (pulando seções)
- [ ] Recarregar no meio da página não deixa seções escondidas
- [ ] Com `prefers-reduced-motion`, tudo aparece de uma vez, sem movimento e sem barra de progresso
- [ ] Em tela estreita (celular), nada estoura na horizontal e o hero não corta o título

### F. Login e registro
- [ ] Em `/auth/login` e `/auth/register`, a **logo** no topo leva para `/`
- [ ] O link **"← Voltar ao site"** logo abaixo também leva para `/`
- [ ] Os dois têm foco visível no teclado e não atrapalham o formulário em telas pequenas

### G. Redes sociais
- [ ] Rodapé (qualquer página pública): Instagram, Facebook e **LinkedIn** abrem em nova aba nos endereços corretos
- [ ] Barra lateral da área logada: os mesmos três ícones
- [ ] Com leitor de tela (ou inspecionando a árvore de acessibilidade), cada ícone tem nome ("LinkedIn da Semeando Devs (abre em nova aba)")

### H. Acessibilidade e desempenho
- [ ] Lighthouse na `/` (build de produção, janela anônima): **Acessibilidade 100**, SEO 100. Os dois itens de Boas práticas (erros de console e issues) já existiam
- [ ] LCP perto de 0,7 s e CLS = 0
- [ ] As seções têm ordem de headings sem pular (h1 → h2 → h3)
- [ ] O parágrafo de cada seção ficou com ~18px (antes 48px): confira cursos, metodologia, gamificação e FAQ
- [ ] O ranking de exemplo está legível, com a última posição levemente esmaecida

### I. Testes automatizados
- [ ] `npx ng build` sem erros
- [ ] `npx ng test --watch=false --browsers=ChromeHeadless`: **251 passam e 22 falham**. As 22 falhas já existiam antes (inclui "NewsletterModal acknowledge newsletter and close modal"). Qualquer número diferente merece investigação

## 4. Pontos em aberto

- Abrir a página de um quiz já cria uma tentativa em `user_quizzes` (sem conclusão). Recarregar várias vezes deixa tentativas vazias, e isso é comportamento do app, não da animação.
- As **22 falhas de teste** são anteriores a esta rodada e ainda não foram investigadas.
- O `border-t` do rodapé e da barra lateral segue o padrão antigo e contraria a regra de "sem bordas de 1px" do `AGENTS.md`. Não foi mexido.
- Os **erros de console** do Lighthouse na landing (build local) parecem vir de chamadas ao Supabase de produção a partir de `localhost`. Não foi investigado.
- **Divergência entre migrations e código:** `extra-material.ts` ordena por `extra_material.created_at`, mas a migration que cria a tabela não tinha essa coluna (erro `column extra_material.created_at does not exist` ao abrir uma lição). Criei `20261112200000_extra_material_created_at.sql` com `ADD COLUMN IF NOT EXISTS`, que é inofensiva se produção já tiver a coluna. Falta aplicar em produção, se ela não tiver.
- Se as escritas do app dão 403 **em produção** (e não só no local), os GRANTs precisam existir lá. Vale conferir uma vez.

## 5. Limpeza ao terminar

- Dados de teste: `supabase/dev-seed/cleanup-test-content.sql`. Para a conquista e a newsletter de teste, delete as linhas criadas na seção B.
- Desfazer os GRANTs locais: `revoke insert, update, delete on <tabelas do local-grants.sql> from authenticated;`.
- Commits sugeridos (um por tema, na ordem da tabela da seção 1): 1+2, 3, 4, 5, 6+7, 8 e 9.
