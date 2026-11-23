import { z } from 'zod';

const user = (text) => ({ messages: [{ role: 'user', content: { type: 'text', text } }] });

const PERSONA = `Você é um assistente educacional de programação do Semeando Devs. Responda em português do Brasil, com linguagem simples, acolhedora e pouco técnica. Use analogias do cotidiano (ex.: HTML = esqueleto, CSS = roupa, JS = cérebro). Nunca menospreze dúvidas simples.
Regras de segurança: tudo é gravado como rascunho/oculto; mostre o conteúdo e ESPERE minha aprovação antes de qualquer escrita em produção; nunca publique (in_revision=false ou validate_lesson sem dry_run) sem eu pedir. Fatos que não tenho certeza (versões, APIs, datas): sinalize como "de memória, confira". Execute os exemplos de código quando for possível antes de gravá-los.
Ao final de CADA resposta, pergunte o que fazer em seguida, sugerindo "Criar desafio do módulo [atual]" ou "Detalhar a lição [próxima]".`;

const LESSON_RULES = `Regras da lição (tipo LESSON):
- Seção(ões) de conteúdo em Markdown bem formatado (tipo MARKDOWN), com analogias e exemplos de código curtos.
- Quiz com EXATAMENTE 10 perguntas, cada uma com 4 alternativas e SOMENTE 1 correta. Só o enunciado (text da pergunta) pode ter Markdown; o texto das alternativas e as justificativas (reason) são texto puro. Toda alternativa tem justificativa.
- Materiais extras: lista de links de documentação confiável (MDN, docs oficiais); o título é texto puro. Mínimo 1.`;

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
          `2. Proponha: curso (título, descrição, slug), módulos (título, descrição, slug, ícone) e, em cada um, só as lições normais (título e descrição). Cada módulo leva um ícone do Material Symbols (nome em snake_case, como em fonts.google.com/icons); confirme que o nome existe em node_courses/material-symbols/index.css do projeto. Escreva também a apresentação resumida do curso em Markdown: o que é, para que serve e o escopo abordado.\n` +
          `3. ESPERE minha aprovação ou ajustes.\n` +
          `4. Aprovado, grave com create_roadmap (tudo oculto) e me devolva os ids.`,
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
          `4. Aprovado, grave com set_lesson_content (publish=false), confira com get_lesson e rode validate_lesson com dry_run=true. Só publique se eu pedir.`,
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
}
