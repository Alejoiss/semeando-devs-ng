import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyModuleValidation, checkCourseReadiness, checkModule } from '../src/lesson-model.mjs';

function fakeDb(lessons) {
  const updates = [];
  const db = {
    updates,
    from(table) {
      const q = {
        select: () => q,
        eq: () => q,
        order: () => Promise.resolve({ data: lessons, error: null }),
        update: (patch) => ({
          eq: (_c, id) => {
            updates.push({ table, id, patch });
            return Promise.resolve({ error: null });
          },
        }),
      };
      return q;
    },
  };
  return db;
}

const LESSONS = [
  { id: 'l', title: 'Aula', type: 'LESSON', order: 1 },
  { id: 'c', title: 'Desafio', type: 'CHALLENGE', order: 2 },
  { id: 'r', title: 'Revisão', type: 'REVISION', order: 3 },
];
const verdicts = (map) => async (_db, id) => ({ passed: map[id] === undefined, problems: map[id] ? [map[id]] : [] });

test('a module without lessons does not pass', async () => {
  const result = await checkModule(fakeDb([]), 'm', verdicts({}));
  assert.equal(result.passed, false);
  assert.deepEqual(result.problems, ['O módulo não tem lições.']);
});

test('a module passes only when every lesson passes, REVISION included', async () => {
  assert.equal((await checkModule(fakeDb(LESSONS), 'm', verdicts({}))).passed, true);

  const result = await checkModule(fakeDb(LESSONS), 'm', verdicts({ r: 'Revisão não pode ter mais de 1 quiz.' }));
  assert.equal(result.passed, false);
  assert.deepEqual(result.problems, ['Revisão (REVISION): Revisão não pode ter mais de 1 quiz.']);
  assert.deepEqual(result.lessons.map((l) => l.passed), [true, true, false]);
});

test('applying the validation records is_validated on each lesson', async () => {
  const db = fakeDb(LESSONS);
  await applyModuleValidation(db, 'm', verdicts({ c: 'Falta language.' }));
  assert.deepEqual(db.updates.map((u) => [u.id, u.patch.is_validated]), [['l', true], ['c', false], ['r', true]]);
});

function courseDb(modules, lessonsByModule) {
  return {
    from(table) {
      let moduleId;
      const q = {
        select: () => q,
        eq: (column, value) => {
          if (column === 'sub_module_id') moduleId = value;
          return q;
        },
        order: () => Promise.resolve({ data: table === 'submodules' ? modules : lessonsByModule[moduleId], error: null }),
      };
      return q;
    },
  };
}

test('a course is ready when at least one published module is valid, whatever the others are', async () => {
  const db = courseDb([{ id: 'm1', title: 'Quebrado' }, { id: 'm2', title: 'Pronto' }], { m1: [{ id: 'x', title: 'X', type: 'LESSON' }], m2: [{ id: 'y', title: 'Y', type: 'LESSON' }] });
  const result = await checkCourseReadiness(db, 'c', async (_db, id) => ({ passed: id === 'y', problems: id === 'y' ? [] : ['Falta conteúdo.'] }));
  assert.deepEqual(result, { passed: true, problems: [] });
});

test('a course is not ready without a published module or when none of them is valid', async () => {
  assert.deepEqual(await checkCourseReadiness(courseDb([], {}), 'c'), { passed: false, problems: ['O curso não tem nenhum módulo publicado.'] });

  const db = courseDb([{ id: 'm1', title: 'Quebrado' }], { m1: [{ id: 'x', title: 'X', type: 'LESSON' }] });
  const result = await checkCourseReadiness(db, 'c', async () => ({ passed: false, problems: ['Falta conteúdo.'] }));
  assert.equal(result.passed, false);
  assert.match(result.problems[0], /^Quebrado: X \(LESSON\): Falta conteúdo\.$/);
});
