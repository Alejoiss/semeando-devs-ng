import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyModuleValidation, checkModule } from '../src/lesson-model.mjs';

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
