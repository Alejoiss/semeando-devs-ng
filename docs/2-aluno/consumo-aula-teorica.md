# Consumo de Aula Teórica

## 1. Objetivo do Fluxo
Apresentar o conteúdo didático textual e multimídia para o aluno, garantindo a progressão sequencial do conhecimento.

## 2. Público-Alvo
Alunos logados na plataforma.

## 3. Passo a Passo (Jornada do Usuário)
A página de consumo da aula teórica reside em `/app/s/:slug/ss/:slugSubmodule/lesson/:lessonId`.

1. O aluno seleciona a lição na lista do submódulo.
2. Ao acessar a rota, o componente (`lesson.ts`) verifica se o aluno tem vidas/tentativas diárias disponíveis (plano *Free*). Se sim, registra o início da aula no banco de dados (`startLesson`).
3. A interface apresenta o conteúdo teórico formatado (texto rico, *Markdown*, imagens).
4. É apresentada a lista de "Material Extra" caso o professor tenha cadastrado links de aprofundamento.
5. Ao concluir a leitura, o aluno deve clicar no botão de prosseguir.
6. O sistema verifica o banco: se a lição possuir um *Quiz* atrelado, o aluno é direcionado para a rota do Quiz. Se não possuir (apenas aula teórica pura), a lição é dada como completa, o XP é concedido e o aluno é redirecionado de volta à trilha (ou recebe o aviso de Módulo/Submódulo concluído).

## 4. Gatilhos de Marketing e Comunicação
- Nenhum específico nesta view, exceto bloqueios de *daily limit* (usuário excede limite de lições e precisa de plano PRÓ).

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Terminei de ler, clico em continuar, e a lição não consta como finalizada".
  - **Solução:** Na verdade, o botão encaminha o aluno para o quiz (passo final para concluir a lição). A lição só ganha o "check" verde após a aprovação no Quiz ou no Desafio associado.

## 6. Casos de Erro e Tratamento
- Caso ocorra falha de rede ao tentar iniciar a lição, aparece: `"Erro ao carregar a aula."`
