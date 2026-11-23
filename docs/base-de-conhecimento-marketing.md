# Base de Conhecimento para Marketing e Redes Sociais

Documento validado em 05/11/2026 (confirmado com o responsável pelo produto e conferido no código). É a fonte de verdade para escrever posts. Quando este arquivo divergir de outro doc em `docs/`, vale este.

Legenda: ✅ existe hoje | 🕓 planejado (não existe) | ⚠️ incerto, não afirmar em post.

## 1. O que é

O **Semeando Devs** é uma plataforma de ensino de programação com aulas curtas, quizzes, desafios de código corrigidos por IA, revisões e gamificação (XP, Seeds, ranking e conquistas). Visual escuro e neon, entre jogo e IDE.

Três perfis: **Aluno** (Free ou PRÓ), **Professor** (cria conteúdo) e **Administrador** (gestão da plataforma).

## 2. Como o aluno aprende

### Estrutura do conteúdo
- **Curso > Módulo > Lição.**
- Os **cursos são independentes**: o aluno pode começar qualquer um (HTML, CSS, JavaScript, Python...) sem ter feito outro.
- Os **módulos são sequenciais**: só abre o próximo ao concluir o anterior.
- As **lições também são sequenciais** dentro do módulo.
- O conteúdo (cursos, módulos e lições) é cadastrado no banco. Não há páginas estáticas por curso. A lista de cursos muda com o tempo.

### Tipos de lição
| Tipo | O que é | XP |
|---|---|---|
| Aula | Conteúdo em texto (Markdown, imagens), com material extra opcional, seguido de um quiz | 50 |
| Revisão | Quiz gerado automaticamente com 10 perguntas aleatórias das lições anteriores do mesmo módulo | 50 |
| Desafio | Descrição do problema em cima e editor de código embaixo. O aluno envia e a IA dá feedback | 100 |

### Quiz
- 10 perguntas de múltipla escolha, com perguntas e alternativas embaralhadas.
- Atalhos de teclado (A, B, C, D, Enter).
- Ao errar, a resposta certa é revelada com uma justificativa.
- **Aprovação fixa em 70%** (7 de 10). Reprovar só impede de avançar, e o aluno pode tentar de novo. A lição só é concluída com aprovação.
- **Dica**: custa 50 Seeds e mostra a justificativa da resposta correta.

### Desafio de código
- Descrição do desafio acima, editor Monaco (o do VS Code) abaixo, com o código inicial do professor.
- O rascunho é salvo automaticamente.
- A **IA só dá feedback**, levando em conta a descrição do problema e o código inicial. Ela **não executa testes unitários**.
- Cada envio à IA gasta **1 crédito**.

### Conclusão de curso
Tela final com a conquista do curso, o total de XP e os Seeds recebidos. Só acessível com o curso 100% concluído.

## 3. Gamificação

- **XP**: lição e revisão dão 50, desafio dá 100. Conquistas dão um valor próprio cadastrado no banco.
- **Seeds**: sempre 10% do XP ganho. Servem para comprar dicas nos quizzes. Podem ganhar outros usos no futuro.
- **Ranking**: Geral, Mensal e Semanal, com pódio e a posição do aluno logado.
- **Conquistas**: medalhas por marcos (concluir curso, etc.). As ganhas ficam coloridas e mostram a data, as demais ficam bloqueadas.
  - A lista atual vive no banco. Para posts sobre conquistas, buscar a lista atualizada no momento.
  - O **streak** (dias seguidos) existe só como regra de duas conquistas e **não é exibido** ao aluno.

## 4. Planos e preços

| | Free | PRÓ |
|---|---|---|
| Preço | R$ 0 | R$ 29,90/mês ou R$ 299,90/ano |
| Lições por dia | 5 | Ilimitadas |
| Créditos de IA (envios de desafio) por dia | 5 | 30 |
| Acesso aos cursos | Todos | Todos |
| Conteúdo exclusivo | Nenhum | Nenhum |

- **A diferença entre os planos é só de limites.** O Free não perde conteúdo.
- Os limites renovam todo dia. Os dois limites (lições e créditos de IA) renovam à meia-noite de Brasília.
- **Pagamento**: Mercado Pago, **somente cartão de crédito**. PIX ainda não está disponível.
- **Cupons** podem ser aplicados na assinatura. Cupom de 100% ativa o PRÓ direto, sem passar pelo checkout. Hoje os cupons são criados direto no banco.
- **Cancelamento**: o aluno cancela sozinho em "Gerenciar assinatura". **Não há reembolso.** Ele continua PRÓ até o fim do período já pago.
- **Anúncios** ⚠️: o Google AdSense **ainda não foi aprovado**. Não prometer anúncios no plano Free nem "sem anúncios" no PRÓ. Se for aprovado, os banners serão discretos no Free.

## 5. Parte pública (sem login)

- **Landing page** (`/`): hero, vitrine de cursos, metodologia (Teoria e Quiz, Revisão Inteligente, Desafios de Código), gamificação, FAQ e CTA de inscrição gratuita.
- **Catálogo público** (`/cursos`): lista cursos, módulos e lições. A **primeira lição de cada módulo é gratuita e aberta** (conteúdo completo, sem login). As demais mostram só uma prévia com convite para criar conta.
- **Contato** (`/support/contact`): só mostra o e-mail de suporte e um botão "Copiar e-mail". Não há formulário.
- **Termos de uso**, **cadastro**, **login** e **recuperação de senha**.
- **Cadastro**: nome, e-mail, senha e aceite dos termos (obrigatório). Receber novidades é opcional. É preciso confirmar o e-mail antes de entrar.
- **Analytics**: Google Analytics está instalado. Meta Ads (pixel) **não** está.

## 6. Professor

- Cria e organiza cursos, módulos e lições (teoria em blocos, material extra, quiz, desafio). Pode reordenar por arrastar e soltar.
- Cada lição precisa ser **validada** antes de o curso ser publicado. Cursos novos nascem "Em Revisão" (ocultos).
- A lição de Revisão é gerada pelo sistema e não é editável.

## 7. Administrador

- **Dashboard**: KPIs (total de alunos, alunos PRÓ, MRR estimado, assinaturas ativas, novos alunos e cancelamentos no período) e gráficos de cadastros, PRÓ vs Free, receita, status e ciclo das assinaturas, XP, uso de IA, Seeds e lições por curso. Filtro de 7 dias, 30 dias, 90 dias e 12 meses.
- **Lista de alunos**: nome, foto, data de cadastro e plano (Free/PRÓ), com busca, ordenação e paginação.
- **Detalhe do aluno**: aceite dos termos, se está na newsletter, progresso por curso/módulo/lição, conquistas, total de XP e total de Seeds.
- **Cupons** 🕓: a tela é só um placeholder. Os cupons são criados direto no banco. Só admins criam cupons.
- **Newsletter** 🕓: a tela é só um placeholder. O envio é feito via API, sem interface.

## 8. O que NÃO afirmar nos posts

- PIX. Não está disponível.
- "Sem anúncios" ou "com anúncios". O AdSense ainda não foi aprovado.
- Conteúdo exclusivo para assinantes. Não existe.
- Reembolso. Não existe.
- Telas de cupons e de newsletter. Não existem.
- Streak visível, desafios corrigidos por testes unitários, ou vídeos nas aulas.
- Descontos no marketplace, "acesso vitalício" e suporte prioritário. Não existem.

## 9. Textos do site corrigidos em 05/11/2026

Os textos abaixo conflitavam com a base e foram ajustados no código: FAQ da landing (preço mensal e anual, limite de 30 avaliações de IA, sem menção a anúncios, suporte prioritário ou vídeo, revisão com lições anteriores do mesmo módulo) e página de upgrade (sem "acesso vitalício", sem "descontos no marketplace", anual com "Economize 16%").

## 10. Pontos ainda em aberto

- Limite de tamanho da foto de perfil: não há validação no front, o limite depende do armazenamento.
- Existência de um e-mail de remarketing ou de churn. Os docs antigos supõem isso, não foi confirmado.
- Lista atual de conquistas e cursos: consultar o banco quando necessário.
