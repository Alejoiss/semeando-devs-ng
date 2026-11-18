import { test, expect } from './support/test';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

const viewer = E2E_USERS.subscriber.id;

test.describe('student pages: ranking, achievements and profile', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: storageStateFor('subscriber') });

    test.beforeEach(() => {
        sql(`delete from xp where user_id in ('${viewer}', '${E2E_USERS.challenger.id}', '${E2E_USERS.limited.id}', '${E2E_USERS.reader.id}')`);
        sql(`update profiles set name = null where id = '${viewer}'`);
        sql(`update auth.users set raw_user_meta_data = raw_user_meta_data - 'name' where id = '${viewer}'`);
        sql(`delete from user_achievements where user_id = '${viewer}'`);
    });

    test('the overall ranking shows the podium and the student position', async ({ page }) => {
        sql(
            `insert into xp (user_id, total_xp) values ('${E2E_USERS.challenger.id}', 5000), ('${E2E_USERS.limited.id}', 4000), ('${E2E_USERS.reader.id}', 3000), ('${viewer}', 2000)`,
        );

        await page.goto('/app/ranking');

        await expect(page.getByRole('heading', { level: 1, name: 'Ranking da Comunidade' })).toBeVisible();
        for (const xp of ['5000 XP', '4000 XP', '3000 XP']) {
            await expect(page.getByText(xp, { exact: true })).toBeVisible();
        }
        await expect(page.getByText('Sua Posição: 4º')).toBeVisible();
        await expect(page.getByText('2000 XP').last()).toBeVisible();
    });

    test('without enough participants the ranking says it is still being built', async ({ page }) => {
        await page.goto('/app/ranking');

        await expect(page.getByRole('heading', { level: 2, name: 'Posições em Construção' })).toBeVisible();
        await expect(page.getByText('Sua Posição: Sem Rank')).toBeVisible();

        await page.getByRole('button', { name: 'Semanal' }).click();
        await expect(page.getByRole('heading', { level: 2, name: 'Posições em Construção' })).toBeVisible();
    });

    test('the achievements page counts the unlocked achievements and the total XP', async ({ page }) => {
        sql(`insert into xp (user_id, total_xp) values ('${viewer}', 120)`);
        sql(
            `insert into user_achievements (user_id, achievement_id, completed, progress, viewed)
             select '${viewer}', id, true, 1, true from achievements where identification = 'PRIMEIRO_PASSO_NO_CODIGO'
             on conflict do nothing`,
        );

        await page.goto('/app/conquistas');

        await expect(page.getByRole('heading', { level: 1, name: 'Minhas Conquistas' })).toBeVisible();
        await expect(page.getByText('1/12')).toBeVisible();
        await expect(page.getByText('120', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { level: 3, name: 'Primeiro Passo no Código' })).toBeVisible();
    });

    test('the student updates the display name and the newsletter preference', async ({ page }) => {
        await page.goto('/app/perfil');
        await expect(page.getByRole('button', { name: 'Salvar Alterações' })).toBeDisabled();

        await page.getByRole('textbox', { name: 'Seu nome completo' }).fill('Maria E2E');
        await page.getByText('Aceito receber novidades, atualizações de conteúdo e e-mails promocionais.').first().click();
        await page.getByRole('button', { name: 'Salvar Alterações' }).click();

        await expect.poll(() => sql(`select u.raw_user_meta_data->>'name' || '|' || p.newsletter_active from auth.users u join profiles p on p.id = u.id where u.id = '${viewer}'`)).toBe('Maria E2E|true');
    });

    test('the password cannot be changed with mismatching confirmation', async ({ page }) => {
        await page.goto('/app/perfil');
        await page.getByRole('textbox', { name: 'Digite sua senha atual' }).fill('E2e-Passw0rd!');
        await page.getByRole('textbox', { name: 'Mínimo 6 caracteres' }).fill('Nova-Senha-123');
        await page.getByRole('textbox', { name: 'Repita a nova senha' }).fill('Outra-Senha-456');

        await expect(page.getByRole('button', { name: 'Atualizar Senha' })).toBeDisabled();
    });
});
