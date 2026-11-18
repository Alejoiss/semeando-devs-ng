import { test, expect } from './support/test';
import { storageStateFor } from './support/users';

const LESSON = '/app/s/html-essencial/ss/primeiros-passos/lesson/0fb4e367-514b-5e00-889c-e2c1b08d6efd';

test.describe('mobile viewport', () => {
    test.use({ storageState: storageStateFor('challenger') });

    test('the side menu opens from the header and navigates', async ({ page }) => {
        await page.goto('/app');
        const ranking = page.getByRole('link', { name: /Rankings/ });
        await expect(ranking).toBeHidden();

        await page.getByRole('button', { name: 'menu' }).first().click();
        await expect(ranking).toBeVisible();
        await ranking.click();

        await expect(page).toHaveURL(/\/app\/ranking$/);
        await expect(page.getByRole('heading', { level: 1, name: 'Ranking da Comunidade' })).toBeVisible();
    });

    for (const path of ['/app', '/app/s/html-essencial', LESSON, '/app/ranking', '/app/conquistas', '/app/upgrade']) {
        test(`${path} does not scroll horizontally`, async ({ page }) => {
            await page.goto(path);
            await expect(page.getByRole('heading').first()).toBeVisible();
            await page.waitForTimeout(1000);

            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(overflow).toBeLessThanOrEqual(0);
        });
    }

    test('the quiz can be answered on a small screen', async ({ page }) => {
        await page.goto(`${LESSON}/quiz`);

        const options = page.getByRole('button', { name: /^[A-D]\. / });
        await expect(options).toHaveCount(4);
        await options.first().click();
        await page.getByRole('button', { name: 'Confirmar resposta' }).click();

        await expect(page.getByRole('button', { name: 'Próxima questão' })).toBeVisible();
    });
});
