import { test, expect } from './support/test';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

test.describe('admin area', () => {
    test.use({ storageState: storageStateFor('admin') });

    test('dashboard shows the metrics, the charts and switches the period', async ({ page }) => {
        await page.goto('/admin/dashboard');

        await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
        const metrics = page.getByRole('region', { name: 'Métricas principais' });
        for (const label of ['Total de Alunos', 'Alunos PRO', 'MRR Estimado', 'Assinaturas Ativas', 'Novos Alunos (período)', 'Cancelamentos (período)']) {
            await expect(metrics.getByRole('article').filter({ hasText: label })).toBeVisible();
        }
        await expect(page.getByRole('figure', { name: /novos cadastros de alunos por mês/ })).toBeVisible();
        await expect(page.getByRole('figure', { name: /receita mensal em reais/ })).toBeVisible();

        const period = page.getByRole('navigation', { name: 'Filtro de período' });
        await expect(period.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true');
        await period.getByRole('button', { name: '7 dias' }).click();
        await expect(period.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true');
        await expect(period.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'false');
    });

    test('searches a student and opens the details', async ({ page }) => {
        await page.goto('/admin/lista-de-alunos');
        await page.getByRole('textbox', { name: 'Buscar aluno' }).fill(E2E_USERS.student.email);

        const result = page.getByRole('link', { name: new RegExp(E2E_USERS.student.email) });
        await expect(result).toHaveCount(1);
        await result.click();

        await expect(page).toHaveURL(new RegExp(`/admin/lista-de-alunos/${E2E_USERS.student.id}$`));
        await expect(page.getByRole('heading', { level: 2, name: 'Detalhes do Aluno' })).toBeVisible();
        await expect(page.getByText(E2E_USERS.student.email)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Progresso nos Cursos' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Conquistas' })).toBeVisible();
    });

    test('creates a coupon and finds it in the list', async ({ page }) => {
        await page.goto('/admin/cadastro-de-cupons/novo');
        await page.getByRole('textbox', { name: 'Código' }).fill('E2EADMIN15');
        await page.getByRole('spinbutton', { name: 'Valor do desconto' }).fill('15');
        await page.getByRole('spinbutton', { name: 'Duração em meses' }).fill('3');
        await page.getByRole('button', { name: 'Salvar', exact: true }).click();

        await expect(page).toHaveURL(/\/admin\/cadastro-de-cupons$/);
        await page.getByRole('textbox', { name: 'Buscar por código' }).fill('E2EADMIN15');
        await expect(page.getByRole('row', { name: /E2EADMIN15/ })).toHaveCount(1);
        expect(sql(`select discount_type, discount_value, duration_months from coupons where code = 'E2EADMIN15'`)).toBe('percentage|15.00|3');
    });

    test('a coupon without a code is not created', async ({ page }) => {
        await page.goto('/admin/cadastro-de-cupons/novo');
        await page.getByRole('button', { name: 'Salvar', exact: true }).click();

        await expect(page).toHaveURL(/\/admin\/cadastro-de-cupons\/novo$/);
        await expect(page.getByRole('textbox', { name: 'Código' })).toBeVisible();
        expect(sql(`select count(*) from coupons where code = ''`)).toBe('0');
    });

    test('creates a newsletter and lists it', async ({ page }) => {
        await page.goto('/admin/envio-de-newsletter/novo');
        await page.getByRole('textbox', { name: 'Assunto do e-mail' }).fill('E2E Newsletter de teste');
        await page.getByRole('textbox', { name: 'Mensagem', exact: true }).fill('Olá{{nome_virgula}}! Mensagem criada pelo teste E2E.');
        await page.getByRole('textbox', { name: 'Texto do botão' }).fill('Acesse');
        await page.getByRole('textbox', { name: 'Link do botão' }).fill('https://semeandodevs.com.br');
        await page.getByRole('button', { name: 'Salvar', exact: true }).click();

        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
        await expect.poll(() => sql(`select cta_label || '|' || cta_url from newsletter where subject = 'E2E Newsletter de teste'`)).toBe('Acesse|https://semeandodevs.com.br');

        await expect(page).toHaveURL(/\/admin\/envio-de-newsletter$/);
        await page.getByRole('textbox', { name: 'Buscar por assunto' }).fill('E2E Newsletter');
        await expect(page.getByRole('row', { name: /E2E Newsletter de teste/ })).toHaveCount(1);
    });

    test('the revenue report splits the net amount between the platform and the teachers', async ({ page }) => {
        await page.goto('/admin/relatorio-de-receita');
        await page.getByRole('spinbutton', { name: 'Entrada (R$)' }).fill('1000');
        await page.getByRole('spinbutton', { name: 'Saída (R$)' }).fill('100');
        await page.getByRole('button', { name: 'Gerar relatório' }).click();

        await expect(page.getByRole('article').filter({ hasText: 'Receita líquida' })).toContainText('R$ 900,00');
        await expect(page.getByRole('article').filter({ hasText: 'Plataforma (50%)' })).toContainText('R$ 450,00');
        await expect(page.getByRole('article').filter({ hasText: 'Professores (50%)' })).toContainText('R$ 450,00');
    });
});
