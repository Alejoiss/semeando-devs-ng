import { test, expect } from './support/test';

test.describe('public catalog', () => {
    test('landing → courses → course → free lesson → sign-up call to action', async ({ page }) => {
        const angularErrors: string[] = [];
        page.on('console', message => {
            if (message.type() === 'error' && /NG0\d+/.test(message.text())) angularErrors.push(message.text());
        });

        await page.goto('/');
        await page.getByRole('link', { name: 'Cursos', exact: true }).first().click();
        await expect(page).toHaveURL(/\/cursos$/);
        await expect(page.getByRole('heading', { level: 1, name: 'Currículo dos Cursos' })).toBeVisible();
        await expect(page.getByRole('heading', { level: 2, name: 'HTML Essencial' })).toBeVisible();
        await expect(page.getByRole('heading', { level: 2, name: 'CSS na Prática' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'JavaScript Moderno' })).toHaveCount(0);

        await page.getByRole('link', { name: 'HTML Essencial' }).first().click();
        await expect(page).toHaveURL(/\/cursos\/html-essencial$/);
        await expect(page.getByRole('heading', { level: 1, name: 'Curso de HTML Essencial' })).toBeVisible();
        await expect(page.getByText('2 capítulos · 3 aulas')).toBeVisible();

        await page.getByRole('link', { name: /^O que é HTML\?/ }).click();
        await expect(page).toHaveURL(/\/cursos\/html-essencial\/primeiros-passos\/o-que-e-html$/);
        await expect(page).toHaveTitle(/O que é HTML\? \| HTML Essencial/);
        await expect(page.getByText('Aula gratuita')).toBeVisible();
        await expect(page.getByRole('article').getByRole('heading', { level: 2, name: 'Links e imagens' })).toBeVisible();

        await page.getByRole('complementary', { name: 'Teste o que você aprendeu' }).getByRole('link', { name: 'Criar conta grátis' }).click();
        await expect(page).toHaveURL(/\/auth\/register$/);

        expect(angularErrors).toEqual([]);
    });

    test('a lesson that is not free shows only the preview and asks for an account', async ({ page }) => {
        await page.goto('/cursos/html-essencial/primeiros-passos/estrutura-de-uma-pagina');

        await expect(page.getByText('Prévia da aula')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1, name: 'Estrutura de uma página' })).toBeVisible();
        const callToAction = page.getByRole('complementary', { name: 'Continue esta aula' });
        await expect(callToAction).toBeVisible();
        await callToAction.getByRole('link', { name: 'Já tenho conta' }).click();
        await expect(page).toHaveURL(/\/auth\/login$/);
    });

    test('lessons navigate to each other', async ({ page }) => {
        await page.goto('/cursos/html-essencial/primeiros-passos/estrutura-de-uma-pagina');
        await page.getByRole('navigation', { name: 'Navegação entre aulas' }).getByRole('link', { name: /Aula anterior/ }).click();
        await expect(page).toHaveURL(/\/primeiros-passos\/o-que-e-html$/);
    });

    for (const path of ['/cursos/curso-que-nao-existe', '/cursos/html-essencial/primeiros-passos/aula-que-nao-existe']) {
        test(`${path} shows the not-found page with a way back to the courses`, async ({ page }) => {
            await page.goto(path);
            await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
            await page.getByRole('link', { name: 'Ver cursos' }).click();
            await expect(page).toHaveURL(/\/cursos$/);
        });
    }

    test('a course still in revision is not listed and has no public page', async ({ page }) => {
        await page.goto('/cursos/javascript-moderno');
        await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
    });
});
