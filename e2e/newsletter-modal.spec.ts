import { test, expect } from './support/test';
import { expectNoAxeViolations } from './support/axe';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

const userId = E2E_USERS.reader.id;

function publishNewsletter(withCta: boolean): string {
    const id = sql(
        `insert into newsletter (subject, body, cta_label, cta_url)
         values ('E2E Novidade', '<p>Olá, novidade do teste E2E!</p>', ${withCta ? "'Saiba mais'" : 'null'}, ${withCta ? "'https://example.com/e2e'" : 'null'}) returning id`,
    ).split('\n')[0];
    sql(`insert into user_newsletter (user_id, newsletter_id) values ('${userId}', '${id}')`);
    return id;
}

test.describe('newsletter modal', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: storageStateFor('reader') });

    test.beforeEach(() => {
        sql(`delete from user_newsletter where user_id = '${userId}'`);
        sql(`delete from newsletter where subject like 'E2E %'`);
    });

    test('shows an unseen newsletter once and does not come back after it is acknowledged', async ({ page }) => {
        const id = publishNewsletter(false);

        await page.goto('/app');
        await expect(page.getByText('Olá, novidade do teste E2E!')).toBeVisible();

        await page.getByRole('button', { name: 'Fechar', exact: true }).click();
        await expect(page.getByText('Olá, novidade do teste E2E!')).toHaveCount(0);
        await expect.poll(() => sql(`select viewed from user_newsletter where newsletter_id = '${id}' and user_id = '${userId}'`)).toBe('t');

        await page.reload();
        await expect(page.getByRole('heading', { name: 'Cursos' }).or(page.getByText('Lições hoje')).first()).toBeVisible();
        await expect(page.getByText('Olá, novidade do teste E2E!')).toHaveCount(0);
    });

    test('the call to action opens the link and acknowledges the newsletter', async ({ page }) => {
        const id = publishNewsletter(true);
        await page.context().route('https://example.com/**', route => route.fulfill({ contentType: 'text/html', body: 'ok' }));

        await page.goto('/app');
        const popup = page.waitForEvent('popup');
        await page.getByRole('button', { name: 'Saiba mais' }).click();

        expect((await popup).url()).toBe('https://example.com/e2e');
        await expect.poll(() => sql(`select viewed from user_newsletter where newsletter_id = '${id}' and user_id = '${userId}'`)).toBe('t');
    });

    test('a student without pending newsletters sees no modal', async ({ page }) => {
        await page.goto('/app');
        await expect(page.getByText('Lições hoje')).toBeVisible();
        await expect(page.getByText('Novidade', { exact: true })).toHaveCount(0);
    });

    test('the open modal has no AXE violations', async ({ page }) => {
        publishNewsletter(true);

        await page.goto('/app');
        await expect(page.getByText('Olá, novidade do teste E2E!')).toBeVisible();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expectNoAxeViolations(page, { exclude: ['iframe'] });
    });
});
