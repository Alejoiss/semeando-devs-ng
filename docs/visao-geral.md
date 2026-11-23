# Visão Geral do Projeto: Semeando Devs

## 1. O que é o Semeando Devs?
O **Semeando Devs** é uma plataforma educacional (LMS - *Learning Management System*) voltada para o ensino de tecnologia e programação de forma interativa e gamificada. 

Ao contrário de plataformas tradicionais focadas apenas em vídeos longos, o Semeando Devs foca na aprendizagem ativa e contínua, combinando conteúdos textuais, testes de múltipla escolha (quizzes) e desafios práticos onde o aluno escreve código diretamente no navegador. 

A plataforma foi desenhada com uma interface "Luminescent" (neon e dark mode), lembrando um misto de jogo e IDE de desenvolvimento moderno, visando engajar o aluno diariamente através de métricas de evolução, sistema de pontuação e ranking.

## 2. Personas (Perfis de Acesso)
A plataforma atende a três perfis distintos, cada um com sua própria jornada e permissões:

- **Aluno:** Consome o conteúdo, ganha XP, acumula sementes (*Seeds*), concorre no ranking e faz gestão da sua assinatura (Gratuita ou PRÓ).
- **Professor:** Cria e estrutura o conteúdo didático (Cursos, Módulos, Lições, Material Extra e Desafios de Código).
- **Administrador:** Gerencia a saúde da plataforma, visualiza relatórios, gerencia usuários, acompanha alunos e assinaturas. As telas de cupons e newsletter ainda são placeholders: cupons são criados no banco e a newsletter é enviada via API.

## 3. Principais Features (Funcionalidades)

### 3.1. Motor de Gamificação
- **Sistema de Pontuação (XP e Seeds):** Alunos ganham experiência (XP) ao completarem lições, o que dita suas posições no ranking. Sempre que ganham XP, ganham também *Seeds* (moeda virtual) equivalentes a 10% desse XP. Os Seeds podem ser gastos (50 por vez) para obter dicas (*Hints*) nos quizzes.
- **Rankings (Geral, Mensal e Semanal):** Uma tabela de classificação global e temporal para promover a competição amigável.
- **Conquistas (Medalhas/Badges):** Um sistema de recompensas visuais entregues quando o aluno atinge marcos específicos (ex: completar um curso ou manter dias seguidos de estudo). O streak (dias seguidos) não é exibido ao aluno, serve apenas para duas conquistas..

### 3.2. Aprendizagem Ativa e Desafios
- **Cursos independentes, módulos sequenciais:** O aluno pode iniciar qualquer curso sem ter feito outro. Dentro de um curso, um módulo só é liberado quando o anterior é finalizado, simulando fases de um jogo.
- **Quizzes Dinâmicos:** Testes de múltipla escolha para validar a absorção imediata do conhecimento teórico, com embaralhamento automático e feedback explicativo.
- **Editor de Código no Navegador:** Uma IDE embutida (*Monaco/VS Code web*) onde o aluno tenta resolver problemas. A submissão recebe feedback de uma Inteligência Artificial, que considera a descrição do problema e o código inicial. A IA não executa testes unitários. Cada envio gasta 1 crédito de IA.

### 3.3. Painel do Criador (Professor)
- **Gestão Hierárquica de Conteúdo:** Estruturação em `Curso > Módulo > Lição`.
- **Drag & Drop (Reordenação):** A interface permite arrastar e soltar módulos e lições para reordená-los facilmente, recalculando automaticamente os vínculos.
- **Rich Text & Markdown:** Professores podem escrever aulas teóricas ricas e cadastrar materiais de apoio associados a cada aula.

### 3.4. Monetização e Gestão (Admin / Aluno)
- **Paywall e Limites (Freemium):** O plano gratuito (*Free*) permite concluir 5 lições por dia e enviar 5 códigos por dia à IA. O PRÓ tem lições ilimitadas e 30 envios por dia. Não há conteúdo exclusivo, a diferença é só de limites.
- **Integração de Pagamento (Mercado Pago):** Fluxo de Checkout via Cartão de Crédito (PIX ainda não está disponível) para converter alunos gratuitos em assinantes do plano PRÓ (R$ 29,90/mês ou R$ 299,90/ano).
- **Sistema de Cupons:** Apenas administradores criam cupons (percentual ou valor fixo, incluindo 100%). Hoje isso é feito direto no banco, a tela de cadastro ainda não existe.
- **Gestão de Perfil e Assinatura:** O aluno tem autonomia para atualizar sua senha, foto, cancelar a assinatura ou acompanhar as próximas datas de faturamento. Não há reembolso: após cancelar, o aluno segue PRÓ até o fim do período pago.

## 4. Tecnologias Core
- **Frontend:** Angular 20+ (Standalone Components, Signals, Control Flow) e Tailwind CSS (Design Utility-first sem componentes pré-moldados pesados).
- **Backend/Database:** Supabase (PostgreSQL para dados, Storage para arquivos, Edge Functions para lógicas isoladas seguras como correção via IA e integração financeira, além de *Row Level Security* (RLS) pesada para permissões).
