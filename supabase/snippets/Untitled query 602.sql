-- ===========================================
-- section_content (Questão 10)
-- ===========================================
INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual opção é um exemplo de uso típico de HTML?',
  NULL,
  NULL,
  1,
  'dedd3b41-d6cb-4f84-8240-c946e3cd5888'
);


-- ===========================================
-- answers (Questão 10)
-- ===========================================

-- A) Incorreta
INSERT INTO answers (id, question_id, text, is_correct, reason)
VALUES (
  gen_random_uuid(),
  'dedd3b41-d6cb-4f84-8240-c946e3cd5888',
  'Escrever algoritmos para calcular impostos no servidor',
  false,
  'Cálculos e regras de negócio no servidor normalmente são feitos com linguagens como Java, Python, C# etc.'
);

-- B) Incorreta
INSERT INTO answers (id, question_id, text, is_correct, reason)
VALUES (
  gen_random_uuid(),
  'dedd3b41-d6cb-4f84-8240-c946e3cd5888',
  'Configurar roteadores e redes',
  false,
  'Redes e roteadores não são configurados com HTML.'
);

-- C) Correta
INSERT INTO answers (id, question_id, text, is_correct, reason)
VALUES (
  gen_random_uuid(),
  'dedd3b41-d6cb-4f84-8240-c946e3cd5888',
  'Estruturar uma página com título, parágrafos e lista de itens',
  true,
  'Estruturar conteúdo com título, parágrafos e listas é exatamente um uso típico de HTML.'
);

-- D) Incorreta
INSERT INTO answers (id, question_id, text, is_correct, reason)
VALUES (
  gen_random_uuid(),
  'dedd3b41-d6cb-4f84-8240-c946e3cd5888',
  'Criar um arquivo de planilha com fórmulas',
  false,
  'Planilhas são outro tipo de arquivo e ferramenta, não HTML.'
);