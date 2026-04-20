/* ==========================================================
   QUESTÃO 1
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0010000-0000-4000-9000-000000000001',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual é a função principal de criar uma pasta de projeto para o seu HTML?',
  NULL,
  NULL,
  1,
  'b0010000-0000-4000-9000-000000000001'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0010000-0000-4000-9000-000000000001',
 'Aumentar automaticamente a velocidade da internet',
 false,
 'Pasta não altera velocidade de internet.'
),
(gen_random_uuid(), 'b0010000-0000-4000-9000-000000000001',
 'Organizar arquivos e evitar confusão conforme o projeto cresce',
 true,
 'A pasta de projeto mantém arquivos organizados e evita confusão quando você adiciona imagens e novas páginas.'
),
(gen_random_uuid(), 'b0010000-0000-4000-9000-000000000001',
 'Fazer o navegador abrir o site sem precisar de URL',
 false,
 'Pasta não elimina a necessidade de endereço; ela só organiza seus arquivos.'
),
(gen_random_uuid(), 'b0010000-0000-4000-9000-000000000001',
 'Impedir que o HTML tenha erros de digitação',
 false,
 'Organizar ajuda, mas não impede erros de digitação.'
);



/* ==========================================================
   QUESTÃO 2
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0020000-0000-4000-9000-000000000002',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual nome é mais comum para a "página inicial" de um site?',
  NULL,
  NULL,
  1,
  'b0020000-0000-4000-9000-000000000002'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0020000-0000-4000-9000-000000000002',
 'main.txt',
 false,
 '.txt não é página HTML.'
),
(gen_random_uuid(), 'b0020000-0000-4000-9000-000000000002',
 'start.css',
 false,
 '.css é estilo, não página inicial.'
),
(gen_random_uuid(), 'b0020000-0000-4000-9000-000000000002',
 'index.html',
 true,
 'index.html é o nome mais comum para a página inicial de um site.'
),
(gen_random_uuid(), 'b0020000-0000-4000-9000-000000000002',
 'home.js',
 false,
 '.js é JavaScript, não página inicial.'
);



/* ==========================================================
   QUESTÃO 3
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0030000-0000-4000-9000-000000000003',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual extensão indica para o navegador que o arquivo é HTML?',
  NULL,
  NULL,
  1,
  'b0030000-0000-4000-9000-000000000003'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0030000-0000-4000-9000-000000000003',
 '.png',
 false,
 '.png é imagem.'
),
(gen_random_uuid(), 'b0030000-0000-4000-9000-000000000003',
 '.html',
 true,
 '.html indica um documento HTML.'
),
(gen_random_uuid(), 'b0030000-0000-4000-9000-000000000003',
 '.mp3',
 false,
 '.mp3 é áudio.'
),
(gen_random_uuid(), 'b0030000-0000-4000-9000-000000000003',
 '.exe',
 false,
 '.exe é executável do Windows.'
);



/* ==========================================================
   QUESTÃO 4
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0040000-0000-4000-9000-000000000004',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Por que index.html.txt costuma causar problemas?',
  NULL,
  NULL,
  1,
  'b0040000-0000-4000-9000-000000000004'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0040000-0000-4000-9000-000000000004',
 'Porque o navegador só aceita arquivos .txt',
 false,
 'O navegador aceita HTML, não “só .txt”.'
),
(gen_random_uuid(), 'b0040000-0000-4000-9000-000000000004',
 'Porque o arquivo pode ser tratado como texto comum, não como HTML',
 true,
 'Com .txt no final, o sistema e o navegador podem tratar o arquivo como texto comum, e não como HTML.'
),
(gen_random_uuid(), 'b0040000-0000-4000-9000-000000000004',
 'Porque .txt adiciona mais segurança ao HTML',
 false,
 '.txt não adiciona segurança ao HTML.'
),
(gen_random_uuid(), 'b0040000-0000-4000-9000-000000000004',
 'Porque o HTML não permite duas extensões por regra do W3C',
 false,
 'Não é uma “regra do W3C”; é comportamento de sistema/associação de arquivos.'
);



/* ==========================================================
   QUESTÃO 5
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0050000-0000-4000-9000-000000000005',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'No HTML mínimo, onde fica o conteúdo que aparece na página?',
  NULL,
  NULL,
  1,
  'b0050000-0000-4000-9000-000000000005'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0050000-0000-4000-9000-000000000005',
 'Dentro de <head>',
 false,
 'head guarda metadados e configurações.'
),
(gen_random_uuid(), 'b0050000-0000-4000-9000-000000000005',
 'Dentro de <meta>',
 false,
 'meta define informações como charset, não o conteúdo.'
),
(gen_random_uuid(), 'b0050000-0000-4000-9000-000000000005',
 'Dentro de <body>',
 true,
 'O conteúdo visível da página fica no body.'
),
(gen_random_uuid(), 'b0050000-0000-4000-9000-000000000005',
 'Dentro de <!doctype html>',
 false,
 'doctype informa o tipo de documento, não guarda conteúdo.'
);



/* ==========================================================
   QUESTÃO 6
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0060000-0000-4000-9000-000000000006',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'O que o elemento <title> controla?',
  NULL,
  NULL,
  1,
  'b0060000-0000-4000-9000-000000000006'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0060000-0000-4000-9000-000000000006',
 'O texto do título principal dentro da página',
 false,
 'O título principal da página normalmente é h1.'
),
(gen_random_uuid(), 'b0060000-0000-4000-9000-000000000006',
 'O texto que aparece na aba do navegador',
 true,
 'title define o texto exibido na aba do navegador (e usado em favoritos).'
),
(gen_random_uuid(), 'b0060000-0000-4000-9000-000000000006',
 'O idioma do site',
 false,
 'O idioma é definido por lang.'
),
(gen_random_uuid(), 'b0060000-0000-4000-9000-000000000006',
 'A cor do fundo da página',
 false,
 'Cor de fundo é com CSS.'
);



/* ==========================================================
   QUESTÃO 7
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0070000-0000-4000-9000-000000000007',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Quando você abre um arquivo HTML local no navegador, a URL geralmente começa com:',
  NULL,
  NULL,
  1,
  'b0070000-0000-4000-9000-000000000007'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0070000-0000-4000-9000-000000000007',
 'http://',
 false,
 'http:// é para acesso via servidor web.'
),
(gen_random_uuid(), 'b0070000-0000-4000-9000-000000000007',
 'https://',
 false,
 'https:// é acesso via servidor web com segurança.'
),
(gen_random_uuid(), 'b0070000-0000-4000-9000-000000000007',
 'ftp://',
 false,
 'ftp:// é um protocolo diferente, não o comum para abrir HTML local.'
),
(gen_random_uuid(), 'b0070000-0000-4000-9000-000000000007',
 'file:///',
 true,
 'Ao abrir um arquivo do computador, o navegador usa file:/// para indicar arquivo local.'
);



/* ==========================================================
   QUESTÃO 8
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0080000-0000-4000-9000-000000000008',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'O que significa o navegador "renderizar" uma página?',
  NULL,
  NULL,
  1,
  'b0080000-0000-4000-9000-000000000008'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0080000-0000-4000-9000-000000000008',
 'Apagar as tags e mostrar apenas o texto puro',
 false,
 'O navegador não “apaga” tags; ele as interpreta.'
),
(gen_random_uuid(), 'b0080000-0000-4000-9000-000000000008',
 'Interpretar o HTML e desenhar o resultado na tela',
 true,
 'Renderizar é o navegador interpretar o HTML e desenhar o resultado na tela.'
),
(gen_random_uuid(), 'b0080000-0000-4000-9000-000000000008',
 'Converter o HTML em PDF automaticamente',
 false,
 'HTML não vira PDF automaticamente.'
),
(gen_random_uuid(), 'b0080000-0000-4000-9000-000000000008',
 'Enviar o HTML para um banco de dados',
 false,
 'Banco de dados não é parte do processo de renderização.'
);



/* ==========================================================
   QUESTÃO 9
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0090000-0000-4000-9000-000000000009',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Você alterou o texto do <h1> no VS Code, salvou, mas no navegador nada mudou. Qual é a primeira ação mais comum para ver a mudança?',
  NULL,
  NULL,
  1,
  'b0090000-0000-4000-9000-000000000009'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0090000-0000-4000-9000-000000000009',
 'Reinstalar o VS Code',
 false,
 'Reinstalar não resolve o fluxo normal de edição/atualização.'
),
(gen_random_uuid(), 'b0090000-0000-4000-9000-000000000009',
 'Atualizar a página no navegador (F5 / Ctrl+R)',
 true,
 'Normalmente você precisa atualizar a página para ver alterações no arquivo local.'
),
(gen_random_uuid(), 'b0090000-0000-4000-9000-000000000009',
 'Apagar o arquivo e criar outro',
 false,
 'Não é necessário apagar o arquivo.'
),
(gen_random_uuid(), 'b0090000-0000-4000-9000-000000000009',
 'Trocar o navegador por outro sistema operacional',
 false,
 'Trocar o sistema operacional não é o caminho para ver a mudança.'
);



/* ==========================================================
   QUESTÃO 10
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'b0100000-0000-4000-9000-000000000010',
  'dc0482ac-79e6-4e94-af03-64537d444850'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Se os acentos estão aparecendo quebrados, qual item do head geralmente resolve?',
  NULL,
  NULL,
  1,
  'b0100000-0000-4000-9000-000000000010'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'b0100000-0000-4000-9000-000000000010',
 '<meta charset="utf-8">',
 true,
 '<meta charset="utf-8"> define a codificação e evita problemas com acentos.'
),
(gen_random_uuid(), 'b0100000-0000-4000-9000-000000000010',
 '<h1 charset="utf-8">',
 false,
 'h1 não define codificação.'
),
(gen_random_uuid(), 'b0100000-0000-4000-9000-000000000010',
 '<body charset="utf-8">',
 false,
 'body não define codificação.'
),
(gen_random_uuid(), 'b0100000-0000-4000-9000-000000000010',
 '<!doctype charset="utf-8">',
 false,
 'doctype não define codificação.'
);