import { test, expect } from './support/test';
import { E2E_USERS, storageStateFor } from './support/users';

const LESSON_ID = '0fb4e367-514b-5e00-889c-e2c1b08d6efd';

test.describe('legacy URLs from before the course/module rename', () => {
    test.describe('student area', () => {
        test.use({ storageState: storageStateFor('subscriber') });

        const cases: [string, RegExp][] = [
            ['/app/s/html-essencial', /\/app\/c\/html-essencial$/],
            ['/app/s/html-essencial/ss/primeiros-passos', /\/app\/c\/html-essencial\/m\/primeiros-passos$/],
            [`/app/s/html-essencial/ss/primeiros-passos/lesson/${LESSON_ID}`, new RegExp(`/app/c/html-essencial/m/primeiros-passos/lesson/${LESSON_ID}$`)],
            [`/app/s/html-essencial/ss/primeiros-passos/lesson/${LESSON_ID}/quiz`, new RegExp(`/app/c/html-essencial/m/primeiros-passos/lesson/${LESSON_ID}/quiz$`)],
            ['/app/s/html-essencial/finished', /\/app\/c\/html-essencial\/finished$/],
        ];

        for (const [legacy, expected] of cases) {
            test(`${legacy} redirects to the new URL`, async ({ page }) => {
                await page.goto(legacy);
                await expect(page).toHaveURL(expected);
            });
        }

        test('the redirected course page renders', async ({ page }) => {
            await page.goto('/app/s/html-essencial');
            await expect(page.getByRole('heading', { level: 1, name: 'HTML Essencial' })).toBeVisible();
        });
    });

    test.describe('teacher area', () => {
        test.use({ storageState: storageStateFor('teacher') });

        const cases: [string, RegExp][] = [
            ['/professor/meus-modulos', /\/professor\/meus-cursos$/],
            ['/professor/criar-modulo', /\/professor\/criar-curso$/],
            ['/professor/criar-submodulo/abc', /\/professor\/criar-modulo\/abc$/],
            ['/professor/editar-submodulo/abc', /\/professor\/editar-modulo\/abc$/],
        ];

        for (const [legacy, expected] of cases) {
            test(`${legacy} redirects to the new URL`, async ({ page }) => {
                await page.goto(legacy);
                await expect(page).toHaveURL(expected);
            });
        }
    });
});
