-- Conteúdo de TESTE para o banco LOCAL (gerado automaticamente). Idempotente: pode ser executado várias vezes.
-- Remoção: supabase/dev-seed/cleanup-test-content.sql
begin;
insert into public.modules (id, title, description, icon, slug, in_revision, created_by) values ('11ba5020-4323-5483-9824-1410497398fa', 'HTML Essencial', 'Aprenda a estruturar páginas web do zero com HTML semântico, links, imagens e formulários.', 'html', 'html-essencial', false, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba') on conflict (id) do nothing;
insert into public.teacher_modules (id, teacher_id, module_id, assigned_by) values ('c162208c-c719-5b56-8869-74729d94eda5', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', '11ba5020-4323-5483-9824-1410497398fa', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba') on conflict (id) do nothing;
insert into public.section_content (id, module_id, type, content, "order") values ('2151ad97-519f-5afe-8dd2-c5da4d6dabef', '11ba5020-4323-5483-9824-1410497398fa', 'MARKDOWN', '# Bem-vindo ao HTML Essencial

Neste módulo você vai construir a base de qualquer site: **a estrutura da página**.

- Tags, atributos e semântica
- Links, imagens e listas
- Formulários acessíveis

Bora semear!', 0) on conflict (id) do nothing;
insert into public.modules (id, title, description, icon, slug, in_revision, created_by) values ('381a7121-0664-5437-a734-631e004ae378', 'CSS na Prática', 'Dê vida às páginas com cores, seletores e regras de estilo claras e reutilizáveis.', 'css', 'css-na-pratica', false, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba') on conflict (id) do nothing;
insert into public.teacher_modules (id, teacher_id, module_id, assigned_by) values ('c7841eaf-de11-54ba-89f6-3a3fe327a5b9', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', '381a7121-0664-5437-a734-631e004ae378', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba') on conflict (id) do nothing;
insert into public.section_content (id, module_id, type, content, "order") values ('30242e8b-b278-5f04-8348-0610a38dbbeb', '381a7121-0664-5437-a734-631e004ae378', 'MARKDOWN', '# CSS na Prática

Agora que você já sabe estruturar, é hora de **estilizar**.

Vamos ver seletores, cores e como o navegador resolve conflitos entre regras.', 0) on conflict (id) do nothing;
insert into public.modules (id, title, description, icon, slug, in_revision, created_by) values ('a0c69d6c-cb8b-556a-b947-f861a5bcfc34', 'JavaScript Moderno', 'Variáveis, funções e o DOM com a sintaxe moderna da linguagem. Em breve na plataforma.', 'javascript', 'javascript-moderno', true, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba') on conflict (id) do nothing;
insert into public.teacher_modules (id, teacher_id, module_id, assigned_by) values ('432f85e4-2186-58de-bd3f-9082d1f3e214', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', 'a0c69d6c-cb8b-556a-b947-f861a5bcfc34', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba') on conflict (id) do nothing;
insert into public.section_content (id, module_id, type, content, "order") values ('f89ffcb6-03a6-529d-90ba-7d5094d9041f', 'a0c69d6c-cb8b-556a-b947-f861a5bcfc34', 'MARKDOWN', '# JavaScript Moderno

Conteúdo em preparação.', 0) on conflict (id) do nothing;
insert into public.submodules (id, module_id, title, slug, description, icon, "order") values ('e86aa906-95c5-5332-bb5b-f9456a72a87a', '11ba5020-4323-5483-9824-1410497398fa', 'Primeiros passos', 'primeiros-passos', 'O que é HTML e como montar a estrutura básica de uma página.', 'rocket_launch', 1) on conflict (id) do nothing;
insert into public.submodules (id, module_id, title, slug, description, icon, "order") values ('d7a1d95a-9ff5-58b7-972e-851e353145bc', '11ba5020-4323-5483-9824-1410497398fa', 'Formulários', 'formularios', 'Campos, rótulos e validação nativa para coletar dados com acessibilidade.', 'edit_note', 2) on conflict (id) do nothing;
insert into public.submodules (id, module_id, title, slug, description, icon, "order") values ('9f3f4b09-a9c6-505e-b525-43fdd016cfed', '381a7121-0664-5437-a734-631e004ae378', 'Seletores e cores', 'seletores-e-cores', 'Como escolher elementos e aplicar cores com CSS.', 'palette', 1) on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('0fb4e367-514b-5e00-889c-e2c1b08d6efd', 'e86aa906-95c5-5332-bb5b-f9456a72a87a', 'O que é HTML?', 'Entenda o que é HTML, o que são tags e como criar títulos, parágrafos, links e imagens.', 'LESSON', 1, 20, 'javascript', null, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('7dbaa76d-6d7d-536e-8694-e87cbb8e3aa8', '0fb4e367-514b-5e00-889c-e2c1b08d6efd', 'MARKDOWN', '# O que é HTML?

**HTML** (HyperText Markup Language) é a linguagem que descreve a *estrutura* de uma página web.

```html
<h1>Olá, mundo!</h1>
<p>Minha primeira página.</p>
```

Uma **tag** tem abertura (`<p>`) e fechamento (`</p>`).', 0) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('58cb3817-4b71-5fa6-be33-7766b4999f07', '0fb4e367-514b-5e00-889c-e2c1b08d6efd', 'MARKDOWN', '## Links e imagens

```html
<a href="https://developer.mozilla.org">Documentação</a>
<img src="logo.png" alt="Logo do projeto">
```

O atributo `alt` descreve a imagem para quem não pode vê-la.', 1) on conflict (id) do nothing;
insert into public.extra_material (id, lesson_id, title, type, url) values ('df2624cc-c456-5f54-867d-04ec4effd9fb', '0fb4e367-514b-5e00-889c-e2c1b08d6efd', 'MDN: Introdução ao HTML', 'URL', 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax') on conflict (id) do nothing;
insert into public.quizzes (id, lesson_id) values ('a41e184a-f088-5398-a6e2-b75bb61e12ea', '0fb4e367-514b-5e00-889c-e2c1b08d6efd') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('4f7ec16c-31f3-5a82-bcac-4a879b21d2a9', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('65bf65e9-6e3f-5802-82cc-33ad13aa63f6', '4f7ec16c-31f3-5a82-bcac-4a879b21d2a9', 'MARKDOWN', 'O que significa a sigla **HTML**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('d7118d0d-c6f4-5afe-9304-3031ee227fd1', '4f7ec16c-31f3-5a82-bcac-4a879b21d2a9', 'HighText Machine Language', false, 'Não é a opção correta. HTML é a linguagem de marcação de hipertexto usada para estruturar páginas.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('c51aaba7-23e4-5683-b273-b9e8f5eef1d8', '4f7ec16c-31f3-5a82-bcac-4a879b21d2a9', 'Hyperlinks and Text Markup Language', false, 'Não é a opção correta. HTML é a linguagem de marcação de hipertexto usada para estruturar páginas.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a628817b-de2e-5c8a-a5fb-d167c54d8d9c', '4f7ec16c-31f3-5a82-bcac-4a879b21d2a9', 'HyperText Markup Language', true, 'HTML é a linguagem de marcação de hipertexto usada para estruturar páginas.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('c06a776a-fa35-5642-9b80-36668ef496b5', '4f7ec16c-31f3-5a82-bcac-4a879b21d2a9', 'Home Tool Markup Language', false, 'Não é a opção correta. HTML é a linguagem de marcação de hipertexto usada para estruturar páginas.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('cc6d9486-72c0-5f8e-bc51-cc86ef828ab8', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('daf0f7dd-65d9-52bb-bbac-3aa158921068', 'cc6d9486-72c0-5f8e-bc51-cc86ef828ab8', 'MARKDOWN', 'HTML é uma linguagem de…', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('630c2b84-59cb-5abb-90a7-f773e3718d9d', 'cc6d9486-72c0-5f8e-bc51-cc86ef828ab8', 'marcação, que descreve a estrutura do conteúdo', true, 'HTML marca o conteúdo (títulos, parágrafos, links). Estilo é com CSS e lógica com JavaScript.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('2bcb0261-3cdd-54c5-9122-00b7bd26b7d7', 'cc6d9486-72c0-5f8e-bc51-cc86ef828ab8', 'estilização, que define cores e fontes', false, 'Não é a opção correta. HTML marca o conteúdo (títulos, parágrafos, links). Estilo é com CSS e lógica com JavaScript.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('cc050d88-a186-5ed0-a1a7-2393663fea24', 'cc6d9486-72c0-5f8e-bc51-cc86ef828ab8', 'banco de dados, que armazena informações', false, 'Não é a opção correta. HTML marca o conteúdo (títulos, parágrafos, links). Estilo é com CSS e lógica com JavaScript.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('cf798260-156c-5db6-a884-4c4fd55cb1f9', 'cc6d9486-72c0-5f8e-bc51-cc86ef828ab8', 'programação, que executa cálculos', false, 'Não é a opção correta. HTML marca o conteúdo (títulos, parágrafos, links). Estilo é com CSS e lógica com JavaScript.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('fd6a8213-270a-521e-b528-9c8254ffedb6', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('bebaa8d2-8115-5dd9-9ca9-5d5981000eeb', 'fd6a8213-270a-521e-b528-9c8254ffedb6', 'MARKDOWN', 'Qual tag cria o título de **maior** nível?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('eb6c3cd1-7a18-5fc8-9a31-42233afedd86', 'fd6a8213-270a-521e-b528-9c8254ffedb6', '<header>', false, 'Não é a opção correta. Os títulos vão de <h1> (mais importante) até <h6>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('3be45930-abfa-590b-a192-2afc27234a38', 'fd6a8213-270a-521e-b528-9c8254ffedb6', '<h1>', true, 'Os títulos vão de <h1> (mais importante) até <h6>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('3843c123-5074-507b-ad0f-61c07aec1b90', 'fd6a8213-270a-521e-b528-9c8254ffedb6', '<h6>', false, 'Não é a opção correta. Os títulos vão de <h1> (mais importante) até <h6>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ac329e56-c650-5ee4-bd27-2b5d242a18bf', 'fd6a8213-270a-521e-b528-9c8254ffedb6', '<head>', false, 'Não é a opção correta. Os títulos vão de <h1> (mais importante) até <h6>.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('006179bf-c645-5cef-86e5-6d5a5570f1e1', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('0cda9849-9081-5913-bfb4-4a7651b01d0d', '006179bf-c645-5cef-86e5-6d5a5570f1e1', 'MARKDOWN', 'Qual tag define um **parágrafo**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ace42b51-a965-5362-b0e5-6ca8a2ccd342', '006179bf-c645-5cef-86e5-6d5a5570f1e1', '<p>', true, 'A tag <p> envolve um parágrafo de texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('3aaea0b3-7b30-5654-9e1d-6f00d8c92b2c', '006179bf-c645-5cef-86e5-6d5a5570f1e1', '<text>', false, 'Não é a opção correta. A tag <p> envolve um parágrafo de texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('8a10b742-5ffb-5f31-918b-d54661f8a2f7', '006179bf-c645-5cef-86e5-6d5a5570f1e1', '<pg>', false, 'Não é a opção correta. A tag <p> envolve um parágrafo de texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('63ae744d-386d-5e24-86a4-a3a4c7c90b5d', '006179bf-c645-5cef-86e5-6d5a5570f1e1', '<para>', false, 'Não é a opção correta. A tag <p> envolve um parágrafo de texto.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('eda00322-35e4-516d-ac71-98170b9917ae', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('abdc1b48-c1af-5039-93ae-5b7317894c93', 'eda00322-35e4-516d-ac71-98170b9917ae', 'MARKDOWN', 'Qual atributo define o **destino** de um link?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('27a098e1-80bb-5c5c-85c1-9cfe4647918a', 'eda00322-35e4-516d-ac71-98170b9917ae', 'src', false, 'Não é a opção correta. O atributo href (hypertext reference) da tag <a> guarda o endereço.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('e6a2b08f-3ba2-572f-8026-403ddba4e336', 'eda00322-35e4-516d-ac71-98170b9917ae', 'href', true, 'O atributo href (hypertext reference) da tag <a> guarda o endereço.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('227270e2-4ea1-5871-b136-0ab182cfc193', 'eda00322-35e4-516d-ac71-98170b9917ae', 'url', false, 'Não é a opção correta. O atributo href (hypertext reference) da tag <a> guarda o endereço.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('bcec735f-2432-5597-bd48-e9cbfaddeb84', 'eda00322-35e4-516d-ac71-98170b9917ae', 'link', false, 'Não é a opção correta. O atributo href (hypertext reference) da tag <a> guarda o endereço.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('29e3498f-36b6-5b96-848e-50e6b6274f9e', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('5220e0e9-6cf2-545d-9a3a-d3f3b16ccb88', '29e3498f-36b6-5b96-848e-50e6b6274f9e', 'MARKDOWN', 'Qual tag cria um **link**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('945dacea-ec00-5add-ab6e-81d74d631d3d', '29e3498f-36b6-5b96-848e-50e6b6274f9e', '<link>', false, 'Não é a opção correta. A tag <a> (anchor) cria links clicáveis.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('4bd359ac-5491-5a41-8d94-e47509d8088a', '29e3498f-36b6-5b96-848e-50e6b6274f9e', '<url>', false, 'Não é a opção correta. A tag <a> (anchor) cria links clicáveis.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('be7bf8de-31d8-5532-87cd-3c4fff883820', '29e3498f-36b6-5b96-848e-50e6b6274f9e', '<href>', false, 'Não é a opção correta. A tag <a> (anchor) cria links clicáveis.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f8f371b2-55af-5739-98a0-0db591fbaafc', '29e3498f-36b6-5b96-848e-50e6b6274f9e', '<a>', true, 'A tag <a> (anchor) cria links clicáveis.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('4f8a0ca7-a562-5c8e-9246-bc9534fa4835', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('67c9c003-a28a-51af-8dad-d24c0537de39', '4f8a0ca7-a562-5c8e-9246-bc9534fa4835', 'MARKDOWN', 'Qual tag insere uma **imagem**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('912311d9-1654-53d3-8bc5-c77bae0f852f', '4f8a0ca7-a562-5c8e-9246-bc9534fa4835', '<image>', false, 'Não é a opção correta. A tag <img> é vazia e usa o atributo src para apontar o arquivo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('45a722c6-39cf-54d4-8819-67ddcdbafb5b', '4f8a0ca7-a562-5c8e-9246-bc9534fa4835', '<img>', true, 'A tag <img> é vazia e usa o atributo src para apontar o arquivo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('67111f84-0d4b-579f-abee-6a2d00a90126', '4f8a0ca7-a562-5c8e-9246-bc9534fa4835', '<picture-src>', false, 'Não é a opção correta. A tag <img> é vazia e usa o atributo src para apontar o arquivo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('9b96e2f3-896a-56cb-beab-e717d3f2496f', '4f8a0ca7-a562-5c8e-9246-bc9534fa4835', '<src>', false, 'Não é a opção correta. A tag <img> é vazia e usa o atributo src para apontar o arquivo.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('b5852310-6426-5a24-8271-bf0b6bfd7486', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('3bfd7826-7834-5471-8a60-f67c96f57e93', 'b5852310-6426-5a24-8271-bf0b6bfd7486', 'MARKDOWN', 'Qual atributo fornece o **texto alternativo** de uma imagem?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('75755836-dc29-5b0e-b624-a5ee97642b23', 'b5852310-6426-5a24-8271-bf0b6bfd7486', 'name', false, 'Não é a opção correta. O alt descreve a imagem para leitores de tela e aparece se ela não carregar.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('7b4a79bf-0c35-58fc-9e86-8cedf5abccfb', 'b5852310-6426-5a24-8271-bf0b6bfd7486', 'label', false, 'Não é a opção correta. O alt descreve a imagem para leitores de tela e aparece se ela não carregar.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('62cb3122-e249-5d77-b94f-5fed2657b672', 'b5852310-6426-5a24-8271-bf0b6bfd7486', 'caption', false, 'Não é a opção correta. O alt descreve a imagem para leitores de tela e aparece se ela não carregar.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a96450c8-b15c-570a-a4d3-969e31b8c5f0', 'b5852310-6426-5a24-8271-bf0b6bfd7486', 'alt', true, 'O alt descreve a imagem para leitores de tela e aparece se ela não carregar.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('806aeb47-2a1c-5f2f-9238-45346a5d78a5', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('e9d10e6c-ee3b-5094-a989-92e864068044', '806aeb47-2a1c-5f2f-9238-45346a5d78a5', 'MARKDOWN', 'Qual tag cria uma lista **com marcadores**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('fe7d7cdf-ec92-5107-aa68-d3e845d60f09', '806aeb47-2a1c-5f2f-9238-45346a5d78a5', '<ul>', true, '<ul> é a lista não ordenada; <ol> é numerada; <li> é cada item.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('185f4834-9865-56b8-a354-ea8498bbf19f', '806aeb47-2a1c-5f2f-9238-45346a5d78a5', '<list>', false, 'Não é a opção correta. <ul> é a lista não ordenada; <ol> é numerada; <li> é cada item.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('2c90b858-a985-5fa4-a55a-9ca38fb8e7e2', '806aeb47-2a1c-5f2f-9238-45346a5d78a5', '<li>', false, 'Não é a opção correta. <ul> é a lista não ordenada; <ol> é numerada; <li> é cada item.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('d06ee736-a1ba-5d0c-8097-cbb60693a0b8', '806aeb47-2a1c-5f2f-9238-45346a5d78a5', '<ol>', false, 'Não é a opção correta. <ul> é a lista não ordenada; <ol> é numerada; <li> é cada item.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('8cf279da-f650-5184-ac05-288375854319', 'a41e184a-f088-5398-a6e2-b75bb61e12ea') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('2cd4e753-0392-52e6-9b34-fc7d7605ed88', '8cf279da-f650-5184-ac05-288375854319', 'MARKDOWN', 'Qual extensão costuma ter um arquivo HTML?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a33b5836-3a72-5492-89ce-41db85ff91dd', '8cf279da-f650-5184-ac05-288375854319', '.markup', false, 'Não é a opção correta. Arquivos de página web usam .html (ou .htm).') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('eef655c1-212e-5db3-967a-3369f6be10a8', '8cf279da-f650-5184-ac05-288375854319', '.html', true, 'Arquivos de página web usam .html (ou .htm).') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('eee72c26-6af4-50e2-acb7-1047fab464aa', '8cf279da-f650-5184-ac05-288375854319', '.web', false, 'Não é a opção correta. Arquivos de página web usam .html (ou .htm).') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('961fe362-cbbc-518d-a53e-c47e1263f801', '8cf279da-f650-5184-ac05-288375854319', '.hyper', false, 'Não é a opção correta. Arquivos de página web usam .html (ou .htm).') on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('8274a0fa-6560-5d31-b1e5-77a3ed3769a9', 'e86aa906-95c5-5332-bb5b-f9456a72a87a', 'Estrutura de uma página', 'Doctype, head, body e as principais tags semânticas.', 'LESSON', 2, 20, 'javascript', null, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('c56e37ce-60a8-5535-b9a9-3b9e24f310e3', '8274a0fa-6560-5d31-b1e5-77a3ed3769a9', 'MARKDOWN', '# Estrutura de uma página

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>Minha página</title>
  </head>
  <body>
    <main>
      <h1>Bem-vindo</h1>
    </main>
  </body>
</html>
```', 0) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('021c5f14-b967-519f-a944-dc03062b63b4', '8274a0fa-6560-5d31-b1e5-77a3ed3769a9', 'MARKDOWN', '## Semântica

Use `<header>`, `<nav>`, `<main>`, `<article>` e `<footer>` para dar significado ao conteúdo.', 1) on conflict (id) do nothing;
insert into public.extra_material (id, lesson_id, title, type, url) values ('ae348381-124e-5ba8-9905-02876a26b763', '8274a0fa-6560-5d31-b1e5-77a3ed3769a9', 'MDN: Estrutura de um documento HTML', 'URL', 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Structuring_content/Webpage_metadata') on conflict (id) do nothing;
insert into public.quizzes (id, lesson_id) values ('d9ed1262-d190-5c55-9b06-87540a5de349', '8274a0fa-6560-5d31-b1e5-77a3ed3769a9') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('a42ada84-83e2-5378-98d1-f4822587af3e', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('c72fd3a2-6862-5389-a9fc-85d2f0c3a4b0', 'a42ada84-83e2-5378-98d1-f4822587af3e', 'MARKDOWN', 'Qual declaração indica que o documento é **HTML5**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('452626e3-c21d-5ca8-af40-6023583c6b30', 'a42ada84-83e2-5378-98d1-f4822587af3e', '<doctype=html>', false, 'Não é a opção correta. O doctype simples <!DOCTYPE html> ativa o modo padrão do HTML5.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('3ed9a9c6-8894-5be9-8f86-43ff4d25ecb4', 'a42ada84-83e2-5378-98d1-f4822587af3e', '<!DOCTYPE html>', true, 'O doctype simples <!DOCTYPE html> ativa o modo padrão do HTML5.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('fee518e6-5232-5d2f-85d6-067043b6a9a8', 'a42ada84-83e2-5378-98d1-f4822587af3e', '<html5>', false, 'Não é a opção correta. O doctype simples <!DOCTYPE html> ativa o modo padrão do HTML5.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('bc5c2d10-0b75-5660-a75c-70bbc909ffeb', 'a42ada84-83e2-5378-98d1-f4822587af3e', '<!HTML version=5>', false, 'Não é a opção correta. O doctype simples <!DOCTYPE html> ativa o modo padrão do HTML5.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('e8355f31-4e0b-5c16-aaa4-2ba47e3ad2d1', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('06469e4c-0f25-5aaf-bf6d-00bba56adc19', 'e8355f31-4e0b-5c16-aaa4-2ba47e3ad2d1', 'MARKDOWN', 'Qual é o **elemento raiz** de uma página HTML?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('26066df4-1c2d-50b8-ad3c-670442053061', 'e8355f31-4e0b-5c16-aaa4-2ba47e3ad2d1', '<root>', false, 'Não é a opção correta. Todo o conteúdo fica dentro de <html>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('e5e569bf-e2e1-5f8f-b67c-42ca73459acf', 'e8355f31-4e0b-5c16-aaa4-2ba47e3ad2d1', '<html>', true, 'Todo o conteúdo fica dentro de <html>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('b4c29088-e75e-5c03-85ae-8c01c783fbfe', 'e8355f31-4e0b-5c16-aaa4-2ba47e3ad2d1', '<body>', false, 'Não é a opção correta. Todo o conteúdo fica dentro de <html>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('d2bff35a-2492-536a-b6a7-fd8b9ac56977', 'e8355f31-4e0b-5c16-aaa4-2ba47e3ad2d1', '<head>', false, 'Não é a opção correta. Todo o conteúdo fica dentro de <html>.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('9432df4e-597a-5151-b63e-a6768ad844d7', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('5d222f05-ce71-5183-a623-a48a9661602c', '9432df4e-597a-5151-b63e-a6768ad844d7', 'MARKDOWN', 'Onde ficam os **metadados** da página?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('8ba017a6-5c9c-5d10-acfb-fa81e0e4f14a', '9432df4e-597a-5151-b63e-a6768ad844d7', 'Dentro de <head>', true, 'O <head> guarda título, charset, links de CSS e outras informações não visíveis.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('876eede5-197f-5136-a590-e6a655c22a3c', '9432df4e-597a-5151-b63e-a6768ad844d7', 'Dentro de <main>', false, 'Não é a opção correta. O <head> guarda título, charset, links de CSS e outras informações não visíveis.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a9e27ff4-5d32-5695-833f-81dedb2495ea', '9432df4e-597a-5151-b63e-a6768ad844d7', 'Dentro de <footer>', false, 'Não é a opção correta. O <head> guarda título, charset, links de CSS e outras informações não visíveis.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('5f3a96c2-2146-5f0a-a68f-62cb5b14172f', '9432df4e-597a-5151-b63e-a6768ad844d7', 'Dentro de <body>', false, 'Não é a opção correta. O <head> guarda título, charset, links de CSS e outras informações não visíveis.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('f8f42244-6cfc-5b84-8aa7-afb28e84fbcd', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('1ae10ed0-420f-511d-ab4f-c6c7ace33e0c', 'f8f42244-6cfc-5b84-8aa7-afb28e84fbcd', 'MARKDOWN', 'Qual tag define o título exibido na **aba do navegador**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('251aa482-e6d3-5dc9-9aca-18c9376b0321', 'f8f42244-6cfc-5b84-8aa7-afb28e84fbcd', '<header>', false, 'Não é a opção correta. O <title> dentro do <head> aparece na aba e nos resultados de busca.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('bb01de40-533d-5008-ab37-f035a562007e', 'f8f42244-6cfc-5b84-8aa7-afb28e84fbcd', '<title>', true, 'O <title> dentro do <head> aparece na aba e nos resultados de busca.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('00df36fb-dd59-5786-a4fd-d9c920a098ea', 'f8f42244-6cfc-5b84-8aa7-afb28e84fbcd', '<h1>', false, 'Não é a opção correta. O <title> dentro do <head> aparece na aba e nos resultados de busca.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('cac24a8b-7aa4-5da1-be3d-0ee9eceee853', 'f8f42244-6cfc-5b84-8aa7-afb28e84fbcd', '<tab>', false, 'Não é a opção correta. O <title> dentro do <head> aparece na aba e nos resultados de busca.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('8eeb715c-b24f-5deb-a1b6-8a69add416e4', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('d0f64570-e806-563d-9cbd-1a8c81e26643', '8eeb715c-b24f-5deb-a1b6-8a69add416e4', 'MARKDOWN', 'Onde fica o conteúdo **visível** da página?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ca635d0e-2aea-5be3-8c28-81b8f762b0ad', '8eeb715c-b24f-5deb-a1b6-8a69add416e4', '<head>', false, 'Não é a opção correta. Tudo o que o usuário vê fica dentro de <body>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('7c0c147d-e73e-5a1f-8b89-86e0127cfe9c', '8eeb715c-b24f-5deb-a1b6-8a69add416e4', '<meta>', false, 'Não é a opção correta. Tudo o que o usuário vê fica dentro de <body>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('22003993-7bbb-566b-bb06-6823921c9c59', '8eeb715c-b24f-5deb-a1b6-8a69add416e4', '<body>', true, 'Tudo o que o usuário vê fica dentro de <body>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('e2fa5ab1-9e49-546f-9c12-9613792b5912', '8eeb715c-b24f-5deb-a1b6-8a69add416e4', '<script>', false, 'Não é a opção correta. Tudo o que o usuário vê fica dentro de <body>.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('5477e9ee-8890-51fa-b7c0-133f875be70f', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('6b706f44-5777-54e3-ab59-f25041718ec8', '5477e9ee-8890-51fa-b7c0-133f875be70f', 'MARKDOWN', 'Qual tag define a **codificação de caracteres**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f42b8edc-0f99-545d-b51c-af4fae85e629', '5477e9ee-8890-51fa-b7c0-133f875be70f', '<meta charset="UTF-8">', true, 'UTF-8 garante acentos e símbolos corretos.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('15afd03b-6673-5d1e-bf27-447b21b9ff1b', '5477e9ee-8890-51fa-b7c0-133f875be70f', '<charset utf8>', false, 'Não é a opção correta. UTF-8 garante acentos e símbolos corretos.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('8bc32171-11d5-58bb-9243-cd35a6031bb8', '5477e9ee-8890-51fa-b7c0-133f875be70f', '<meta lang="UTF-8">', false, 'Não é a opção correta. UTF-8 garante acentos e símbolos corretos.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('27ee6e11-8490-5e5e-9453-d191c6080e25', '5477e9ee-8890-51fa-b7c0-133f875be70f', '<meta encoding="utf">', false, 'Não é a opção correta. UTF-8 garante acentos e símbolos corretos.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('b100ba51-d253-516e-8110-9cc0be91331b', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('14d4bca6-7475-57b0-aa92-33d50f3c33ab', 'b100ba51-d253-516e-8110-9cc0be91331b', 'MARKDOWN', 'Qual atributo de `<html>` informa o **idioma** da página?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('2b2ac3fa-76df-567d-99fa-6f0a3e360061', 'b100ba51-d253-516e-8110-9cc0be91331b', 'language', false, 'Não é a opção correta. Ex.: <html lang="pt-BR"> ajuda leitores de tela e buscadores.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ff9a4178-de56-544e-8ee4-d5a8f0aaa59c', 'b100ba51-d253-516e-8110-9cc0be91331b', 'locale', false, 'Não é a opção correta. Ex.: <html lang="pt-BR"> ajuda leitores de tela e buscadores.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('8c47a213-5b36-5b95-8c0a-9510affacd5c', 'b100ba51-d253-516e-8110-9cc0be91331b', 'idiom', false, 'Não é a opção correta. Ex.: <html lang="pt-BR"> ajuda leitores de tela e buscadores.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('19241a00-45cb-58da-8718-5f1542ebeaf0', 'b100ba51-d253-516e-8110-9cc0be91331b', 'lang', true, 'Ex.: <html lang="pt-BR"> ajuda leitores de tela e buscadores.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('e12b31aa-c233-570e-8bb5-319046c26ce1', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('5c8bdae3-eaad-5252-a712-37e6a25a8ac3', 'e12b31aa-c233-570e-8bb5-319046c26ce1', 'MARKDOWN', 'Qual tag semântica envolve o conteúdo **principal** da página?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('02994f18-71ec-5ae9-bade-1fcbe0f18681', 'e12b31aa-c233-570e-8bb5-319046c26ce1', '<span>', false, 'Não é a opção correta. <main> representa o conteúdo central e único da página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('770e8947-5b75-5bfe-b1a9-c17fa6b27a8f', 'e12b31aa-c233-570e-8bb5-319046c26ce1', '<footer>', false, 'Não é a opção correta. <main> representa o conteúdo central e único da página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('d2519c9e-09ef-56a1-8092-49fac8b41767', 'e12b31aa-c233-570e-8bb5-319046c26ce1', '<aside>', false, 'Não é a opção correta. <main> representa o conteúdo central e único da página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('68020394-128f-5f42-8b72-e9e44bf253da', 'e12b31aa-c233-570e-8bb5-319046c26ce1', '<main>', true, '<main> representa o conteúdo central e único da página.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('ec0f9fa0-eaa6-5cee-9681-a1a9339c1979', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('c6d65d73-3eaf-5f4e-9608-809443a8c5af', 'ec0f9fa0-eaa6-5cee-9681-a1a9339c1979', 'MARKDOWN', 'Qual tag semântica representa o **rodapé**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('3db766f2-5945-562d-867b-2bfecdbb0f7f', 'ec0f9fa0-eaa6-5cee-9681-a1a9339c1979', '<footer>', true, '<footer> traz informações finais da página ou de uma seção.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('4c7fd30b-51d8-5ce8-a2ba-f826804ea66e', 'ec0f9fa0-eaa6-5cee-9681-a1a9339c1979', '<bottom>', false, 'Não é a opção correta. <footer> traz informações finais da página ou de uma seção.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f462d0a6-1849-5edd-8b76-a9ec8c93fd1b', 'ec0f9fa0-eaa6-5cee-9681-a1a9339c1979', '<end>', false, 'Não é a opção correta. <footer> traz informações finais da página ou de uma seção.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('00ec64e5-cc00-5f4b-be2e-3bcac0a02161', 'ec0f9fa0-eaa6-5cee-9681-a1a9339c1979', '<foot>', false, 'Não é a opção correta. <footer> traz informações finais da página ou de uma seção.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('b10745a4-d520-5d62-814e-85dd36328826', 'd9ed1262-d190-5c55-9b06-87540a5de349') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('aaa5c609-db94-5aa9-9fc2-201a5e18c98e', 'b10745a4-d520-5d62-814e-85dd36328826', 'MARKDOWN', 'Por que usar tags semânticas como `<nav>` e `<article>`?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a4cdcd0e-098d-5413-bd9a-2bb0f988dd2c', 'b10745a4-d520-5d62-814e-85dd36328826', 'Fazem os scripts rodarem mais rápido', false, 'Não é a opção correta. Semântica ajuda tecnologias assistivas e mecanismos de busca a entender a página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('6f7bed16-9735-5c61-b752-dd20c4e6c4a9', 'b10745a4-d520-5d62-814e-85dd36328826', 'Deixam a página mais colorida', false, 'Não é a opção correta. Semântica ajuda tecnologias assistivas e mecanismos de busca a entender a página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f4cff0dd-24cc-54f9-8238-446fc6802dba', 'b10745a4-d520-5d62-814e-85dd36328826', 'Porque a tag <div> é proibida', false, 'Não é a opção correta. Semântica ajuda tecnologias assistivas e mecanismos de busca a entender a página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f6e266a2-c25c-5ba8-8859-2d8892a95af3', 'b10745a4-d520-5d62-814e-85dd36328826', 'Dão significado ao conteúdo, ajudando acessibilidade e SEO', true, 'Semântica ajuda tecnologias assistivas e mecanismos de busca a entender a página.') on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('e50f4c5f-303e-5377-9768-8fbd7de5e9b4', 'e86aa906-95c5-5332-bb5b-f9456a72a87a', 'Revisão: fundamentos de HTML', 'Dez perguntas sorteadas das lições anteriores deste submódulo.', 'REVISION', 3, 15, 'javascript', null, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('2fdc931a-14ef-5619-8a20-5285ac764419', 'e50f4c5f-303e-5377-9768-8fbd7de5e9b4', 'MARKDOWN', '# Revisão

Responda às perguntas sorteadas das lições anteriores para fixar o conteúdo.', 0) on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('0ba1e272-a3c2-536f-93e2-9ef72798eed1', 'e86aa906-95c5-5332-bb5b-f9456a72a87a', 'Desafio: sua primeira página', 'Monte uma página HTML completa com título, parágrafo, link e imagem.', 'CHALLENGE', 4, 30, 'html', '<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title></title>
  </head>
  <body>
    <!-- Escreva seu código aqui -->
  </body>
</html>
', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('917108b1-d62a-5e13-a31e-fb9970f4df86', '0ba1e272-a3c2-536f-93e2-9ef72798eed1', 'MARKDOWN', '# Desafio: sua primeira página

Crie uma página HTML que contenha:

1. Um `<title>` com o seu nome
2. Um `<h1>` de boas-vindas
3. Um parágrafo apresentando você
4. Um link para o seu perfil no GitHub
5. Uma imagem com texto alternativo', 0) on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('da235cfc-d669-56c7-b33d-445607b61bf2', 'd7a1d95a-9ff5-58b7-972e-851e353145bc', 'Campos de formulário', 'Inputs, rótulos, seleção e validação nativa com HTML.', 'LESSON', 1, 20, 'javascript', null, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('62df2c31-03c5-531b-b26c-3edce1bd2c8c', 'da235cfc-d669-56c7-b33d-445607b61bf2', 'MARKDOWN', '# Campos de formulário

```html
<form>
  <label for="nome">Nome</label>
  <input id="nome" name="nome" type="text" required>

  <label for="email">E-mail</label>
  <input id="email" name="email" type="email" required>

  <button type="submit">Enviar</button>
</form>
```', 0) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('b486a154-202f-55d0-b42c-18666642decf', 'da235cfc-d669-56c7-b33d-445607b61bf2', 'MARKDOWN', '## Boas práticas

- Sempre associe `<label for>` ao `id` do campo
- Use o `type` correto (`email`, `tel`, `number`)
- `placeholder` não substitui o rótulo', 1) on conflict (id) do nothing;
insert into public.extra_material (id, lesson_id, title, type, url) values ('2179bd6e-7dae-5311-bd8d-35f9996a8911', 'da235cfc-d669-56c7-b33d-445607b61bf2', 'MDN: Formulários HTML', 'URL', 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Extensions/Forms') on conflict (id) do nothing;
insert into public.quizzes (id, lesson_id) values ('65779eea-1735-58c6-9d1d-987224cd079b', 'da235cfc-d669-56c7-b33d-445607b61bf2') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('09bc9bf0-db89-52f7-94d4-17f45324d28d', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('f8fd5f28-12be-515b-b9ec-0c9cdb815fab', '09bc9bf0-db89-52f7-94d4-17f45324d28d', 'MARKDOWN', 'Qual tag envolve os campos de um **formulário**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ab5f9951-6743-5007-9ba3-e861a6a7c4c2', '09bc9bf0-db89-52f7-94d4-17f45324d28d', '<submit>', false, 'Não é a opção correta. O <form> agrupa os campos e define para onde os dados são enviados.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('dc226930-2de4-516b-812f-326d736220b5', '09bc9bf0-db89-52f7-94d4-17f45324d28d', '<fields>', false, 'Não é a opção correta. O <form> agrupa os campos e define para onde os dados são enviados.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('552b8545-7998-569b-857b-b192a8dfbc40', '09bc9bf0-db89-52f7-94d4-17f45324d28d', '<form>', true, 'O <form> agrupa os campos e define para onde os dados são enviados.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('0d171013-e2db-52ca-8813-cf78d5822853', '09bc9bf0-db89-52f7-94d4-17f45324d28d', '<input-form>', false, 'Não é a opção correta. O <form> agrupa os campos e define para onde os dados são enviados.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('1646d316-1114-5bcb-bb4a-1ad467166596', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('4e3b4f6c-6369-5f96-854e-4772c2194736', '1646d316-1114-5bcb-bb4a-1ad467166596', 'MARKDOWN', 'Como criar um campo de texto de **uma linha**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('0cbe4e3c-fa0b-5a8d-9bd3-48720b01cfab', '1646d316-1114-5bcb-bb4a-1ad467166596', '<input type="line">', false, 'Não é a opção correta. O <input> com type="text" é o campo de texto padrão.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ff3cec48-6d83-53e5-8123-08bd062e007d', '1646d316-1114-5bcb-bb4a-1ad467166596', '<input type="text">', true, 'O <input> com type="text" é o campo de texto padrão.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('bbfb9360-8dfd-58af-8db9-cae3e9a557a5', '1646d316-1114-5bcb-bb4a-1ad467166596', '<text>', false, 'Não é a opção correta. O <input> com type="text" é o campo de texto padrão.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('7e92a66f-efca-5598-8fa4-88d439882ad6', '1646d316-1114-5bcb-bb4a-1ad467166596', '<textarea>', false, 'Não é a opção correta. O <input> com type="text" é o campo de texto padrão.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('4ae75122-51e8-559b-8355-114a42253c59', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('a3bfc06e-0ab2-5d4c-911b-84b72895da51', '4ae75122-51e8-559b-8355-114a42253c59', 'MARKDOWN', 'Qual tag cria um campo de texto **multilinha**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a71627de-1e39-562a-9be4-5ef98e093d87', '4ae75122-51e8-559b-8355-114a42253c59', '<text-area>', false, 'Não é a opção correta. <textarea> aceita várias linhas de texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ddc035b4-3b81-5a00-b3e1-903ed58645b3', '4ae75122-51e8-559b-8355-114a42253c59', '<textarea>', true, '<textarea> aceita várias linhas de texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ca0a0c52-cf18-55bb-8041-2cf7b5463fba', '4ae75122-51e8-559b-8355-114a42253c59', '<longtext>', false, 'Não é a opção correta. <textarea> aceita várias linhas de texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a1eb615b-3020-55e5-a76f-7f7621558ca0', '4ae75122-51e8-559b-8355-114a42253c59', '<input type="multi">', false, 'Não é a opção correta. <textarea> aceita várias linhas de texto.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('f31e4c26-c54f-5fc1-a580-5b5aa2e5ecfc', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('4ca88bcc-a9ae-5f80-b5c4-fd92e751fad6', 'f31e4c26-c54f-5fc1-a580-5b5aa2e5ecfc', 'MARKDOWN', 'Como **associar um rótulo** a um campo?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('70a7679a-7580-58c0-b6cf-e43a7462b766', 'f31e4c26-c54f-5fc1-a580-5b5aa2e5ecfc', '<caption name="campo">', false, 'Não é a opção correta. O for do <label> deve ser igual ao id do campo, e o clique no rótulo foca o campo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f00785e1-8af5-53f9-a501-9945f53c6c52', 'f31e4c26-c54f-5fc1-a580-5b5aa2e5ecfc', '<span for="id-do-campo">', false, 'Não é a opção correta. O for do <label> deve ser igual ao id do campo, e o clique no rótulo foca o campo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('c2a4140f-fc5a-5d58-b843-61741b360b54', 'f31e4c26-c54f-5fc1-a580-5b5aa2e5ecfc', '<name for="campo">', false, 'Não é a opção correta. O for do <label> deve ser igual ao id do campo, e o clique no rótulo foca o campo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f53ef199-cda9-5418-903b-df59eeed5e79', 'f31e4c26-c54f-5fc1-a580-5b5aa2e5ecfc', '<label for="id-do-campo">', true, 'O for do <label> deve ser igual ao id do campo, e o clique no rótulo foca o campo.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('401efe00-997c-5044-99bd-da86cda31501', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('b7f18a28-1c9d-536d-8269-be23638f159b', '401efe00-997c-5044-99bd-da86cda31501', 'MARKDOWN', 'Qual `type` valida automaticamente um **e-mail**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('58e98897-24c8-5f2b-99b1-a0e5cef7afb5', '401efe00-997c-5044-99bd-da86cda31501', 'mail', false, 'Não é a opção correta. type="email" faz o navegador checar o formato básico.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('c866942f-7fe2-5690-9026-1d6213b07e82', '401efe00-997c-5044-99bd-da86cda31501', '@', false, 'Não é a opção correta. type="email" faz o navegador checar o formato básico.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('7164860d-efe2-5001-9daf-aae544785dc4', '401efe00-997c-5044-99bd-da86cda31501', 'email', true, 'type="email" faz o navegador checar o formato básico.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('165f32eb-f2db-58c6-b402-d223fe863821', '401efe00-997c-5044-99bd-da86cda31501', 'text-email', false, 'Não é a opção correta. type="email" faz o navegador checar o formato básico.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('95e5b00d-395b-566b-add7-9485c9ed377c', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('135016a1-b05c-59e3-925a-ddb53bf2e8f7', '95e5b00d-395b-566b-add7-9485c9ed377c', 'MARKDOWN', 'Qual atributo **exige** o preenchimento do campo?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a9248c11-e160-5563-ac61-60f3d250d990', '95e5b00d-395b-566b-add7-9485c9ed377c', 'required', true, 'Com required, o formulário não é enviado com o campo vazio.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('9f436c80-4522-590c-b9dc-1e78e9857d72', '95e5b00d-395b-566b-add7-9485c9ed377c', 'mandatory', false, 'Não é a opção correta. Com required, o formulário não é enviado com o campo vazio.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('8ee336b3-6ad2-5419-8530-59c4fd734e4b', '95e5b00d-395b-566b-add7-9485c9ed377c', 'validate', false, 'Não é a opção correta. Com required, o formulário não é enviado com o campo vazio.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('56dea53f-f079-599b-96f1-b428bc872925', '95e5b00d-395b-566b-add7-9485c9ed377c', 'must', false, 'Não é a opção correta. Com required, o formulário não é enviado com o campo vazio.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('6b42e1ad-a47f-54d6-a0e0-a38bec68404e', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('ae625ca3-434b-50c4-b3d3-461e6b3b23fe', '6b42e1ad-a47f-54d6-a0e0-a38bec68404e', 'MARKDOWN', 'Como criar uma lista **suspensa** de opções?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('0f8c1202-18aa-5f35-8cec-150b2bebe76e', '6b42e1ad-a47f-54d6-a0e0-a38bec68404e', '<menu>', false, 'Não é a opção correta. <select> mostra uma lista e cada <option> é uma escolha.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('fe9541a4-1544-50e1-bcbd-79503ed90e0d', '6b42e1ad-a47f-54d6-a0e0-a38bec68404e', '<select> com várias <option>', true, '<select> mostra uma lista e cada <option> é uma escolha.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('7fd5f7ef-b65f-5bb9-89cd-2bd865814ba7', '6b42e1ad-a47f-54d6-a0e0-a38bec68404e', '<input type="list">', false, 'Não é a opção correta. <select> mostra uma lista e cada <option> é uma escolha.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('8ad85246-8c77-5fbf-8511-6f51c01254cb', '6b42e1ad-a47f-54d6-a0e0-a38bec68404e', '<dropdown>', false, 'Não é a opção correta. <select> mostra uma lista e cada <option> é uma escolha.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('e48b78c2-82b8-5819-8a6c-c7358a6d6c90', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('6dd044a4-7f6a-5e78-8adb-a569da8f540b', 'e48b78c2-82b8-5819-8a6c-c7358a6d6c90', 'MARKDOWN', 'Qual botão **envia** o formulário?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('c4bba2d7-0ec9-55a4-b2cb-5a490e3016ea', 'e48b78c2-82b8-5819-8a6c-c7358a6d6c90', '<submit-btn>', false, 'Não é a opção correta. type="submit" dispara o envio do formulário.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('3c32dd68-098d-5458-b22d-309f302a521c', 'e48b78c2-82b8-5819-8a6c-c7358a6d6c90', '<input type="go">', false, 'Não é a opção correta. type="submit" dispara o envio do formulário.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('b601c041-a55c-5dad-9528-8cab5832cdb1', 'e48b78c2-82b8-5819-8a6c-c7358a6d6c90', '<button type="submit">', true, 'type="submit" dispara o envio do formulário.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('fda47cf0-795a-5cf0-a6bd-77e7279badd1', 'e48b78c2-82b8-5819-8a6c-c7358a6d6c90', '<button send>', false, 'Não é a opção correta. type="submit" dispara o envio do formulário.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('aadad6df-e1f2-5bce-bbe0-d93b4a75b86f', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('c02e68f9-5c5f-59f6-b917-053e1a08c4e0', 'aadad6df-e1f2-5bce-bbe0-d93b4a75b86f', 'MARKDOWN', 'Para escolher **apenas uma** opção entre várias, usamos…', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('bd2ed571-a152-5cb8-8400-56385b10fb81', 'aadad6df-e1f2-5bce-bbe0-d93b4a75b86f', 'type="checkbox"', false, 'Não é a opção correta. Radios com o mesmo name formam um grupo de escolha única.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('4003e220-fb19-5d12-928b-37c21c8dbba0', 'aadad6df-e1f2-5bce-bbe0-d93b4a75b86f', 'type="radio" com o mesmo name', true, 'Radios com o mesmo name formam um grupo de escolha única.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('d3cd0506-4053-5dd5-9aac-6b3f5e589fc4', 'aadad6df-e1f2-5bce-bbe0-d93b4a75b86f', 'type="option"', false, 'Não é a opção correta. Radios com o mesmo name formam um grupo de escolha única.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('6e869850-1be7-5b48-97ec-7969c11113ab', 'aadad6df-e1f2-5bce-bbe0-d93b4a75b86f', 'type="range"', false, 'Não é a opção correta. Radios com o mesmo name formam um grupo de escolha única.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('b02c43ec-aa69-581b-bf45-b64a03e0f4a7', '65779eea-1735-58c6-9d1d-987224cd079b') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('2cc76ef8-f08d-596b-92d9-e9e59b31a474', 'b02c43ec-aa69-581b-bf45-b64a03e0f4a7', 'MARKDOWN', 'Para que serve o atributo `placeholder`?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f24e68f0-0088-5585-8f77-8617554f1be3', 'b02c43ec-aa69-581b-bf45-b64a03e0f4a7', 'Definir o valor enviado ao servidor', false, 'Não é a opção correta. Placeholder é só uma dica visual e não substitui o <label>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('4f3f152a-6fba-5d23-a8cd-10a908b04736', 'b02c43ec-aa69-581b-bf45-b64a03e0f4a7', 'Mostrar uma dica enquanto o campo está vazio', true, 'Placeholder é só uma dica visual e não substitui o <label>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('38df68b4-cd38-53df-b940-0a746972787a', 'b02c43ec-aa69-581b-bf45-b64a03e0f4a7', 'Substituir o rótulo (label) do campo', false, 'Não é a opção correta. Placeholder é só uma dica visual e não substitui o <label>.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('eaf24b6f-ffb6-5cf7-b8fd-1f930f1a9a23', 'b02c43ec-aa69-581b-bf45-b64a03e0f4a7', 'Limitar o tamanho máximo do texto', false, 'Não é a opção correta. Placeholder é só uma dica visual e não substitui o <label>.') on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('4ee4d6ef-b95e-5180-ab62-183e4263cb6c', 'd7a1d95a-9ff5-58b7-972e-851e353145bc', 'Desafio: formulário de contato', 'Crie um formulário de contato acessível com validação nativa.', 'CHALLENGE', 2, 30, 'html', '<form>
  <!-- Escreva seu código aqui -->
</form>
', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('1703cba3-c912-56d4-9019-3c018c2242b0', '4ee4d6ef-b95e-5180-ab62-183e4263cb6c', 'MARKDOWN', '# Desafio: formulário de contato

Crie um formulário com:

1. Campos **nome**, **e-mail** e **mensagem** (com `<label>` associado)
2. Todos obrigatórios
3. Um botão de envio', 0) on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('1af4cdbd-8102-5868-b950-4f2b30c8d7b5', '9f3f4b09-a9c6-505e-b525-43fdd016cfed', 'Seletores básicos', 'Seletores de tag, classe e id, cores e a regra da cascata.', 'LESSON', 1, 20, 'javascript', null, '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('31a6a71b-27df-5ff4-bdaf-375b83150091', '1af4cdbd-8102-5868-b950-4f2b30c8d7b5', 'MARKDOWN', '# Seletores básicos

```css
p { color: #3fc2fb; }
.destaque { background-color: #fe69ac; }
#topo { font-weight: 700; }
```', 0) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('e75fba10-f591-5827-a1c6-a4476fec71c3', '1af4cdbd-8102-5868-b950-4f2b30c8d7b5', 'MARKDOWN', '## Cascata

Quando duas regras têm a mesma especificidade, **vale a última declarada**.

```css
p { color: red; }
p { color: blue; } /* vence */
```', 1) on conflict (id) do nothing;
insert into public.extra_material (id, lesson_id, title, type, url) values ('c6de6614-3aca-5963-b594-0e0378e3a95f', '1af4cdbd-8102-5868-b950-4f2b30c8d7b5', 'MDN: Seletores CSS', 'URL', 'https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_selectors') on conflict (id) do nothing;
insert into public.quizzes (id, lesson_id) values ('914bdb5c-b3f4-5c49-9f29-99f0fa2d7941', '1af4cdbd-8102-5868-b950-4f2b30c8d7b5') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('76e89c82-d237-5db5-9bc3-9809e507fb0d', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('4678cf53-d87f-5ddd-a738-c8c2109c876d', '76e89c82-d237-5db5-9bc3-9809e507fb0d', 'MARKDOWN', 'O que significa a sigla **CSS**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('45ef4cce-3c1a-539e-9e1b-d5c49dcd6c78', '76e89c82-d237-5db5-9bc3-9809e507fb0d', 'Colorful Style Syntax', false, 'Não é a opção correta. CSS são as folhas de estilo em cascata.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a6a7fc05-401c-5d72-8bf9-6fb16ca79c5e', '76e89c82-d237-5db5-9bc3-9809e507fb0d', 'Cascading Style Sheets', true, 'CSS são as folhas de estilo em cascata.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('d6f63931-3cdb-5cb2-9f65-16002e6beac2', '76e89c82-d237-5db5-9bc3-9809e507fb0d', 'Computed Style Sheets', false, 'Não é a opção correta. CSS são as folhas de estilo em cascata.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('0f0421db-538c-52fa-893f-18b315e46eb2', '76e89c82-d237-5db5-9bc3-9809e507fb0d', 'Creative Style System', false, 'Não é a opção correta. CSS são as folhas de estilo em cascata.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('09092ef4-4afa-5b2b-b0ed-6bee83a5a5ed', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('86fe0eeb-6ce2-55f6-b276-8958ff85587a', '09092ef4-4afa-5b2b-b0ed-6bee83a5a5ed', 'MARKDOWN', 'Como selecionar elementos pela **classe** `destaque`?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('1f11e930-2c58-5cb6-80e8-d270969bb55b', '09092ef4-4afa-5b2b-b0ed-6bee83a5a5ed', '*destaque', false, 'Não é a opção correta. Classes usam ponto no seletor.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ab24831e-cbef-5bf6-b891-83c244c77fcc', '09092ef4-4afa-5b2b-b0ed-6bee83a5a5ed', '.destaque', true, 'Classes usam ponto no seletor.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('1431370c-e223-5057-ba77-8ed6dd00e1a9', '09092ef4-4afa-5b2b-b0ed-6bee83a5a5ed', '#destaque', false, 'Não é a opção correta. Classes usam ponto no seletor.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('d1d9ddeb-e9c3-56d0-93f9-f7873eba68b4', '09092ef4-4afa-5b2b-b0ed-6bee83a5a5ed', 'destaque', false, 'Não é a opção correta. Classes usam ponto no seletor.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('a94f1996-176b-54de-ba6c-1ba3a53ab6ec', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('a0293387-1595-51fa-b3bc-89021c3055ea', 'a94f1996-176b-54de-ba6c-1ba3a53ab6ec', 'MARKDOWN', 'Como selecionar o elemento com **id** `topo`?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('67eefb5d-c9e8-5f5d-968f-823cd48cd86d', 'a94f1996-176b-54de-ba6c-1ba3a53ab6ec', '@topo', false, 'Não é a opção correta. Ids usam cerquilha (#) e devem ser únicos na página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('303e24d3-64d1-5a6e-b575-1c8b521d5ae3', 'a94f1996-176b-54de-ba6c-1ba3a53ab6ec', '#topo', true, 'Ids usam cerquilha (#) e devem ser únicos na página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('53bf8008-6ff3-5793-81d3-967b6d810cc0', 'a94f1996-176b-54de-ba6c-1ba3a53ab6ec', '&topo', false, 'Não é a opção correta. Ids usam cerquilha (#) e devem ser únicos na página.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f16ca8a2-52bb-59ed-a3af-18fbd9f348c0', 'a94f1996-176b-54de-ba6c-1ba3a53ab6ec', '.topo', false, 'Não é a opção correta. Ids usam cerquilha (#) e devem ser únicos na página.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('fafc8b6b-8e6f-506b-a1c0-b316c825f4ed', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('a739b3c3-8f2c-5fc7-8e42-102b2f568192', 'fafc8b6b-8e6f-506b-a1c0-b316c825f4ed', 'MARKDOWN', 'Como estilizar **todos os parágrafos**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('27190552-04d7-557a-943c-8126e39baca7', 'fafc8b6b-8e6f-506b-a1c0-b316c825f4ed', '.p { }', false, 'Não é a opção correta. O seletor de tag usa apenas o nome do elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('e1c54ec3-2e85-51d5-a213-75103b3a225a', 'fafc8b6b-8e6f-506b-a1c0-b316c825f4ed', '#p { }', false, 'Não é a opção correta. O seletor de tag usa apenas o nome do elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('42d17c63-49e6-58d0-a8a0-6783c22710c9', 'fafc8b6b-8e6f-506b-a1c0-b316c825f4ed', 'p { }', true, 'O seletor de tag usa apenas o nome do elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('e7e93bee-90c8-536b-ae65-01b8482e9665', 'fafc8b6b-8e6f-506b-a1c0-b316c825f4ed', '<p> { }', false, 'Não é a opção correta. O seletor de tag usa apenas o nome do elemento.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('74ce7a41-acc7-5ed3-9a2e-74223a911bc1', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('65118b34-6768-517c-86d3-6a19df91078f', '74ce7a41-acc7-5ed3-9a2e-74223a911bc1', 'MARKDOWN', 'Qual propriedade muda a **cor do texto**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('000d7459-46ec-565b-8c65-66fc7d4d736a', '74ce7a41-acc7-5ed3-9a2e-74223a911bc1', 'foreground', false, 'Não é a opção correta. color define a cor do texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('7387c258-3aac-5ec6-9575-e13b92b37df6', '74ce7a41-acc7-5ed3-9a2e-74223a911bc1', 'color', true, 'color define a cor do texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('87697790-222d-5b80-9ebf-93f35daf0d4f', '74ce7a41-acc7-5ed3-9a2e-74223a911bc1', 'font-color', false, 'Não é a opção correta. color define a cor do texto.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('11632342-3b2a-5eca-a7cc-ab306bd17dbd', '74ce7a41-acc7-5ed3-9a2e-74223a911bc1', 'text-color', false, 'Não é a opção correta. color define a cor do texto.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('b0a13625-c92a-56ec-886a-bcfa7209c39a', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('3bdf1a46-25b3-5c35-8438-93f5eef73933', 'b0a13625-c92a-56ec-886a-bcfa7209c39a', 'MARKDOWN', 'Qual propriedade muda a **cor de fundo**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('697ea22c-7833-583d-882a-87a68b6d143b', 'b0a13625-c92a-56ec-886a-bcfa7209c39a', 'color-bg', false, 'Não é a opção correta. background-color pinta o fundo do elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('ca134206-4a0d-5b9d-8d64-ada8f9eab773', 'b0a13625-c92a-56ec-886a-bcfa7209c39a', 'background-color', true, 'background-color pinta o fundo do elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f99f12b4-adba-55b9-9303-0f8439cfc7f0', 'b0a13625-c92a-56ec-886a-bcfa7209c39a', 'fill-background', false, 'Não é a opção correta. background-color pinta o fundo do elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('55754b7f-07cb-5fbe-bcea-c3fae456b55a', 'b0a13625-c92a-56ec-886a-bcfa7209c39a', 'bg', false, 'Não é a opção correta. background-color pinta o fundo do elemento.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('10135c50-053b-551f-ac76-71e174172513', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('1b603a5f-a9e4-5d20-84d2-96f23795bbfd', '10135c50-053b-551f-ac76-71e174172513', 'MARKDOWN', 'Qual seletor escolhe **todos** os elementos?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('f6f78429-b231-5650-9707-be12f942f841', '10135c50-053b-551f-ac76-71e174172513', '.all', false, 'Não é a opção correta. O asterisco é o seletor universal.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('1fdd945c-eb53-57ea-a5c2-c88c2c73d08a', '10135c50-053b-551f-ac76-71e174172513', 'all', false, 'Não é a opção correta. O asterisco é o seletor universal.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('db552a72-d6ff-5ad9-99bd-5443a7039036', '10135c50-053b-551f-ac76-71e174172513', '*', true, 'O asterisco é o seletor universal.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('c4fa0d84-6b2e-544c-b8a8-cc6081b7249e', '10135c50-053b-551f-ac76-71e174172513', '#', false, 'Não é a opção correta. O asterisco é o seletor universal.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('7c08e3dd-30bb-58d1-b745-879c78eda3cb', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('5a7d82ab-b13f-571d-a4ed-69706aa40328', '7c08e3dd-30bb-58d1-b745-879c78eda3cb', 'MARKDOWN', 'Duas regras conflitam com a **mesma especificidade**. Qual vale?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('0f9063b8-d4c3-52d8-b11d-7368d9f6c477', '7c08e3dd-30bb-58d1-b745-879c78eda3cb', 'A que aparece por último', true, 'Na cascata, em empate de especificidade, a última declarada vence.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('a0569322-9fbd-5da4-9ba9-f19c0f9351d9', '7c08e3dd-30bb-58d1-b745-879c78eda3cb', 'O navegador ignora as duas', false, 'Não é a opção correta. Na cascata, em empate de especificidade, a última declarada vence.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('e039b520-1453-5994-b40f-bf7e33ec1fe6', '7c08e3dd-30bb-58d1-b745-879c78eda3cb', 'A que aparece primeiro', false, 'Não é a opção correta. Na cascata, em empate de especificidade, a última declarada vence.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('42bb7296-4526-56d7-9536-edeecc1830a3', '7c08e3dd-30bb-58d1-b745-879c78eda3cb', 'A que tiver menos propriedades', false, 'Não é a opção correta. Na cascata, em empate de especificidade, a última declarada vence.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('b938a7ad-f261-5d62-8862-d04ad7a6f1f1', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('dd3ab720-4944-5108-aced-3d6027857b82', 'b938a7ad-f261-5d62-8862-d04ad7a6f1f1', 'MARKDOWN', 'Qual pseudo-classe aplica estilo ao **passar o mouse**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('308a00bd-eaa1-5c53-b119-609ecf2caaf6', 'b938a7ad-f261-5d62-8862-d04ad7a6f1f1', ':point', false, 'Não é a opção correta. :hover é aplicado enquanto o cursor está sobre o elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('987e89b3-21aa-5486-8617-c9554ec5eb7c', 'b938a7ad-f261-5d62-8862-d04ad7a6f1f1', ':hover', true, ':hover é aplicado enquanto o cursor está sobre o elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('4bb8fa34-cc96-5111-b762-93b054fabb19', 'b938a7ad-f261-5d62-8862-d04ad7a6f1f1', ':mouse', false, 'Não é a opção correta. :hover é aplicado enquanto o cursor está sobre o elemento.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('85e45bad-8a3f-5146-8948-6bbd095003e9', 'b938a7ad-f261-5d62-8862-d04ad7a6f1f1', ':over', false, 'Não é a opção correta. :hover é aplicado enquanto o cursor está sobre o elemento.') on conflict (id) do nothing;
insert into public.questions (id, quiz_id) values ('82dbca7f-940d-51d7-8fd0-e779350d03bd', '914bdb5c-b3f4-5c49-9f29-99f0fa2d7941') on conflict (id) do nothing;
insert into public.section_content (id, question_id, type, content, "order") values ('4fde8c62-47ec-54cf-a495-95a38ae73def', '82dbca7f-940d-51d7-8fd0-e779350d03bd', 'MARKDOWN', 'Como ligar um arquivo CSS **externo**?', 0) on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('b5d2d2bd-7d9b-57a1-914f-f3316665e1ed', '82dbca7f-940d-51d7-8fd0-e779350d03bd', '<script type="css" src="estilo.css">', false, 'Não é a opção correta. A tag <link> no <head> carrega a folha de estilo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('8068e4b8-d4eb-506b-8aae-bc5509d0ceee', '82dbca7f-940d-51d7-8fd0-e779350d03bd', '<style href="estilo.css">', false, 'Não é a opção correta. A tag <link> no <head> carrega a folha de estilo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('add51883-bee3-50ce-b017-bbd7c0a744ff', '82dbca7f-940d-51d7-8fd0-e779350d03bd', '<css src="estilo.css">', false, 'Não é a opção correta. A tag <link> no <head> carrega a folha de estilo.') on conflict (id) do nothing;
insert into public.answers (id, question_id, text, is_correct, reason) values ('e8fdfb31-4be5-56bb-aaf7-ab4505785241', '82dbca7f-940d-51d7-8fd0-e779350d03bd', '<link rel="stylesheet" href="estilo.css">', true, 'A tag <link> no <head> carrega a folha de estilo.') on conflict (id) do nothing;
insert into public.lessons (id, sub_module_id, title, description, type, "order", xp, language, initial_code, created_by, is_validated) values ('1f0fc8a3-f171-51f5-87b1-99a63bcaa078', '9f3f4b09-a9c6-505e-b525-43fdd016cfed', 'Desafio: estilize um card', 'Aplique cores, fundo e efeito de hover em um card.', 'CHALLENGE', 2, 30, 'css', '.card {
  /* Escreva seu CSS aqui */
}
', '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', true) on conflict (id) do nothing;
insert into public.section_content (id, lesson_id, type, content, "order") values ('f8b66340-22e6-5556-8388-efc9f27a0988', '1f0fc8a3-f171-51f5-87b1-99a63bcaa078', 'MARKDOWN', '# Desafio: estilize um card

Estilize a classe `.card`:

1. Fundo escuro e texto claro
2. Um `padding` confortável
3. Mude a cor de fundo ao passar o mouse (`:hover`)', 0) on conflict (id) do nothing;
commit;

update public.submodules s set published = true from public.modules m where m.id = s.module_id and m.in_revision = false and s.id in (select id from public.submodules where module_id in ('11ba5020-4323-5483-9824-1410497398fa', '381a7121-0664-5437-a734-631e004ae378'));
