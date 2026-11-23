# Conclusão de Curso

## 1. Objetivo do Fluxo
Recompensar visualmente o aluno por ter alcançado a linha de chegada de um curso inteiro, entregando um senso de conclusão épico e entregando os prêmios finais (Conquistas/Medalhas).

## 2. Público-Alvo
Alunos que recém finalizaram 100% de um curso.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo ocorre na rota `/app/s/:slug/finished`.

1. O aluno, após confirmar a resposta certa da última lição do curso, é automaticamente redirecionado para esta página.
2. A tela verifica no backend se de fato o curso foi 100% concluído (para evitar que curiosos acessem a rota via URL). Se não estiver completo, o usuário é chutado de volta para a Dashboard.
3. Estando completo, a tela exibe a **Conquista** (Medalha) atrelada àquele curso.
4. É exibido o total de XP e a quantia extra de Seeds recebidos pela conclusão.
5. O aluno clica no botão "Voltar para o Início" para retornar à Dashboard de cursos e iniciar a próxima aventura.

## 4. Gatilhos de Marketing e Comunicação
- A tela final é um excelente momento para incentivar o compartilhamento em redes sociais (LinkedIn, Twitter): "Olhe a medalha que acabei de ganhar na Semeando Devs!".

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Terminei tudo mas não fui pra tela final".
  - **Solução:** O curso só é concluído quando todas as lições estão concluídas. Cada lição só é concluída após aprovação no quiz (70% ou mais) ou após o envio do desafio.

## 6. Casos de Erro e Tratamento
- Acesso indevido pela URL bloqueado pela lógica do componente.
