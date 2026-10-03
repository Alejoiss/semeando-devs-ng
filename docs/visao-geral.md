# Visão Geral do Projeto: Semeando Devs

## 1. O que é o Semeando Devs?
O **Semeando Devs** é uma plataforma educacional (LMS - *Learning Management System*) voltada para o ensino de tecnologia e programação de forma interativa e gamificada. 

Ao contrário de plataformas tradicionais focadas apenas em vídeos longos, o Semeando Devs foca na aprendizagem ativa e contínua, combinando conteúdos textuais, testes de múltipla escolha (quizzes) e desafios práticos onde o aluno escreve código diretamente no navegador. 

A plataforma foi desenhada com uma interface "Luminescent" (neon e dark mode), lembrando um misto de jogo e IDE de desenvolvimento moderno, visando engajar o aluno diariamente através de métricas de evolução, sistema de pontuação e ranking.

## 2. Personas (Perfis de Acesso)
A plataforma atende a três perfis distintos, cada um com sua própria jornada e permissões:

- **Aluno:** Consome o conteúdo, ganha XP, acumula sementes (*Seeds*), concorre no ranking e faz gestão da sua assinatura (Gratuita ou PRÓ).
- **Professor:** Cria e estrutura o conteúdo didático (Módulos, Submódulos, Lições, Material Extra e Desafios de Código).
- **Administrador:** Gerencia a saúde da plataforma, visualiza relatórios, gerencia usuários, aprova cupons de desconto e dispara comunicações (Newsletter).

## 3. Principais Features (Funcionalidades)

### 3.1. Motor de Gamificação
- **Sistema de Pontuação (XP e Seeds):** Alunos ganham experiência (XP) ao completarem lições, o que dita suas posições no ranking. Ocasionalmente, ganham *Seeds* (moedas virtuais) que podem ser gastas para obter dicas (*Hints*) durante quizzes difíceis.
- **Rankings (Geral, Mensal e Semanal):** Uma tabela de classificação global e temporal para promover a competição amigável.
- **Conquistas (Medalhas/Badges):** Um sistema de recompensas visuais entregues quando o aluno atinge marcos específicos (ex: completar um módulo, atingir 10 dias seguidos de ofensiva, etc.).

### 3.2. Aprendizagem Ativa e Desafios
- **Módulos Lineares:** A arquitetura do curso exige que o aluno avance cronologicamente. Um submódulo só é liberado quando o anterior é finalizado, simulando fases de um jogo.
- **Quizzes Dinâmicos:** Testes de múltipla escolha para validar a absorção imediata do conhecimento teórico, com embaralhamento automático e feedback explicativo.
- **Editor de Código no Navegador:** Uma IDE embutida (*Monaco/VS Code web*) onde o aluno tenta resolver problemas. A submissão é corrigida e avaliada usando ferramentas modernas (Testes Unitários ou Inteligência Artificial), gerando feedback instantâneo.

### 3.3. Painel do Criador (Professor)
- **Gestão Hierárquica de Conteúdo:** Estruturação em `Módulo > Submódulo > Lição`.
- **Drag & Drop (Reordenação):** A interface permite arrastar e soltar submódulos e lições para reordená-los facilmente, recalculando automaticamente os vínculos.
- **Rich Text & Markdown:** Professores podem escrever aulas teóricas ricas e cadastrar materiais de apoio associados a cada aula.

### 3.4. Monetização e Gestão (Admin / Aluno)
- **Paywall e Limites (Freemium):** Usuários do plano gratuito (*Free*) possuem limites diários de consumo de lições e desafios.
- **Integração de Pagamento (Mercado Pago):** Fluxo nativo de Checkout (via Cartão de Crédito e PIX) para converter alunos gratuitos em assinantes do plano PRÓ.
- **Sistema de Cupons:** Professores e Admins podem criar campanhas promocionais de percentual ou valor fixo (incluindo descontos de 100%).
- **Gestão de Perfil e Assinatura:** O aluno tem autonomia para atualizar sua senha, foto, cancelar a assinatura ou acompanhar as próximas datas de faturamento.

## 4. Tecnologias Core
- **Frontend:** Angular 20+ (Standalone Components, Signals, Control Flow) e Tailwind CSS (Design Utility-first sem componentes pré-moldados pesados).
- **Backend/Database:** Supabase (PostgreSQL para dados, Storage para arquivos, Edge Functions para lógicas isoladas seguras como correção via IA e integração financeira, além de *Row Level Security* (RLS) pesada para permissões).
