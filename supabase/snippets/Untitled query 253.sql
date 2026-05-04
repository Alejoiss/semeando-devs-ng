/* ==========================================================
   QUESTÃO 1
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0010000-0000-4000-b000-000000000001',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'O que significa a sigla HTML?',
  NULL,
  NULL,
  1,
  'd0010000-0000-4000-b000-000000000001'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0010000-0000-4000-b000-000000000001',
 'High Tech Modern Language',
 false,
 'Errado — não existe esse significado para HTML.'
),
(gen_random_uuid(), 'd0010000-0000-4000-b000-000000000001',
 'HyperText Markup Language',
 true,
 'Correto — HTML significa HyperText Markup Language (Linguagem de Marcação de Hipertexto).'
),
(gen_random_uuid(), 'd0010000-0000-4000-b000-000000000001',
 'HyperText Machine Learning',
 false,
 'Errado — Machine Learning é um conceito de inteligência artificial, sem relação com HTML.'
),
(gen_random_uuid(), 'd0010000-0000-4000-b000-000000000001',
 'High Text Modeling Language',
 false,
 'Errado — não existe esse significado para HTML.'
);



/* ==========================================================
   QUESTÃO 2
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0020000-0000-4000-b000-000000000002',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual a melhor definição para o HTML?',
  NULL,
  NULL,
  1,
  'd0020000-0000-4000-b000-000000000002'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0020000-0000-4000-b000-000000000002',
 'Uma linguagem de programação usada para criar animações',
 false,
 'Errado — animações são feitas principalmente com CSS e JavaScript; HTML não executa lógica.'
),
(gen_random_uuid(), 'd0020000-0000-4000-b000-000000000002',
 'Um banco de dados para armazenar informações de sites',
 false,
 'Errado — HTML não armazena dados; bancos de dados são ferramentas completamente diferentes.'
),
(gen_random_uuid(), 'd0020000-0000-4000-b000-000000000002',
 'Uma linguagem de marcação que define a estrutura de páginas web',
 true,
 'Correto — HTML é uma linguagem de marcação (não de programação) que estrutura o conteúdo de páginas web.'
),
(gen_random_uuid(), 'd0020000-0000-4000-b000-000000000002',
 'Um programa usado para editar imagens na internet',
 false,
 'Errado — edição de imagens é feita com softwares como Photoshop ou Figma, sem relação com HTML.'
);



/* ==========================================================
   QUESTÃO 3
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0030000-0000-4000-b000-000000000003',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Na analogia da casa, o HTML representa:',
  NULL,
  NULL,
  1,
  'd0030000-0000-4000-b000-000000000003'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0030000-0000-4000-b000-000000000003',
 'A decoração e a pintura das paredes',
 false,
 'Errado — decoração e pintura representam o CSS.'
),
(gen_random_uuid(), 'd0030000-0000-4000-b000-000000000003',
 'A eletricidade e a automação',
 false,
 'Errado — eletricidade e automação representam o JavaScript.'
),
(gen_random_uuid(), 'd0030000-0000-4000-b000-000000000003',
 'Os móveis e os tapetes',
 false,
 'Errado — móveis e tapetes também se aproximam mais do CSS (aspecto visual).'
),
(gen_random_uuid(), 'd0030000-0000-4000-b000-000000000003',
 'A estrutura: paredes, teto e janelas',
 true,
 'Correto — o HTML é a estrutura da casa, assim como paredes, teto e janelas formam a base física de uma construção.'
);



/* ==========================================================
   QUESTÃO 4
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0040000-0000-4000-b000-000000000004',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'HTML é uma linguagem de programação?',
  NULL,
  NULL,
  1,
  'd0040000-0000-4000-b000-000000000004'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0040000-0000-4000-b000-000000000004',
 'Sim, porque roda no navegador',
 false,
 'Errado — rodar no navegador não define o que é uma linguagem de programação.'
),
(gen_random_uuid(), 'd0040000-0000-4000-b000-000000000004',
 'Sim, porque tem tags e regras',
 false,
 'Errado — ter regras e sintaxe não torna algo uma linguagem de programação.'
),
(gen_random_uuid(), 'd0040000-0000-4000-b000-000000000004',
 'Não, porque é uma linguagem de marcação e não executa lógica',
 true,
 'Correto — HTML é uma linguagem de marcação. Ele descreve estrutura, mas não executa lógica, cálculos ou decisões.'
),
(gen_random_uuid(), 'd0040000-0000-4000-b000-000000000004',
 'Não, porque só funciona no Windows',
 false,
 'Errado — HTML funciona em qualquer sistema operacional; essa não é a razão da resposta.'
);



/* ==========================================================
   QUESTÃO 5
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0050000-0000-4000-b000-000000000005',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual foi a versão do HTML lançada oficialmente em 2014 e usada até hoje?',
  NULL,
  NULL,
  1,
  'd0050000-0000-4000-b000-000000000005'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0050000-0000-4000-b000-000000000005',
 'HTML 3',
 false,
 'Errado — HTML 3 foi lançado na década de 1990.'
),
(gen_random_uuid(), 'd0050000-0000-4000-b000-000000000005',
 'HTML 4',
 false,
 'Errado — HTML 4.0 foi lançado em 1997.'
),
(gen_random_uuid(), 'd0050000-0000-4000-b000-000000000005',
 'HTML 4.5',
 false,
 'Errado — não existe uma versão chamada HTML 4.5.'
),
(gen_random_uuid(), 'd0050000-0000-4000-b000-000000000005',
 'HTML 5',
 true,
 'Correto — o HTML5 foi oficialmente lançado em 2014 e é a versão padrão usada atualmente.'
);



/* ==========================================================
   QUESTÃO 6
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0060000-0000-4000-b000-000000000006',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual tecnologia é responsável pelo visual (cores, fontes e espaçamentos) de uma página web?',
  NULL,
  NULL,
  1,
  'd0060000-0000-4000-b000-000000000006'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0060000-0000-4000-b000-000000000006',
 'HTML',
 false,
 'Errado — HTML define a estrutura do conteúdo, não o visual.'
),
(gen_random_uuid(), 'd0060000-0000-4000-b000-000000000006',
 'CSS',
 true,
 'Correto — CSS (Cascading Style Sheets) é responsável pelo estilo visual da página.'
),
(gen_random_uuid(), 'd0060000-0000-4000-b000-000000000006',
 'JavaScript',
 false,
 'Errado — JavaScript cuida do comportamento e interatividade.'
),
(gen_random_uuid(), 'd0060000-0000-4000-b000-000000000006',
 'HTTP',
 false,
 'Errado — HTTP é um protocolo de comunicação da web, não uma linguagem de estilo.'
);



/* ==========================================================
   QUESTÃO 7
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0070000-0000-4000-b000-000000000007',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Quem criou o HTML e em que ano?',
  NULL,
  NULL,
  1,
  'd0070000-0000-4000-b000-000000000007'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0070000-0000-4000-b000-000000000007',
 'Bill Gates, em 1995',
 false,
 'Errado — Bill Gates foi cofundador da Microsoft, não criador do HTML.'
),
(gen_random_uuid(), 'd0070000-0000-4000-b000-000000000007',
 'Steve Jobs, em 1990',
 false,
 'Errado — Steve Jobs foi cofundador da Apple; não tem relação com a criação do HTML.'
),
(gen_random_uuid(), 'd0070000-0000-4000-b000-000000000007',
 'Tim Berners-Lee, em 1991',
 true,
 'Correto — Tim Berners-Lee criou o HTML em 1991 enquanto trabalhava no CERN.'
),
(gen_random_uuid(), 'd0070000-0000-4000-b000-000000000007',
 'Mark Zuckerberg, em 2004',
 false,
 'Errado — Mark Zuckerberg criou o Facebook em 2004, sem relação com o HTML.'
);



/* ==========================================================
   QUESTÃO 8
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0080000-0000-4000-b000-000000000008',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'O que são as tags no HTML?',
  NULL,
  NULL,
  1,
  'd0080000-0000-4000-b000-000000000008'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0080000-0000-4000-b000-000000000008',
 'Erros de código que precisam ser corrigidos',
 false,
 'Errado — tags não são erros; são a base de funcionamento do HTML.'
),
(gen_random_uuid(), 'd0080000-0000-4000-b000-000000000008',
 'Arquivos de imagem usados nas páginas',
 false,
 'Errado — imagens são inseridas por meio de uma tag (<img>), mas as tags em si não são imagens.'
),
(gen_random_uuid(), 'd0080000-0000-4000-b000-000000000008',
 'Etiquetas que marcam e identificam partes do conteúdo para o navegador',
 true,
 'Correto — tags são etiquetas que dizem ao navegador como interpretar cada pedaço de conteúdo.'
),
(gen_random_uuid(), 'd0080000-0000-4000-b000-000000000008',
 'Comandos de programação que executam ações',
 false,
 'Errado — comandos que executam ações pertencem ao JavaScript, não ao HTML.'
);



/* ==========================================================
   QUESTÃO 9
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0090000-0000-4000-b000-000000000009',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Qual é a função do JavaScript no trio HTML, CSS e JS?',
  NULL,
  NULL,
  1,
  'd0090000-0000-4000-b000-000000000009'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0090000-0000-4000-b000-000000000009',
 'Definir a estrutura e o conteúdo da página',
 false,
 'Errado — estrutura e conteúdo são responsabilidade do HTML.'
),
(gen_random_uuid(), 'd0090000-0000-4000-b000-000000000009',
 'Controlar as cores e os tamanhos dos elementos',
 false,
 'Errado — cores e tamanhos são responsabilidade do CSS.'
),
(gen_random_uuid(), 'd0090000-0000-4000-b000-000000000009',
 'Fazer a página se comunicar com outros sites',
 false,
 'Errado — comunicação entre sites envolve protocolos como HTTP/HTTPS e APIs, não apenas o JavaScript por si só.'
),
(gen_random_uuid(), 'd0090000-0000-4000-b000-000000000009',
 'Adicionar comportamento e interatividade à página',
 true,
 'Correto — JavaScript é o "cérebro" da página: ele adiciona interatividade, reage a cliques, anima elementos e muito mais.'
);



/* ==========================================================
   QUESTÃO 10
   ========================================================== */

INSERT INTO questions (id, quiz_id)
VALUES (
  'd0100000-0000-4000-b000-000000000010',
  'd92db71b-920f-43fe-8ae8-ce8ef0f4297c'
);

INSERT INTO section_content (id, lesson_id, type, content, file, file_description, "order", question_id)
VALUES (
  gen_random_uuid(),
  NULL,
  'TEXT',
  'Por que é importante aprender HTML antes de CSS e JavaScript?',
  NULL,
  NULL,
  1,
  'd0100000-0000-4000-b000-000000000010'
);

INSERT INTO answers (id, question_id, text, is_correct, reason) VALUES
(gen_random_uuid(), 'd0100000-0000-4000-b000-000000000010',
 'Porque o HTML é mais difícil e precisa ser estudado primeiro',
 false,
 'Errado — o HTML não é necessariamente mais difícil; a ordem de aprendizado é por dependência, não por complexidade.'
),
(gen_random_uuid(), 'd0100000-0000-4000-b000-000000000010',
 'Porque o HTML é a base da estrutura da página; sem ele, não há o que estilizar ou tornar interativo',
 true,
 'Correto — o HTML é a fundação. Você precisa ter estrutura antes de aplicar estilo (CSS) ou comportamento (JavaScript).'
),
(gen_random_uuid(), 'd0100000-0000-4000-b000-000000000010',
 'Porque o HTML substitui o CSS e o JavaScript em páginas simples',
 false,
 'Errado — HTML não substitui CSS ou JS; cada um tem seu papel específico e insubstituível.'
),
(gen_random_uuid(), 'd0100000-0000-4000-b000-000000000010',
 'Porque os navegadores modernos só leem HTML',
 false,
 'Errado — navegadores modernos interpretam HTML, CSS e JavaScript em conjunto.'
);