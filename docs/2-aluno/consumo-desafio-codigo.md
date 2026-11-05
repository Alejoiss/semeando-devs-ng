# Consumo de Desafio de Código

## 1. Objetivo do Fluxo
Promover o aprendizado ativo. O aluno ganha um editor de código interativo no navegador e deve resolver um problema técnico para progredir.

## 2. Público-Alvo
Alunos logados na plataforma.

## 3. Passo a Passo (Jornada do Usuário)
A interface (`challenge.ts`) fica em `.../lesson/:lessonId/challenge`.

1. A tela mostra a descrição do desafio no topo (texto formatado) e, abaixo, o Editor de Código (*VS Code / Monaco Editor* web).
2. O código inicial pré-cadastrado pelo professor é exibido. (Qualquer digitação é salva em rascunho automaticamente).
3. O aluno resolve o exercício e clica em **"Enviar Resolução"**.
4. O envio gasta 1 crédito de IA do dia (5 no plano Free, 30 no PRÓ; renovam diariamente).
5. A IA retorna um feedback sobre o código enviado, considerando a descrição do problema e o código inicial. Ela não executa testes unitários. O desafio concede 100 XP (e 10 Seeds).
6. O aluno clica em **"Continuar"** e é levado de volta para a trilha.

## 4. Gatilhos de Marketing e Comunicação
- **Consumo de Créditos de IA:** Ferramentas de correção usam processamento. O plano Free tem 5 envios por dia e o PRÓ tem 30. Ao zerar os créditos, o aluno espera a renovação diária.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "O código tá certo mas a IA apontou problemas".
  - **Solução:** O retorno é um feedback de IA, não um teste automático. Orientar o aluno a reler o enunciado e o código inicial e a ajustar a resolução conforme as observações.

## 6. Casos de Erro e Tratamento
- Em caso de *timeout* ao rodar o teste de inteligência artificial ou de código, exibe um balão *Toast* vermelho (também usado quando os créditos acabam): `"Erro ao avaliar o desafio."`
