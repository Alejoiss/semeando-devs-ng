import { test, expect } from './support/test';
import { storageStateFor } from './support/users';

test.describe('anonymous visitor', () => {
    for (const path of ['/app', '/app/ranking', '/app/perfil', '/professor', '/admin', '/admin/dashboard']) {
        test(`${path} redirects to login`, async ({ page }) => {
            await page.goto(path);
            await expect(page).toHaveURL(/\/auth\/login$/);
        });
    }

    test('unknown route shows the not-found page', async ({ page }) => {
        await page.goto('/rota-que-nao-existe');
        await expect(page).toHaveTitle(/não encontrada/i);
    });
});

test.describe('student', () => {
    test.use({ storageState: storageStateFor('student') });

    test('can open the app', async ({ page }) => {
        await page.goto('/app');
        await expect(page).toHaveURL(/\/app$/);
    });

    for (const path of ['/professor', '/professor/meus-modulos', '/admin', '/admin/dashboard']) {
        test(`${path} sends the student back to /app`, async ({ page }) => {
            await page.goto(path);
            await expect(page).toHaveURL(/\/app$/);
        });
    }
});

test.describe('teacher', () => {
    test.use({ storageState: storageStateFor('teacher') });

    test('can open the teacher area', async ({ page }) => {
        await page.goto('/professor');
        await expect(page).toHaveURL(/\/professor\/meus-modulos$/);
    });

    test('is sent back to /app from the admin area', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL(/\/app$/);
    });
});

test.describe('admin', () => {
    test.use({ storageState: storageStateFor('admin') });

    test('can open the admin area', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(/\/admin\/dashboard$/);
    });

    test('can also open the teacher area', async ({ page }) => {
        await page.goto('/professor');
        await expect(page).toHaveURL(/\/professor\/meus-modulos$/);
    });
});
