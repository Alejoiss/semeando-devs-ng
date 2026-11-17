# Gestão de Cupons

## 1. Objetivo do Fluxo
Permitir que a equipe administrativa consulte, crie e ajuste cupons de desconto promocionais para incentivar assinaturas do plano PRÓ da plataforma.

## 2. Público-Alvo
Administradores da plataforma (Equipes de Marketing, Vendas e Suporte).

## 3. Passo a Passo (Jornada do Usuário)
1. O administrador acessa a página de Cupons (`/admin/cadastro-de-cupons`).
2. A listagem mostra 20 cupons por página, com busca por código, filtros por tipo de desconto e tipo de plano, e ordenação (padrão: mais recentes primeiro) por desconto, limite de usos, usos, expiração e criação.
3. Ao clicar em um cupom, abre uma modal para alterar somente o **limite de usos** e a **data de expiração**.
4. O botão **Novo cupom** leva ao formulário (`/admin/cadastro-de-cupons/novo`), com campos agrupados em Identificação, Desconto e Validade/elegibilidade. O código é sempre salvo em maiúsculas.
5. **Salvar** cria um cupom. **Salvar vários** abre uma modal para informar uma lista (ex.: `[123, 456, 789]`); cada valor é concatenado ao código (`SEMEANDODEVS123`, ...), repetindo os demais campos. A criação é atômica (máximo de 100 por vez).
6. Após salvar, o admin é redirecionado para a listagem.

## 4. Gatilhos de Marketing e Comunicação
- *[Futuro]*: A base de cupons criada aqui será o motor para campanhas de e-mail marketing (ex: cupons de Black Friday, cupons de reativação de alunos inativos).

## 5. Dúvidas Frequentes e Suporte
- N/A.

## 6. Casos de Erro e Tratamento
- Código já existente: a criação é cancelada por completo e o admin é avisado do código duplicado.
