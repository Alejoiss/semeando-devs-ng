import type { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

const studentId = E2E_USERS.challenger.id;
const PREVIOUS_LESSONS = ['0fb4e367-514b-5e00-889c-e2c1b08d6efd', '8274a0fa-6560-5d31-b1e5-77a3ed3769a9', 'e50f4c5f-303e-5377-9768-8fbd7de5e9b4'];
const CHALLENGE_ID = '0ba1e272-a3c2-536f-93e2-9ef72798eed1';
const EVALUATE = '**/functions/v1/evaluate-challenge';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };

function unlockChallenge() {
    sql(`delete from user_lessons where user_id = '${studentId}' and lesson_id = '${CHALLENGE_ID}'`);
    for (const lessonId of PREVIOUS_LESSONS) {
        sql(`insert into user_lessons (user_id, lesson_id, completed, completed_at) values ('${studentId}', '${lessonId}', true, now()) on conflict do nothing`);
    }
}

async function stubEvaluation(page: Page, response: { status: number; body: object }) {
    const requests: Record<string, string>[] = [];
    await page.route(EVALUATE, route => {
        const request = route.request();
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
        requests.push(request.postDataJSON());
        return route.fulfill({ status: response.status, headers: CORS, contentType: 'application/json', body: JSON.stringify(response.body) });
    });
    return requests;
}

async function openChallenge(page: Page) {
    await page.goto('/app/s/html-essencial/ss/primeiros-passos');
    await page.getByRole('article').filter({ hasText: 'Desafio: sua primeira página' }).getByRole('button', { name: /Iniciar/ }).click();
    await expect(page).toHaveURL(new RegExp(`/lesson/${CHALLENGE_ID}/challenge$`));
    await expect(page.locator('app-challenge header').getByRole('heading', { level: 1, name: 'Desafio: sua primeira página' })).toBeVisible();
}

async function typeCode(page: Page, code: string) {
    const editor = page.locator('.monaco-editor').first();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await editor.click();
    await page.keyboard.type(code);
}

test.describe('code challenge (AI evaluation stubbed)', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: storageStateFor('challenger') });

    test.beforeEach(() => unlockChallenge());

    test('submitting code shows the AI feedback and XP, then continues to the submodule', async ({ page }) => {
        const requests = await stubEvaluation(page, {
            status: 200,
            body: { aiFeedback: 'Ótimo trabalho, a estrutura está correta.', xpAwarded: 50, earnedAchievements: [], subModuleCompleted: false, moduleCompleted: false },
        });

        await openChallenge(page);
        await typeCode(page, 'MARKER_E2E');
        await page.getByRole('button', { name: /Enviar Código/ }).click();

        await expect(page.getByRole('heading', { name: 'Feedback da IA' })).toBeVisible();
        await expect(page.getByText('Ótimo trabalho, a estrutura está correta.')).toBeVisible();
        await expect(page.getByText('+50 XP Recebido')).toBeVisible();

        expect(requests).toHaveLength(1);
        expect(requests[0]['lessonId']).toBe(CHALLENGE_ID);
        expect(requests[0]['code']).toContain('MARKER_E2E');

        await expect(page.getByRole('button', { name: /Enviar Código/ })).toBeEnabled();
        await page.getByRole('button', { name: /Continuar/ }).click();
        await expect(page).toHaveURL(/\/app\/s\/html-essencial\/ss\/primeiros-passos$/);
    });

    test('an evaluation failure shows an error and does not mark the challenge as done', async ({ page }) => {
        await stubEvaluation(page, { status: 500, body: { error: 'Serviço de avaliação indisponível' } });

        await openChallenge(page);
        await typeCode(page, 'MARKER_E2E');
        await page.getByRole('button', { name: /Enviar Código/ }).click();

        await expect(page.getByText('Erro no Desafio')).toBeVisible();
        await expect(page.getByText('Serviço de avaliação indisponível')).toBeVisible();
        await expect(page.getByRole('button', { name: /Continuar/ })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Feedback da IA' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: /Enviar Código/ })).toBeEnabled();
    });

    test('saving a draft keeps the code for the next visit', async ({ page }) => {
        await openChallenge(page);
        await typeCode(page, 'DRAFT_E2E');
        await page.getByRole('button', { name: 'Salvar Rascunho' }).click();

        await expect
            .poll(() => sql(`select coalesce(saved_code, '') from user_lessons where user_id = '${studentId}' and lesson_id = '${CHALLENGE_ID}'`))
            .toContain('DRAFT_E2E');

        await page.reload();
        await expect(page.locator('.monaco-editor').first()).toContainText('DRAFT_E2E', { timeout: 30_000 });
    });
});
