import { z } from 'zod';
import { defineTool, unwrap } from '../util.mjs';

const PASS_RATIO = 0.7;
const USERS_PAGE = 200;

async function findUserIdByEmail(db, email) {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: USERS_PAGE });
    if (error) throw new Error(`auth.users: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === wanted);
    if (hit) return hit.id;
    if (data.users.length < USERS_PAGE) return null;
  }
}

export function diagnoseLessonProgress({ attempts, lessonRows, totalQuestions }) {
  const finished = attempts.filter((a) => a.completed_at);
  const best = finished.reduce((max, a) => Math.max(max, a.score ?? 0), 0);
  const passingScore = Math.ceil(totalQuestions * PASS_RATIO);
  const lessonCompleted = lessonRows.some((r) => r.completed);
  const passedAttempt = finished.some((a) => a.completed);

  let diagnosis;
  if (lessonRows.length > 1) diagnosis = 'DUPLICATE_USER_LESSON: mais de uma linha em user_lessons para o mesmo aluno e lição.';
  else if (lessonRows.length === 0) diagnosis = 'NOT_STARTED: não existe user_lessons (a lição nunca foi iniciada).';
  else if (passedAttempt && !lessonCompleted) diagnosis = 'BUG: há tentativa aprovada, mas user_lessons.completed = false.';
  else if (!passedAttempt && finished.length > 0) diagnosis = `NOT_PASSED: nenhuma tentativa chegou a ${passingScore}/${totalQuestions}; melhor nota ${best}.`;
  else if (finished.length === 0) diagnosis = 'NO_FINISHED_ATTEMPT: nenhuma tentativa finalizada (o envio do resultado pode ter falhado).';
  else diagnosis = 'OK: lição concluída.';

  return { diagnosis, best_score: best, passing_score: passingScore, total_questions: totalQuestions };
}

export function groupAttemptsByLesson(attempts, lessonRows) {
  const lessons = new Map();
  const entry = (lessonId, info) => {
    if (!lessons.has(lessonId)) lessons.set(lessonId, { lesson_id: lessonId, ...info, user_lessons: [], attempts: [] });
    return lessons.get(lessonId);
  };
  for (const a of attempts) {
    const lesson = a.quizzes?.lessons;
    if (!lesson) continue;
    const { quizzes, ...attempt } = a;
    entry(lesson.id, {
      lesson_title: lesson.title,
      module: lesson.submodules?.title,
      course: lesson.submodules?.modules?.title,
    }).attempts.push(attempt);
  }
  for (const r of lessonRows) {
    const { lessons: lesson, ...row } = r;
    entry(r.lesson_id, {
      lesson_title: lesson?.title,
      module: lesson?.submodules?.title,
      course: lesson?.submodules?.modules?.title,
    }).user_lessons.push(row);
  }
  return [...lessons.values()].sort((a, b) =>
    (b.attempts.at(-1)?.created_at ?? '').localeCompare(a.attempts.at(-1)?.created_at ?? ''),
  );
}

async function allLessonsProgress(db, userId) {
  const lessonJoin = 'title, submodules(title, modules(title))';
  const attempts = unwrap(
    await db
      .from('user_quizzes')
      .select(`id, score, spent_time, completed, completed_at, created_at, quizzes(lessons(id, ${lessonJoin}))`)
      .eq('user_id', userId)
      .order('created_at'),
    'user_quizzes',
  );
  const lessonRows = unwrap(
    await db
      .from('user_lessons')
      .select(`id, lesson_id, completed, completed_at, lessons(${lessonJoin})`)
      .eq('user_id', userId),
    'user_lessons',
  );
  return {
    user_id: userId,
    total_attempts: attempts.length,
    lessons: groupAttemptsByLesson(attempts, lessonRows),
  };
}

export function registerStudentTools(server, ctx) {
  const { db } = ctx;

  defineTool(
    server,
    ctx,
    'get_student_lesson_progress',
    {
      title: 'Progresso de um aluno em uma lição',
      description:
        'Somente leitura. Com lesson_id: tentativas de quiz (nota, aprovada, data) e linha de user_lessons do aluno naquela lição, com um diagnóstico de por que a próxima não libera. Sem lesson_id: todas as tentativas do aluno em todas as lições, agrupadas por lição. Informe user_id ou email.',
      inputSchema: {
        lesson_id: z.string().uuid().optional().describe('Omitido = todas as lições do aluno'),
        user_id: z.string().uuid().optional(),
        email: z.string().email().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ lesson_id, user_id, email }) => {
      if (!user_id && !email) throw new Error('Informe user_id ou email.');
      const userId = user_id ?? (await findUserIdByEmail(db, email));
      if (!userId) throw new Error('Aluno não encontrado.');

      if (!lesson_id) return allLessonsProgress(db, userId);

      const quiz = unwrap(
        await db.from('quizzes').select('id').eq('lesson_id', lesson_id).maybeSingle(),
        'quizzes',
      );
      const lessonRows = unwrap(
        await db
          .from('user_lessons')
          .select('id, completed, completed_at')
          .eq('user_id', userId)
          .eq('lesson_id', lesson_id),
        'user_lessons',
      );

      let attempts = [];
      let totalQuestions = 0;
      if (quiz) {
        attempts = unwrap(
          await db
            .from('user_quizzes')
            .select('id, score, spent_time, completed, completed_at, created_at')
            .eq('user_id', userId)
            .eq('quiz_id', quiz.id)
            .order('created_at'),
          'user_quizzes',
        );
        const { count, error } = await db
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id);
        if (error) throw new Error(`questions: ${error.message}`);
        totalQuestions = count ?? 0;
      }

      return {
        user_id: userId,
        lesson_id,
        ...diagnoseLessonProgress({ attempts, lessonRows, totalQuestions }),
        user_lessons: lessonRows,
        attempts,
      };
    },
  );
}
