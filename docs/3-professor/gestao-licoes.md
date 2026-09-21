# Gestão de Lições

## 1. Objetivo do Fluxo
Fornecer um ambiente altamente segmentado (*tabs*) para a construção didática de uma Lição ou Desafio. É aqui que o professor redige os textos, quizzes e laboratórios de programação.

## 2. Público-Alvo
Professores e Administradores.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo ocorre na rota `/professor/editar-licao/:id`.

Ao abrir o painel de edição, o professor interage com 4 abas independentes de contexto:
1. **Aba de Conteúdo (Teoria):** Interface para criar blocos empilháveis (*Markdown*, textos com estilo, imagens descritivas e trechos estáticos de código formatado).
2. **Aba de Material Extra:** Local para cadastrar links de leitura complementar, documentação externa (`MDN`, etc) e artigos úteis para aprofundamento.
3. **Aba de Quiz:** Um gerador de múltiplas escolhas. O professor cria os enunciados e define os botões das alternativas, marcando explicitamente qual delas é a verdadeira (gabarito).
4. **Aba de Código (Exclusiva para `Desafios`):** Um ambiente técnico onde o professor define as instruções de código (o que deve ser resolvido), o *código inicial* que será apresentado ao aluno, e a suíte de testes (validação) que rodará por baixo dos panos para verificar se a solução do aluno está certa.

*(Nota Arquitetural: Lições do tipo REVISION não podem ser abertas neste editor. Como são construídas sistematicamente com base em quizzes anteriores, o sistema redireciona o professor de volta ao painel de submódulo se tentar abri-la à força).*

## 4. Gatilhos de Marketing e Comunicação
- N/A.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Tentei abrir a lição de Revisão para alterar uma questão, mas fui redirecionado de volta".
  - **Solução:** O sistema não permite edição manual do esqueleto estrutural da revisão. Para alterar uma pergunta que aparece nela, o professor deve editar a *lição original* de onde aquela pergunta nasceu.

## 6. Casos de Erro e Tratamento
- Cada aba efetua salvamentos modulares. Em caso de falha de conexão, as operações (*promises*) falharão e o usuário será avisado na interface do componente respectivo para retentar.
