# Tarefas de Documentação de Fluxos

Este documento lista todas as tarefas necessárias para mapear e documentar os fluxos e funcionalidades da plataforma Semeando Devs. O foco desta documentação é facilitar o trabalho e consulta das equipes de marketing e suporte.

Consulte o [Guideline de Documentação](guideline.md) para entender o padrão preenchido em cada arquivo.

## 1. Fluxos Públicos e de Autenticação (`/docs/1-publico-e-autenticacao/`)
- [x] [Fluxo de Login](1-publico-e-autenticacao/login.md): Como o usuário acessa a plataforma (`/auth/login`).
- [x] [Fluxo de Cadastro](1-publico-e-autenticacao/cadastro.md): Como um novo usuário cria sua conta (`/auth/register`).
- [x] [Fluxo de Recuperação de Senha](1-publico-e-autenticacao/recuperacao-senha.md): Como o usuário solicita e redefine uma senha esquecida (`/recuperar-senha`, `/redefinir-senha`).
- [x] [Páginas Institucionais](1-publico-e-autenticacao/paginas-institucionais.md): Visão geral das páginas públicas (Landing Page, Lista de Cursos, Contato, Termos de Uso).

## 2. Fluxos do Aluno (`/docs/2-aluno/`)
- [x] [Navegação de Módulos](2-aluno/navegacao-modulos.md): Como o aluno visualiza e navega pela trilha de módulos e submódulos.
- [x] [Consumo de Aula Teórica](2-aluno/consumo-aula-teorica.md): O fluxo de leitura de conteúdo, marcação de conclusão e avanço.
- [x] [Consumo de Quiz](2-aluno/consumo-quiz.md): A experiência do aluno ao responder testes de múltipla escolha.
- [x] [Consumo de Desafio de Código](2-aluno/consumo-desafio-codigo.md): O fluxo do editor de código embutido e validação das respostas via IA/Testes.
- [x] [Conclusão de Módulo](2-aluno/conclusao-modulo.md): O que acontece e qual é a tela final ao concluir todas as etapas de um módulo (`/app/s/:slug/finished`).
- [x] [Gamificação - Ranking](2-aluno/gamificacao-ranking.md): Como funciona a página de ranking e distribuição de pontos.
- [x] [Gamificação - Conquistas](2-aluno/gamificacao-conquistas.md): Como o aluno ganha e visualiza suas medalhas/conquistas.
- [x] [Gestão de Perfil](2-aluno/gestao-perfil.md): Como o aluno altera dados pessoais, foto, etc.
- [x] [Fluxo de Assinatura (Checkout)](2-aluno/assinatura-checkout.md): Como o aluno faz o upgrade para a versão PRÓ e realiza o pagamento.
- [x] [Gestão de Assinatura](2-aluno/gestao-assinatura.md): Como o aluno visualiza seu plano ativo, status de pagamento e cancelamento.

## 3. Fluxos do Professor (`/docs/3-professor/`)
- [x] [Painel do Professor](3-professor/painel-professor.md): Visão geral dos módulos pertencentes ao professor.
- [x] [Gestão de Módulos](3-professor/gestao-modulos.md): Fluxo completo para criar e editar módulos.
- [x] [Gestão de Submódulos](3-professor/gestao-submodulos.md): Fluxo para adicionar submódulos em um módulo existente.
- [x] [Gestão de Lições](3-professor/gestao-licoes.md): Fluxo para inserir aulas, quizzes e desafios dentro dos submódulos.

## 4. Fluxos Administrativos (`/docs/4-admin/`)
- [x] [Dashboard Admin](4-admin/dashboard-admin.md): O que é exibido no painel de controle principal para administradores.
- [x] [Gestão de Alunos](4-admin/gestao-alunos.md): Como listar todos os alunos cadastrados e visualizar os detalhes individuais (progresso, dados).
- [x] [Gestão de Cupons](4-admin/gestao-cupons.md): Como cadastrar, editar e gerenciar cupons de desconto para a assinatura PRÓ.
- [x] [Newsletter](4-admin/newsletter.md): Como funciona a criação e o disparo de newsletters para a base de usuários.
