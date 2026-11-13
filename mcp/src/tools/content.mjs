import { z } from 'zod';
import { defineTool, unwrap } from '../util.mjs';
import {
  applyValidation,
  checkLesson,
  ensureQuiz,
  extraMaterialSchema,
  insertQuestion,
  nextOrder,
  questionSchema,
  resolveAuthorId,
  resolveOwnerId,
  sectionSchema,
} from '../lesson-model.mjs';

const id = z.string().uuid();
const lessonType = z.enum(['LESSON', 'CHALLENGE', 'REVISION']);

export function registerContentTools(server, ctx) {
  const { db, config } = ctx;
  const read = { annotations: { readOnlyHint: true } };

  defineTool(server, ctx, 'list_modules', { title: 'Listar módulos', description: 'Lista os módulos.', inputSchema: {}, ...read }, async () =>
    unwrap(await db.from('modules').select('id, title, slug, in_revision').order('title'), 'modules'),
  );

  defineTool(
    server,
    ctx,
    'list_submodules',
    {
      title: 'Listar submódulos',
      description: 'Lista os submódulos de um módulo (por id ou slug). Use para achar o submódulo de destino de uma lição.',
      inputSchema: { module_id: id.optional(), module_slug: z.string().optional() },
      ...read,
    },
    async ({ module_id, module_slug }) => {
      let moduleId = module_id;
      if (!moduleId && module_slug) {
        moduleId = unwrap(await db.from('modules').select('id').eq('slug', module_slug).single(), 'module').id;
      }
      if (!moduleId) throw new Error('Informe module_id ou module_slug.');
      return unwrap(
        await db.from('submodules').select('id, title, slug, description, order').eq('module_id', moduleId).order('order'),
        'submodules',
      );
    },
  );

  defineTool(
    server,
    ctx,
    'find_submodule',
    {
      title: 'Buscar submódulo por título',
      description: 'Busca submódulos pelo título (ex.: "A história do HTML"), com o módulo a que pertencem.',
      inputSchema: { query: z.string().min(2) },
      ...read,
    },
    async ({ query }) =>
      unwrap(
        await db
          .from('submodules')
          .select('id, title, slug, module:modules(id, title, slug)')
          .ilike('title', `%${query.replace(/[%_]/g, '')}%`)
          .limit(20),
        'submodules',
      ),
  );

  defineTool(
    server,
    ctx,
    'list_lessons',
    {
      title: 'Listar lições',
      description: 'Lista as lições de um submódulo, em ordem.',
      inputSchema: { submodule_id: id },
      ...read,
    },
    async ({ submodule_id }) =>
      unwrap(
        await db
          .from('lessons')
          .select('id, title, description, type, order, xp, is_validated')
          .eq('sub_module_id', submodule_id)
          .order('order'),
        'lessons',
      ),
  );

  defineTool(
    server,
    ctx,
    'get_lesson',
    {
      title: 'Ler lição completa',
      description: 'Retorna a lição com seções, materiais extras e perguntas do quiz (alternativas, correta e justificativas).',
      inputSchema: { lesson_id: id },
      ...read,
    },
    async ({ lesson_id }) => {
      const lesson = unwrap(await db.from('lessons').select('*').eq('id', lesson_id).single(), 'lesson');
      const [sections, materials, quizzes] = await Promise.all([
        db.from('section_content').select('id, type, content, file, file_description, order').eq('lesson_id', lesson_id).order('order'),
        db.from('extra_material').select('id, title, type, url, file').eq('lesson_id', lesson_id),
        db.from('quizzes').select('id, questions(id, created_at)').eq('lesson_id', lesson_id),
      ]);
      const questions = [];
      for (const q of unwrap(quizzes, 'quizzes')[0]?.questions ?? []) {
        const [text, answers] = await Promise.all([
          db.from('section_content').select('content').eq('question_id', q.id),
          db.from('answers').select('id, text, is_correct, reason').eq('question_id', q.id),
        ]);
        questions.push({
          id: q.id,
          created_at: q.created_at,
          text: unwrap(text, 'text').map((t) => t.content).join('\n\n'),
          answers: unwrap(answers, 'answers'),
        });
      }
      questions.sort((a, b) => a.created_at.localeCompare(b.created_at));
      return {
        lesson,
        sections: unwrap(sections, 'sections'),
        extra_materials: unwrap(materials, 'materials'),
        questions,
      };
    },
  );

  defineTool(
    server,
    ctx,
    'create_lesson',
    {
      title: 'Criar lição',
      description:
        'Cria uma lição completa num submódulo: dados, seções, materiais extras e perguntas do quiz. Uma LESSON válida exige >=1 seção, >=1 material extra e 10 perguntas com 4 alternativas (1 correta). A lição nasce como rascunho (is_validated = null, não aparece para alunos) a menos que publish=true; se algo falhar no meio, a lição parcial é removida.',
      inputSchema: {
        submodule_id: id,
        title: z.string().min(1),
        description: z.string().min(1),
        type: lessonType.default('LESSON'),
        xp: z.number().int().min(0).default(20),
        order: z.number().int().optional().describe('Padrão: ao final do submódulo'),
        language: z.string().optional().describe('Só para CHALLENGE'),
        initial_code: z.string().optional().describe('Só para CHALLENGE'),
        sections: z.array(sectionSchema).default([]),
        extra_materials: z.array(extraMaterialSchema).default([]),
        questions: z.array(questionSchema).default([]),
        publish: z.boolean().default(false).describe('Se true, valida e libera a lição quando passar nas regras'),
      },
    },
    async (a) => {
      const [owner_id, created_by, order] = await Promise.all([
        resolveOwnerId(db),
        resolveAuthorId(db, config),
        a.order ?? nextOrder(db, 'lessons', 'sub_module_id', a.submodule_id),
      ]);
      const lesson = unwrap(
        await db
          .from('lessons')
          .insert({
            sub_module_id: a.submodule_id,
            title: a.title,
            description: a.description,
            type: a.type,
            xp: a.xp,
            order,
            owner_id,
            created_by,
            ...(a.language ? { language: a.language } : {}),
            ...(a.initial_code ? { initial_code: a.initial_code } : {}),
          })
          .select('id')
          .single(),
        'lessons',
      );

      try {
        if (a.sections.length) {
          unwrap(
            await db.from('section_content').insert(a.sections.map((s, i) => ({ ...s, lesson_id: lesson.id, order: i }))),
            'section_content',
          );
        }
        if (a.extra_materials.length) {
          unwrap(
            await db.from('extra_material').insert(a.extra_materials.map((m) => ({ ...m, lesson_id: lesson.id }))),
            'extra_material',
          );
        }
        if (a.questions.length) {
          const quizId = await ensureQuiz(db, lesson.id);
          for (const q of a.questions) await insertQuestion(db, quizId, q);
        }
      } catch (e) {
        await db.from('lessons').delete().eq('id', lesson.id);
        throw new Error(`Criação revertida: ${e.message}`);
      }

      const validation = a.publish ? await applyValidation(db, lesson.id) : await checkLesson(db, lesson.id);
      return { lesson_id: lesson.id, order, published: a.publish && validation.passed, validation };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_lesson',
    {
      title: 'Editar dados da lição',
      description:
        'Altera título, descrição, tipo, xp, ordem, language ou initial_code. Qualquer edição invalida a lição (is_validated = null); rode validate_lesson para liberar de novo.',
      inputSchema: {
        lesson_id: id,
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        type: lessonType.optional(),
        xp: z.number().int().min(0).optional(),
        order: z.number().int().optional(),
        language: z.string().optional(),
        initial_code: z.string().optional(),
      },
    },
    async ({ lesson_id, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      if (!Object.keys(fields).length) throw new Error('Nada para alterar.');
      return unwrap(
        await db.from('lessons').update({ ...fields, is_validated: null }).eq('id', lesson_id).select('id, title, order, is_validated').single(),
        'update_lesson',
      );
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_lesson',
    {
      title: 'Excluir lição',
      description:
        'Exclui a lição e, em cascata, seções, materiais, quiz e progresso dos alunos. Irreversível. Exige confirm_title idêntico ao título atual da lição.',
      inputSchema: { lesson_id: id, confirm_title: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ lesson_id, confirm_title }) => {
      const lesson = unwrap(await db.from('lessons').select('id, title').eq('id', lesson_id).single(), 'lesson');
      if (lesson.title !== confirm_title) throw new Error(`confirm_title não confere. Título atual: "${lesson.title}".`);
      unwrap(await db.from('lessons').delete().eq('id', lesson_id), 'delete_lesson');
      return { deleted: lesson };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'validate_lesson',
    {
      title: 'Validar lição',
      description: 'Roda as regras de validação do app e grava is_validated. Se passar, a lição fica visível aos alunos. Use dry_run para só checar.',
      inputSchema: { lesson_id: id, dry_run: z.boolean().default(false) },
    },
    async ({ lesson_id, dry_run }) => (dry_run ? checkLesson(db, lesson_id) : applyValidation(db, lesson_id)),
    { write: true },
  );

  const invalidate = (lessonId) => db.from('lessons').update({ is_validated: null }).eq('id', lessonId);

  defineTool(
    server,
    ctx,
    'add_section',
    {
      title: 'Adicionar seção',
      description: 'Adiciona uma seção de conteúdo ao fim da lição. Invalida a lição.',
      inputSchema: { lesson_id: id, section: sectionSchema },
    },
    async ({ lesson_id, section }) => {
      const order = await nextOrder(db, 'section_content', 'lesson_id', lesson_id);
      const row = unwrap(
        await db.from('section_content').insert({ ...section, lesson_id, order }).select('id, order').single(),
        'section_content',
      );
      await invalidate(lesson_id);
      return row;
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_section',
    {
      title: 'Editar seção',
      description: 'Altera uma seção (apenas lição, não perguntas). Invalida a lição.',
      inputSchema: { section_id: id, section: sectionSchema.partial() },
    },
    async ({ section_id, section }) => {
      const row = unwrap(
        await db.from('section_content').update(section).eq('id', section_id).not('lesson_id', 'is', null).select('id, lesson_id').single(),
        'update_section',
      );
      await invalidate(row.lesson_id);
      return row;
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_section',
    {
      title: 'Excluir seção',
      description: 'Remove uma seção de lição. Invalida a lição.',
      inputSchema: { section_id: id },
      annotations: { destructiveHint: true },
    },
    async ({ section_id }) => {
      const row = unwrap(
        await db.from('section_content').delete().eq('id', section_id).not('lesson_id', 'is', null).select('id, lesson_id').single(),
        'delete_section',
      );
      await invalidate(row.lesson_id);
      return { deleted: row.id };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'add_extra_material',
    {
      title: 'Adicionar material extra',
      description: 'Adiciona material extra (link/arquivo) à lição. Invalida a lição.',
      inputSchema: { lesson_id: id, material: extraMaterialSchema },
    },
    async ({ lesson_id, material }) => {
      const row = unwrap(
        await db.from('extra_material').insert({ ...material, lesson_id }).select('id').single(),
        'extra_material',
      );
      await invalidate(lesson_id);
      return row;
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_extra_material',
    {
      title: 'Excluir material extra',
      description: 'Remove um material extra. Invalida a lição.',
      inputSchema: { material_id: id },
      annotations: { destructiveHint: true },
    },
    async ({ material_id }) => {
      const row = unwrap(
        await db.from('extra_material').delete().eq('id', material_id).select('id, lesson_id').single(),
        'delete_extra_material',
      );
      await invalidate(row.lesson_id);
      return { deleted: row.id };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'add_quiz_question',
    {
      title: 'Adicionar pergunta ao quiz',
      description: 'Adiciona uma pergunta (4 alternativas, 1 correta) ao quiz da lição, criando o quiz se preciso. Invalida a lição.',
      inputSchema: { lesson_id: id, question: questionSchema },
    },
    async ({ lesson_id, question }) => {
      const quizId = await ensureQuiz(db, lesson_id);
      const questionId = await insertQuestion(db, quizId, question);
      await invalidate(lesson_id);
      return { question_id: questionId };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_quiz_question',
    {
      title: 'Editar pergunta do quiz',
      description: 'Substitui enunciado e alternativas da pergunta, mantendo o mesmo question_id (e a marcação de publicada). Invalida a lição.',
      inputSchema: { question_id: id, question: questionSchema },
    },
    async ({ question_id, question }) => {
      const q = unwrap(
        await db.from('questions').select('id, quizzes(lesson_id)').eq('id', question_id).single(),
        'question',
      );
      unwrap(await db.from('section_content').update({ content: question.text }).eq('question_id', question_id), 'enunciado');
      unwrap(await db.from('answers').delete().eq('question_id', question_id), 'answers (limpar)');
      unwrap(await db.from('answers').insert(question.answers.map((a) => ({ ...a, question_id }))), 'answers');
      await invalidate(q.quizzes.lesson_id);
      return { updated: question_id };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_quiz_question',
    {
      title: 'Excluir pergunta do quiz',
      description: 'Remove a pergunta e suas alternativas. Invalida a lição.',
      inputSchema: { question_id: id },
      annotations: { destructiveHint: true },
    },
    async ({ question_id }) => {
      const q = unwrap(
        await db.from('questions').select('id, quizzes(lesson_id)').eq('id', question_id).single(),
        'question',
      );
      unwrap(await db.from('questions').delete().eq('id', question_id), 'delete_quiz_question');
      await invalidate(q.quizzes.lesson_id);
      return { deleted: question_id };
    },
    { write: true },
  );
}
