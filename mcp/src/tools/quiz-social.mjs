import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { defineTool, unwrap } from '../util.mjs';

const PAGE = 1000;

async function fetchAll(buildQuery, context) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const page = unwrap(await buildQuery().order('id').range(from, from + PAGE - 1), context);
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const normalize = (v) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const matches = (query, ...fields) => fields.some((f) => normalize(f).includes(normalize(query)));

async function loadQuestion(db, row) {
  const [content, answers] = await Promise.all([
    db.from('section_content').select('content, "order"').eq('question_id', row.id).order('order'),
    db.from('answers').select('id, text, is_correct, reason').eq('question_id', row.id),
  ]);
  const text = unwrap(content, 'section_content')
    .map((s) => s.content)
    .filter(Boolean)
    .join('\n\n');
  const options = unwrap(answers, 'answers');
  const correct = options.filter((a) => a.is_correct);
  if (!text || options.length !== 4 || correct.length !== 1) return null;

  const lesson = row.quizzes.lessons;
  return {
    question_id: row.id,
    question: text,
    options: options.map((a) => ({ id: a.id, text: a.text, is_correct: a.is_correct, reason: a.reason })),
    correct_answer: correct[0].text,
    source: {
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      module: lesson.submodules?.title,
      course: lesson.submodules?.modules?.title,
      course_slug: lesson.submodules?.modules?.slug,
    },
  };
}

export function registerQuizSocialTools(server, ctx) {
  const { db } = ctx;

  defineTool(
    server,
    ctx,
    'get_random_quiz_question',
    {
      title: 'Pergunta aleatória para post de quiz',
      description:
        'Sorteia uma pergunta de quiz (com 4 alternativas, a correta e a justificativa de cada) que ainda NÃO foi publicada nas redes sociais, de aulas validadas. Não marca como publicada: chame mark_question_published só depois que o post der certo.',
      inputSchema: {
        course: z
          .string()
          .optional()
          .describe('Curso por nome ou slug, sem diferenciar maiúsculas/acentos (ex.: "python", "html"). Omitido = todos'),
        module: z.string().optional().describe('Filtra por parte do título do módulo (ex.: "operadores")'),
        lesson_id: z.string().uuid().optional().describe('Restringe a uma aula'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ course, module, lesson_id }) => {
      const rows = await fetchAll(
        () =>
          db
            .from('questions')
            .select(
              'id, quizzes!inner(lesson_id, lessons!inner(id, title, is_validated, submodules(title, modules(title, slug))))',
            )
            .eq('quizzes.lessons.is_validated', true),
        'questions',
      );
      const published = new Set(
        (await fetchAll(() => db.from('social_published_questions').select('question_id'), 'published')).map(
          (r) => r.question_id,
        ),
      );

      const modOf = (r) => r.quizzes.lessons.submodules?.modules;
      let scoped = rows;
      if (course) {
        scoped = scoped.filter((r) => matches(course, modOf(r)?.slug, modOf(r)?.title));
        if (!scoped.length) {
          const available = [...new Set(rows.map((r) => modOf(r)?.title).filter(Boolean))].sort();
          throw new Error(`Nenhum curso com perguntas corresponde a "${course}". Disponíveis: ${available.join(', ')}.`);
        }
      }
      if (module) scoped = scoped.filter((r) => matches(module, r.quizzes.lessons.submodules?.title));
      if (lesson_id) scoped = scoped.filter((r) => r.quizzes.lessons.id === lesson_id);

      const candidates = scoped.filter((r) => !published.has(r.id));

      const pool = [...candidates];
      while (pool.length) {
        const [row] = pool.splice(randomInt(pool.length), 1);
        const question = await loadQuestion(db, row);
        if (question)
          return { total_in_scope: scoped.length, remaining_unpublished: candidates.length, ...question };
      }
      return {
        total_in_scope: scoped.length,
        remaining_unpublished: 0,
        message: 'Nenhuma pergunta elegível ainda não publicada neste filtro.',
      };
    },
  );

  defineTool(
    server,
    ctx,
    'mark_question_published',
    {
      title: 'Marcar pergunta como publicada',
      description:
        'Registra que a pergunta já foi publicada nas redes, para nunca mais ser sorteada. Chame apenas depois que o post for criado/agendado com sucesso.',
      inputSchema: {
        question_id: z.string().uuid(),
        networks: z.array(z.string()).default([]).describe('Ex.: ["instagram","linkedin"]'),
        post_ref: z.string().optional().describe('Link ou id do post (Buffer/Trello)'),
      },
      annotations: { idempotentHint: true },
    },
    async ({ question_id, networks, post_ref }) =>
      unwrap(
        await db
          .from('social_published_questions')
          .upsert({ question_id, networks, post_ref: post_ref ?? null }, { onConflict: 'question_id' })
          .select()
          .single(),
        'mark_question_published',
      ),
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'unmark_question_published',
    {
      title: 'Desfazer marcação de publicada',
      description: 'Remove a marcação de publicada (ex.: o post foi cancelado), devolvendo a pergunta ao sorteio.',
      inputSchema: { question_id: z.string().uuid() },
    },
    async ({ question_id }) => {
      unwrap(await db.from('social_published_questions').delete().eq('question_id', question_id), 'unmark');
      return { unmarked: question_id };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'list_published_questions',
    {
      title: 'Perguntas já publicadas',
      description: 'Lista as perguntas já publicadas nas redes, da mais recente para a mais antiga.',
      inputSchema: { limit: z.number().int().min(1).max(200).default(30) },
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) =>
      unwrap(
        await db
          .from('social_published_questions')
          .select('question_id, networks, post_ref, published_at')
          .order('published_at', { ascending: false })
          .limit(limit),
        'list_published_questions',
      ),
  );
}
