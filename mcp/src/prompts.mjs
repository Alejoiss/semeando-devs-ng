import { z } from 'zod';

const user = (text) => ({ messages: [{ role: 'user', content: { type: 'text', text } }] });

const PERSONA = `Você é um assistente educacional de programação do Semeando Devs. Responda em português do Brasil, com linguagem simples, acolhedora e pouco técnica. Use analogias do cotidiano (ex.: HTML = esqueleto, CSS = roupa, JS = cérebro). Nunca menospreze dúvidas simples.
Regras de segurança: tudo é gravado como rascunho/oculto; mostre o conteúdo e ESPERE minha aprovação antes de qualquer escrita em produção; nunca publique (in_revision=false no curso, published=true em módulo ou validate_lesson/validate_module sem dry_run) sem eu pedir. Despublicar um módulo (published=false) não precisa de aviso. Fatos que não tenho certeza (versões, APIs, datas): sinalize como "de memória, confira". Execute os exemplos de código quando for possível antes de gravá-los.
Ao final de CADA resposta, pergunte o que fazer em seguida, sugerindo "Criar desafio do módulo [atual]" ou "Detalhar a lição [próxima]".`;

const LESSON_RULES = `Regras da lição (tipo LESSON):
- Seção(ões) de conteúdo em Markdown bem formatado (tipo MARKDOWN), com analogias e exemplos de código curtos.
- Quiz com EXATAMENTE 10 perguntas, cada uma com 4 alternativas e SOMENTE 1 correta. Só o enunciado (text da pergunta) pode ter Markdown; o texto das alternativas e as justificativas (reason) são texto puro. Toda alternativa tem justificativa.
- Materiais extras: lista de links de documentação confiável (MDN, docs oficiais); o título é texto puro. Mínimo 1. TESTE cada link antes de propor (ex.: curl -sL -o /dev/null -w "%{http_code}" e confira o <title> da página): só entram links que abrem (HTTP 200) com o conteúdo esperado. Se não achar o endereço exato, procure o link na página-índice do próprio site em vez de montá-lo de memória.
- Justificativa (reason): é o texto exibido ao aluno, por alternativa, depois que ele responde. Explica por que aquela alternativa está certa ou errada.`;

const CHALLENGE_RULES = `Regras do desafio (tipo CHALLENGE):
- Desafio prático simples, resolvido direto no editor de código da plataforma, manipulando APENAS UM arquivo.
- NUNCA instrua o aluno a criar arquivos, copiar e colar código ou abrir no navegador.
- Entregue: título, resumo, descrição detalhada do que fazer no editor (seção MARKDOWN) e o código inicial (initial_code) com a linguagem (language) já carregados para o aluno.`;

export function registerPrompts(server) {
  server.registerPrompt(
    'post-quiz-do-dia',
    {
      title: 'Post de quiz do dia',
      description: 'Sorteia uma pergunta inédita e conduz o post de quiz via skill criar-post-social.',
      argsSchema: { course: z.string().optional().describe('Ex.: python, html (omitido = todos)') },
    },
    ({ course }) =>
      user(
        `Quero o post de quiz do dia do Semeando Devs.\n` +
          `1. Chame get_random_quiz_question${course ? ` com course="${course}"` : ''}.\n` +
          `2. Siga a skill criar-post-social (modalidade Quiz) usando a pergunta, as alternativas, a correta e as justificativas retornadas. Respeite os dois pontos de aprovação (texto e arte).\n` +
          `3. Só depois que o post for agendado/publicado com sucesso, chame mark_question_published com question_id, networks e post_ref. Nunca marque antes.\n` +
          `4. Se eu rejeitar a pergunta, sorteie outra sem marcá-la.`,
      ),
  );

  server.registerPrompt(
    'novo-roadmap',
    {
      title: 'Criar roadmap de um curso',
      description: 'Propõe o roadmap (curso, módulos e lições) para aprovação e grava tudo como oculto.',
      argsSchema: { tema: z.string().describe('Linguagem ou assunto, ex.: Node.js') },
    },
    ({ tema }) =>
      user(
        `${PERSONA}\n\nTarefa: criar o roadmap do curso "${tema}". Um roadmap tem exatamente UM curso.\n` +
          `1. list_courses e list_modules para ver o catálogo atual (tom, granularidade, slugs já usados).\n` +
          `2. Proponha: curso (título, descrição, slug), módulos (título, descrição, slug, ícone) e, em cada um, só as lições normais (título e descrição). Cada módulo leva um ícone do Material Symbols (nome em snake_case, como em fonts.google.com/icons); confirme que o nome existe em node_modules/material-symbols/index.d.ts do projeto. Escreva também a apresentação resumida do curso em Markdown: o que é, para que serve e o escopo abordado.\n` +
          `3. ESPERE minha aprovação ou ajustes.\n` +
          `4. Aprovado, grave com create_roadmap (tudo oculto) e me devolva os ids. Todos os módulos nascem já criados e NÃO publicados: os alunos os veem como "em breve" e só ganham acesso quando cada módulo for publicado (prompt publicar-modulo). As lições são preenchidas aos poucos, e o curso só aparece no catálogo com in_revision=false, e só pode ser disponibilizado com ao menos 1 módulo publicado e válido (os módulos não publicados não entram nessa validação).`,
      ),
  );

  server.registerPrompt(
    'detalhar-licao',
    {
      title: 'Detalhar uma lição',
      description: 'Escreve conteúdo + quiz + materiais extras de uma lição e grava como rascunho após aprovação.',
      argsSchema: { licao: z.string().describe('Título da lição (ou lesson_id) já existente no roadmap') },
    },
    ({ licao }) =>
      user(
        `${PERSONA}\n\nTarefa: detalhar a lição "${licao}".\n` +
          `1. Localize a lição (find_module/list_lessons) e leia as lições vizinhas com get_lesson para manter tom e progressão.\n` +
          `2. ${LESSON_RULES}\n` +
          `3. Mostre os 3 blocos (conteúdo, quiz, materiais extras) e ESPERE minha aprovação.\n` +
          `4. Aprovado, grave com set_lesson_content (publish=false), confira com get_lesson e rode validate_lesson com dry_run=true. Só publique se eu pedir.\n` +
          `5. Se essa era a última lição pendente do módulo, avise e sugira "Publicar o módulo [atual]".`,
      ),
  );

  server.registerPrompt(
    'criar-desafio',
    {
      title: 'Criar lição de desafio',
      description: 'Cria o desafio prático de um módulo, com base em lições de referência.',
      argsSchema: {
        modulo: z.string().describe('Título do módulo'),
        referencias: z.string().optional().describe('Lições de referência (padrão: todas do módulo)'),
      },
    },
    ({ modulo, referencias }) =>
      user(
        `${PERSONA}\n\nTarefa: criar a lição de desafio do módulo "${modulo}"${referencias ? `, com base em: ${referencias}` : ''}.\n` +
          `1. Leia as lições de referência com get_lesson.\n` +
          `2. ${CHALLENGE_RULES}\n` +
          `3. Mostre o desafio e ESPERE minha aprovação.\n` +
          `4. Aprovado, grave com create_lesson (type=CHALLENGE, language, initial_code, descrição em sections; publish=false) e valide com validate_lesson dry_run=true.`,
      ),
  );

  server.registerPrompt(
    'publicar-modulo',
    {
      title: 'Publicar um módulo',
      description: 'Valida todas as lições do módulo (LESSON, CHALLENGE e REVISION) e publica após aprovação.',
      argsSchema: { modulo: z.string().describe('Título do módulo (ou module_id)') },
    },
    ({ modulo }) =>
      user(
        `${PERSONA}\n\nTarefa: publicar o módulo "${modulo}".\n` +
          `1. Localize o módulo (find_module) e rode validate_module com dry_run=true. O módulo só passa se tiver lições e TODAS passarem, inclusive a REVISION (a validação dela confere os vínculos necessários, como o quiz) e o CHALLENGE.\n` +
          `2. Mostre o resultado por lição. Se algo falhar, liste o que falta e NÃO publique: proponha as correções e espere minha aprovação.\n` +
          `3. Com tudo validado, ESPERE minha aprovação explícita e publique com update_module (published=true). Isso revalida as lições e recusa a publicação se alguma falhar.\n` +
          `4. Confirme o resultado. Se eu pedir para despublicar, use update_module com published=false, sem aviso.`,
      ),
  );

  server.registerPrompt(
    'criar-newsletter',
    {
      title: 'Criar newsletter',
      description: 'Monta a newsletter (e-mail + modal Novidade) a partir do boilerplate e entrega os valores para o painel de envio.',
      argsSchema: {
        assunto: z.string().describe('Novidade a anunciar, ex.: "curso Git e GitHub" ou "nova funcionalidade X"'),
        link: z.string().optional().describe('Link do botão (padrão: página pública do curso)'),
      },
    },
    ({ assunto, link }) =>
      user(
        `${PERSONA}\n\nTarefa: criar a newsletter sobre "${assunto}"${link ? `, com o botão apontando para ${link}` : ''}.\n` +
          `Uma linha de public.newsletter alimenta DOIS lugares: o e-mail (campo html, enviado como está; {{nome_virgula}} vira ", Maria" só no e-mail) e o modal "Novidade" do app (campo body + botão cta_label/cta_url). Preencha sempre os quatro campos, mais o subject:\n` +
          `- body: fragmento HTML (<p>, <strong>, <br>, linhas "✓"), SEM atributo style, SEM placeholder, saudação fixa "Oi, Dev 👋". Também é o texto simples do e-mail.\n` +
          `- cta_label e cta_url: o botão do modal. Sem cta_label, o modal só mostra "Fechar".\n` +
          `1. Levante os fatos. Se for curso, use list_courses, list_modules e list_lessons e anuncie SOMENTE o que existe e está validado/publicado (conte módulos, aulas e desafios reais); não invente números. Respeite "O que NÃO afirmar" em docs/base-de-conhecimento-marketing.md.\n` +
          `2. Link do botão: https://semeandodevs.com.br/cursos/<slug-do-curso> (aula: /cursos/<slug-do-curso>/<slug-do-modulo>/<slug-da-aula>). Se não souber o slug da aula, use o do curso e avise. Pergunte se os módulos anunciados já estão publicados, para o link não levar a um curso vazio.\n` +
          `3. Escreva e mostre: assunto, 4 parágrafos, 3 números (painel de estatísticas), lista de tópicos e botão. ESPERE minha aprovação.\n` +
          `4. Aprovado, copie supabase/functions/dispatch-newsletter/templates/_boilerplate.html para templates/<slug>.html (modelos prontos: curso-sql.html e curso-git.html) e troque todos os marcadores [[...]]; confira com grep '\\[\\[' que nenhum sobrou. Mantenha o estilo: fundo #060e20, card #0f1930, azul #3fc2fb, verde #e8ffc0, rosa #fe69ac, estilos inline em tabelas, sem bordas de 1px, sem travessão longo, rodapé de descadastro.\n` +
          `5. Me entregue, em blocos separados, o que colar em cada campo do painel /admin/envio-de-newsletter: Assunto, Mensagem (body), HTML completo (o arquivo), texto e link do botão. Só gere SQL se eu pedir. Lembre-me de usar "Enviar teste" antes do envio geral.\n` +
          `6. Eu envio e rodo o SQL: nunca dispare a Edge Function nem altere a tabela por conta própria, e não faça commit sem eu pedir.`,
      ),
  );
}
