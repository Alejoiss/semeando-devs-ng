import { test, expect } from './support/test';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

const userId = E2E_USERS.limited.id;
const COMPLETED_TODAY = [
    '0fb4e367-514b-5e00-889c-e2c1b08d6efd',
    '8274a0fa-6560-5d31-b1e5-77a3ed3769a9',
    'e50f4c5f-303e-5377-9768-8fbd7de5e9b4',
    '0ba1e272-a3c2-536f-93e2-9ef72798eed1',
    '1af4cdbd-8102-5868-b950-4f2b30c8d7b5',
];
const NEW_LESSON = 'da235cfc-d669-56c7-b33d-445607b61bf2';
const NEW_CHALLENGE = '4ee4d6ef-b95e-5180-ab62-183e4263cb6c';
const MODULE_PATH = '/app/c/html-essencial/m/formularios';
const lessonPath = (id: string) => `/app/c/html-essencial/m/formularios/lesson/${id}`;

test.describe('daily lesson limit (free plan)', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: storageStateFor('limited') });

    test.beforeEach(() => {
        sql(`update profiles set is_pro = false, pro_until = null where id = '${userId}'`);
        sql(`delete from user_lessons where user_id = '${userId}'`);
        for (const lessonId of COMPLETED_TODAY) {
            sql(`insert into user_lessons (user_id, lesson_id, completed, completed_at) values ('${userId}', '${lessonId}', true, now())`);
        }
    });

    test('after five lessons today the next lesson is blocked and offers the upgrade', async ({ page }) => {
        await page.goto(MODULE_PATH);

        await expect(page.getByText('5/5')).toBeVisible();
        const lesson = page.getByRole('article').filter({ hasText: 'Campos de formulário' });
        await expect(lesson.getByText('Bloqueado')).toBeVisible();
        await expect(lesson.getByRole('button', { name: /Iniciar/ })).toHaveCount(0);

        await lesson.getByRole('link', { name: /Upgrade para Pró/ }).click();
        await expect(page).toHaveURL(/\/app\/upgrade$/);
    });

    test('a lesson already completed today can still be reviewed', async ({ page }) => {
        await page.goto('/app/c/html-essencial/m/primeiros-passos');

        await expect(page.getByText('5/5')).toBeVisible();
        const lesson = page.getByRole('article').filter({ hasText: 'O que é HTML?' });
        await expect(lesson.getByRole('link', { name: /Rever Aula/ })).toBeVisible();
    });

    test('the blocked screen explains the limit and links to the upgrade', async ({ page }) => {
        await page.goto(`${lessonPath(NEW_LESSON)}?bloqueado=1`);

        await expect(page.getByRole('heading', { level: 1, name: 'Limite diário atingido' })).toBeVisible();
        await page.getByRole('link', { name: 'Fazer upgrade para Pró' }).click();
        await expect(page).toHaveURL(/\/app\/upgrade$/);
    });

    test('lessons completed on a previous day do not count towards today', async ({ page }) => {
        sql(`update user_lessons set completed_at = now() - interval '2 days' where user_id = '${userId}'`);

        await page.goto(MODULE_PATH);

        await expect(page.getByText('0/5')).toBeVisible();
        const lesson = page.getByRole('article').filter({ hasText: 'Campos de formulário' });
        await expect(lesson.getByRole('button', { name: /Iniciar/ })).toBeVisible();
    });

    test('a Pro student is not limited', async ({ page }) => {
        sql(`update profiles set is_pro = true, pro_until = now() + interval '30 days' where id = '${userId}'`);

        await page.goto(MODULE_PATH);

        await expect(page.getByText('Lições hoje')).toHaveCount(0);
        const lesson = page.getByRole('article').filter({ hasText: 'Campos de formulário' });
        await expect(lesson.getByRole('button', { name: /Iniciar/ })).toBeVisible();
        await expect(lesson.getByText('Bloqueado')).toHaveCount(0);
    });

    for (const [label, path] of [
        ['lesson', lessonPath(NEW_LESSON)],
        ['quiz', `${lessonPath(NEW_LESSON)}/quiz`],
        ['challenge', `${lessonPath(NEW_CHALLENGE)}/challenge`],
    ]) {
        test(`opening the ${label} URL directly is blocked at the limit`, async ({ page }) => {
            await page.goto(path);

            await expect(page).toHaveURL(/\?bloqueado=1$/);
            await expect(page.getByRole('heading', { level: 1, name: 'Limite diário atingido' })).toBeVisible();
        });
    }
});
