import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diagnoseLessonProgress, groupAttemptsByLesson } from '../src/tools/students.mjs';

const done = (score, completed) => ({ score, completed, completed_at: '2026-11-27T12:00:00Z' });

test('reprovada em todas as tentativas', () => {
  const r = diagnoseLessonProgress({
    attempts: [done(5, false), done(6, false)],
    lessonRows: [{ completed: false }],
    totalQuestions: 10,
  });
  assert.match(r.diagnosis, /^NOT_PASSED/);
  assert.equal(r.best_score, 6);
  assert.equal(r.passing_score, 7);
});

test('aprovada mas lição não concluída é bug', () => {
  const r = diagnoseLessonProgress({ attempts: [done(8, true)], lessonRows: [{ completed: false }], totalQuestions: 10 });
  assert.match(r.diagnosis, /^BUG/);
});

test('linhas duplicadas e lição não iniciada', () => {
  assert.match(
    diagnoseLessonProgress({ attempts: [], lessonRows: [{ completed: false }, { completed: true }], totalQuestions: 10 }).diagnosis,
    /^DUPLICATE/,
  );
  assert.match(diagnoseLessonProgress({ attempts: [], lessonRows: [], totalQuestions: 10 }).diagnosis, /^NOT_STARTED/);
});

test('aprovada e concluída', () => {
  const r = diagnoseLessonProgress({ attempts: [done(9, true)], lessonRows: [{ completed: true }], totalQuestions: 10 });
  assert.match(r.diagnosis, /^OK/);
});

test('agrupa tentativas e linhas de user_lessons por lição', () => {
  const lesson = (id, title) => ({ id, title, submodules: { title: 'M', modules: { title: 'C' } } });
  const attempts = [
    { id: 'a1', score: 5, created_at: '2026-11-27T10:00:00Z', quizzes: { lessons: lesson('l1', 'Um') } },
    { id: 'a2', score: 9, created_at: '2026-11-27T11:00:00Z', quizzes: { lessons: lesson('l1', 'Um') } },
    { id: 'a3', score: 7, created_at: '2026-11-27T12:00:00Z', quizzes: { lessons: lesson('l2', 'Dois') } },
  ];
  const rows = [
    { id: 'r1', lesson_id: 'l1', completed: true, lessons: lesson('l1', 'Um') },
    { id: 'r3', lesson_id: 'l3', completed: false, lessons: lesson('l3', 'Três') },
  ];
  const groups = groupAttemptsByLesson(attempts, rows);
  assert.deepEqual(groups.map((g) => g.lesson_id), ['l2', 'l1', 'l3']);
  assert.equal(groups.find((g) => g.lesson_id === 'l1').attempts.length, 2);
  assert.equal(groups.find((g) => g.lesson_id === 'l3').attempts.length, 0);
  assert.equal(groups[0].attempts[0].quizzes, undefined);
  assert.equal(groups[0].course, 'C');
});
