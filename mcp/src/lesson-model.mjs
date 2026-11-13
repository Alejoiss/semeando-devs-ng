import { z } from 'zod';
import { unwrap } from './util.mjs';

export const answerSchema = z.object({
  text: z.string().min(1),
  is_correct: z.boolean(),
  reason: z.string().min(1).describe('Justificativa exibida ao aluno e usada nos posts'),
});

export const questionSchema = z
  .object({
    text: z.string().min(1).describe('Enunciado em markdown'),
    answers: z.array(answerSchema).length(4),
  })
  .refine((q) => q.answers.filter((a) => a.is_correct).length === 1, 'Exatamente 1 alternativa correta');

export const sectionSchema = z.object({
  type: z.enum(['TEXT', 'MARKDOWN', 'VIDEO', 'IMAGE']).default('MARKDOWN'),
  content: z.string().optional(),
  file: z.string().optional().describe('URL do vídeo/imagem'),
  file_description: z.string().optional(),
});

export const extraMaterialSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['URL', 'FILE']).default('URL'),
  url: z.string().optional(),
  file: z.string().optional(),
});

export async function nextOrder(db, table, filterColumn, filterValue) {
  const rows = unwrap(
    await db.from(table).select('"order"').eq(filterColumn, filterValue).order('order', { ascending: false }).limit(1),
    `${table} order`,
  );
  return (rows[0]?.order ?? 0) + 1;
}

export async function resolveOwnerId(db) {
  const rows = unwrap(await db.from('owners').select('id').order('created_at').limit(1), 'owners');
  if (!rows[0]) throw new Error('Nenhum registro em owners; lessons.owner_id é obrigatório.');
  return rows[0].id;
}

export async function resolveAuthorId(db, config) {
  if (config.authorUserId) return config.authorUserId;
  const rows = unwrap(
    await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1),
    'profiles',
  );
  return rows[0]?.id ?? null;
}

export async function insertQuestion(db, quizId, question) {
  const { id: questionId } = unwrap(
    await db.from('questions').insert({ quiz_id: quizId }).select('id').single(),
    'questions',
  );
  unwrap(
    await db.from('section_content').insert({ question_id: questionId, type: 'MARKDOWN', content: question.text, order: 0 }),
    'section_content (pergunta)',
  );
  unwrap(
    await db.from('answers').insert(question.answers.map((a) => ({ ...a, question_id: questionId }))),
    'answers',
  );
  return questionId;
}

export async function ensureQuiz(db, lessonId) {
  const existing = unwrap(await db.from('quizzes').select('id').eq('lesson_id', lessonId), 'quizzes');
  if (existing[0]) return existing[0].id;
  return unwrap(await db.from('quizzes').insert({ lesson_id: lessonId }).select('id').single(), 'quizzes').id;
}

// Espelha as regras de LessonService.validateLesson do app Angular.
export async function checkLesson(db, lessonId) {
  const lesson = unwrap(
    await db.from('lessons').select('id, type, language, initial_code').eq('id', lessonId).single(),
    'lesson',
  );
  const problems = [];
  const countOf = async (table) => {
    const { count: c, error } = await db.from(table).select('*', { count: 'exact', head: true }).eq('lesson_id', lessonId);
    if (error) throw new Error(`${table}: ${error.message}`);
    return c ?? 0;
  };

  const quizzes = unwrap(await db.from('quizzes').select('id').eq('lesson_id', lessonId), 'quizzes');

  if (lesson.type === 'LESSON') {
    if ((await countOf('section_content')) < 1) problems.push('Precisa de ao menos 1 seção de conteúdo.');
    if ((await countOf('extra_material')) < 1) problems.push('Precisa de ao menos 1 material extra.');
    if (quizzes.length !== 1) {
      problems.push('Precisa de exatamente 1 quiz.');
    } else {
      const questions = unwrap(await db.from('questions').select('id').eq('quiz_id', quizzes[0].id), 'questions');
      if (questions.length !== 10) problems.push(`O quiz precisa de 10 perguntas (tem ${questions.length}).`);
      for (const [i, q] of questions.entries()) {
        const answers = unwrap(await db.from('answers').select('is_correct').eq('question_id', q.id), 'answers');
        if (answers.length !== 4) problems.push(`Pergunta ${i + 1}: precisa de 4 alternativas (tem ${answers.length}).`);
        else if (answers.filter((a) => a.is_correct).length !== 1)
          problems.push(`Pergunta ${i + 1}: precisa de exatamente 1 correta.`);
      }
    }
  } else if (lesson.type === 'CHALLENGE') {
    if ((await countOf('section_content')) < 1) problems.push('Precisa de ao menos 1 seção de conteúdo.');
    if (!lesson.language?.trim()) problems.push('Falta language.');
    if (!lesson.initial_code?.trim()) problems.push('Falta initial_code.');
  } else if (quizzes.length > 1) {
    problems.push('Revisão não pode ter mais de 1 quiz.');
  }

  return { passed: problems.length === 0, problems };
}

export async function applyValidation(db, lessonId) {
  const result = await checkLesson(db, lessonId);
  unwrap(await db.from('lessons').update({ is_validated: result.passed }).eq('id', lessonId), 'is_validated');
  return result;
}
