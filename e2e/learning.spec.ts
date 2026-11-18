import { test, expect } from './support/test';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

const LESSON_ID = '0fb4e367-514b-5e00-889c-e2c1b08d6efd';
const FIRST_ACHIEVEMENT = 'PRIMEIRO_PASSO_NO_CODIGO';
const studentId = E2E_USERS.student.id;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function correctAnswers(): string[] {
    return sql(
        `select a.text from answers a join questions q on q.id = a.question_id join quizzes z on z.id = q.quiz_id
         where z.lesson_id = '${LESSON_ID}' and a.is_correct`,
    ).split('\n');
}

const totalXp = () => Number(sql(`select coalesce(sum(total_xp), 0) from xp where user_id = '${studentId}'`));

test.describe('student learning journey', () => {
    test.use({ storageState: storageStateFor('student') });

    test('module → submodule → lesson → quiz awards XP and the first achievement', async ({ page }) => {
        const correct = correctAnswers();
        expect(correct).toHaveLength(10);
        expect(totalXp()).toBe(0);

        await page.goto('/app');
        await page.getByRole('button', { name: 'Iniciar' }).first().click();
        await expect(page).toHaveURL(/\/app\/s\/html-essencial$/);

        await page.getByRole('button', { name: 'Iniciar' }).first().click();
        await expect(page).toHaveURL(/\/ss\/primeiros-passos$/);

        await page.getByRole('button', { name: 'Iniciar' }).first().click();
        await page.getByRole('button', { name: /Próximo: Iniciar Quiz \(10 questões\)/ }).click();
        await expect(page).toHaveURL(new RegExp(`/lesson/${LESSON_ID}/quiz$`));

        for (let question = 0; question < 10; question++) {
            const options = page.getByRole('button', { name: /^[A-D]\. / });
            await expect(options).toHaveCount(4);
            const labels = await options.allInnerTexts();
            const index = labels.findIndex(label => correct.some(text => new RegExp(`^[A-D]\\.\\s*${escapeRegExp(text)}$`).test(label.trim())));
            expect(index, `question ${question + 1} has a correct option`).toBeGreaterThanOrEqual(0);

            await options.nth(index).click();
            await page.getByRole('button', { name: 'Confirmar resposta' }).click();
            await page.getByRole('button', { name: question === 9 ? 'Ver resultado' : 'Próxima questão' }).click();
        }

        await expect(page.getByRole('heading', { name: /Parabéns/ })).toBeVisible();

        await expect.poll(totalXp, { message: 'XP is awarded by complete-quiz' }).toBeGreaterThan(0);
        expect(
            sql(`select count(*) from user_lessons where user_id = '${studentId}' and lesson_id = '${LESSON_ID}' and completed`),
        ).toBe('1');
        expect(
            sql(
                `select count(*) from user_achievements ua join achievements a on a.id = ua.achievement_id
                 where ua.user_id = '${studentId}' and a.identification = '${FIRST_ACHIEVEMENT}' and ua.completed`,
            ),
        ).toBe('1');

    });

    test.fixme('finding bug-breadcrumb-modules-404: the "Módulos" breadcrumb leads to the module list', async ({ page }) => {
        await page.goto('/app/s/html-essencial');
        await page.getByRole('link', { name: 'Módulos' }).last().click();
        await expect(page).toHaveURL(/\/app$/);
        await expect(page).not.toHaveTitle(/não encontrada/i);
    });
});
