# Consumo de Desafio de Código

## 1. Objetivo do Fluxo
Promover o aprendizado ativo. O aluno ganha um editor de código interativo no navegador e deve resolver um problema técnico para progredir.

## 2. Público-Alvo
Alunos logados na plataforma.

## 3. Passo a Passo (Jornada do Usuário)
A interface (`challenge.ts`) fica em `.../lesson/:lessonId/challenge`.

1. A tela carrega dividida: lado esquerdo com instruções (texto formatado) e lado direito com o Editor de Código (*VS Code / Monaco Editor* web).
2. O código inicial pré-cadastrado pelo professor é exibido. (Qualquer digitação é salva em rascunho automaticamente).
3. O aluno resolve o exercício e clica em **"Enviar Resolução"**.
4. A API consome créditos de IA (ou valida via testes unitários).
5. Retorna o feedback do professor virtual (AI Feedback) analisando o código, XP ganho, e exibe o estado de "Passou".
6. O aluno clica em **"Continuar"** e é levado de volta para a trilha.

## 4. Gatilhos de Marketing e Comunicação
- **Consumo de Créditos de IA:** Ferramentas de correção usam processamento. Em planos *Free*, os testes podem ser limitados por dia.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "O código tá certo mas dá erro".
  - **Solução:** Alertar o aluno a ler perfeitamente o enunciado (nome de variáveis) pois as validações são estritas.

## 6. Casos de Erro e Tratamento
- Em caso de *timeout* ao rodar o teste de inteligência artificial ou de código, exibe um balão *Toast* vermelho: `"Erro ao avaliar o desafio."`
