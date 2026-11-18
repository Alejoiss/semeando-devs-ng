import type { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { waitForEmailLink } from './support/mailbox';
import { E2E_PASSWORD, E2E_USERS } from './support/users';

async function signIn(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /Entrar/ }).click();
}

test.describe('login', () => {
    test('an existing student signs in and lands in the app', async ({ page }) => {
        await signIn(page, E2E_USERS.student.email, E2E_PASSWORD);
        await expect(page).toHaveURL(/\/app$/);
    });

    test('wrong credentials show an error and stay on the login page', async ({ page }) => {
        await signIn(page, E2E_USERS.student.email, 'wrong-password');
        await expect(page).toHaveURL(/auth\/login/);
        await expect(page.locator('p.text-error')).toBeVisible();
    });

    test('empty form shows required messages', async ({ page }) => {
        await page.goto('/auth/login');
        await page.getByRole('button', { name: /Entrar/ }).click();
        await expect(page.getByText('Email é obrigatório.')).toBeVisible();
        await expect(page.getByText('Senha é obrigatória.')).toBeVisible();
    });
});

test.describe.serial('account lifecycle', () => {
    const email = `e2e-novo-${Date.now()}@e2e.test`;
    const firstPassword = 'Primeira-Senha1!';
    const secondPassword = 'Segunda-Senha2!';

    test('registers, is blocked until confirming the email, then signs in', async ({ page }) => {
        await page.goto('/auth/register');
        await page.locator('#name').fill('Aluno E2E Novo');
        await page.locator('#email').fill(email);
        await page.locator('#password').fill(firstPassword);
        await page.locator('#confirmPassword').fill(firstPassword);
        await page.locator('#termsAccepted').check();
        await page.getByRole('button', { name: /Criar|Cadastr/ }).click();
        await expect(page.getByRole('heading', { name: 'Conta criada!' })).toBeVisible();
        await page.getByRole('button', { name: /Ir para o Login/ }).click();
        await expect(page).toHaveURL(/auth\/login/);

        await signIn(page, email, firstPassword);
        await expect(page.getByRole('button', { name: 'Reenviar e-mail de confirmação' })).toBeVisible();

        const confirmation = await waitForEmailLink(email, /Confirme/i);
        await page.goto(confirmation);
        await signIn(page, email, firstPassword);
        await expect(page).toHaveURL(/\/app$/);
    });

    test('logs out and loses access to the app', async ({ page }) => {
        await signIn(page, email, firstPassword);
        await expect(page).toHaveURL(/\/app$/);
        await page.getByText('Sair', { exact: true }).click();
        await expect(page).toHaveURL(/\/$/);
        await page.goto('/app');
        await expect(page).toHaveURL(/auth\/login/);
    });

    test('recovers and resets the password, then signs in with the new one', async ({ page }) => {
        await page.goto('/recuperar-senha');
        await page.locator('#email').fill(email);
        await page.getByRole('button', { name: /Enviar|Recuperar/ }).click();
        await expect(page.getByText('Se o e-mail existir em nossa base')).toBeVisible();

        await page.goto(await waitForEmailLink(email, /Recupera/i));
        await expect(page).toHaveURL(/redefinir-senha/);
        await page.locator('#password').fill(secondPassword);
        await page.locator('#confirmPassword').fill(secondPassword);
        await page.getByRole('button', { name: /Redefinir|Salvar|Atualizar/ }).click();
        await expect(page.getByText('Senha atualizada com sucesso!')).toBeVisible();
        await expect(page).toHaveURL(/auth\/login/);

        await signIn(page, email, firstPassword);
        await expect(page).toHaveURL(/auth\/login/);
        await signIn(page, email, secondPassword);
        await expect(page).toHaveURL(/\/app$/);
    });
});

test.fixme('finding a11y-login-forgot-password-link-not-focusable: forgot-password link is reachable by keyboard', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#password').focus();
    const link = page.getByRole('link', { name: 'Esqueci minha senha' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
});
