import { test, expect } from './support/test';
import { expectNoAxeViolations } from './support/axe';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

const teacherId = E2E_USERS.teacher.id;

function createModule(title: string, slug: string): string {
    const id = sql(
        `insert into modules (title, description, slug, icon, in_revision, created_by) values ('${title}', 'Descrição', '${slug}', 'code', true, '${teacherId}') returning id`,
    ).split('\n')[0];
    sql(`insert into teacher_modules (teacher_id, module_id, assigned_by) values ('${teacherId}', '${id}', '${teacherId}')`);
    return id;
}

function createSubmodule(moduleId: string, title: string, slug: string): string {
    return sql(
        `insert into submodules (module_id, title, slug, description, icon, "order") values ('${moduleId}', '${title}', '${slug}', 'Descrição', 'code', 1) returning id`,
    ).split('\n')[0];
}

function createLesson(submoduleId: string, title: string): string {
    return sql(
        `insert into lessons (sub_module_id, title, description, type, "order", xp, created_by)
         values ('${submoduleId}', '${title}', 'Descrição da lição de teste', 'LESSON', 1, 20, '${teacherId}') returning id`,
    ).split('\n')[0];
}

test.describe('professor content creation', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: storageStateFor('teacher') });

    test.beforeEach(() => {
        sql(`update profiles set teacher_terms_accepted = true, teacher_terms_accepted_at = now() where id = '${teacherId}'`);
    });

    test('a teacher who has not accepted the partner terms must accept them', async ({ page }) => {
        sql(`update profiles set teacher_terms_accepted = false, teacher_terms_accepted_at = null where id = '${teacherId}'`);

        await page.goto('/professor/meus-modulos');
        await expect(page.getByRole('heading', { level: 1, name: 'Termos do Professor Parceiro' })).toBeVisible();

        await page.getByRole('button', { name: 'Aceitar os termos do professor parceiro' }).click();

        await expect(page.getByRole('heading', { name: 'Termos do Professor Parceiro' })).toHaveCount(0);
        await expect.poll(() => sql(`select teacher_terms_accepted from profiles where id = '${teacherId}'`)).toBe('t');
    });

    test('creates a module and finds it in "Meus módulos"', async ({ page }) => {
        await page.goto('/professor/criar-modulo');
        await page.getByPlaceholder('Ex: Introdução ao Angular').fill('E2E Módulo Novo');
        await expect(page.getByRole('textbox').nth(1)).toHaveValue('e2e-modulo-novo');
        await page.getByPlaceholder(/Uma breve descrição/).fill('Módulo criado pelo teste E2E.');
        await page.getByRole('button', { name: 'Ícone' }).click();
        await page.getByPlaceholder('Ex: memory').fill('memory');
        await page.getByRole('button', { name: 'Salvar Módulo' }).click();

        await expect(page).toHaveURL(/\/professor\/editar-modulo\/[0-9a-f-]{36}$/);
        const row = sql(`select title, description, icon from modules where slug = 'e2e-modulo-novo'`);
        expect(row).toBe('E2E Módulo Novo|Módulo criado pelo teste E2E.|memory');
        expect(sql(`select count(*) from teacher_modules tm join modules m on m.id = tm.module_id where m.slug = 'e2e-modulo-novo' and tm.teacher_id = '${teacherId}'`)).toBe('1');

        await page.goto('/professor/meus-modulos');
        await expect(page.getByRole('heading', { level: 3, name: 'E2E Módulo Novo' })).toBeVisible();
    });

    test('a module cannot be saved without the required fields', async ({ page }) => {
        const modulesBefore = sql('select count(*) from modules');

        await page.goto('/professor/criar-modulo');
        await page.getByRole('button', { name: 'Salvar Módulo' }).click();

        await expect(page).toHaveURL(/\/professor\/criar-modulo$/);
        expect(sql('select count(*) from modules')).toBe(modulesBefore);
    });

    test('adds a submodule to a module', async ({ page }) => {
        const moduleId = createModule('E2E Módulo Base', 'e2e-modulo-base');

        await page.goto(`/professor/editar-modulo/${moduleId}`);
        await page.getByRole('button', { name: /Adicionar Submódulo/ }).click();
        await expect(page).toHaveURL(new RegExp(`/professor/criar-submodulo/${moduleId}$`));

        await page.getByPlaceholder('Ex: Componentes e Templates').fill('E2E Submódulo Novo');
        await page.getByPlaceholder(/Uma breve descrição/).fill('Submódulo criado pelo teste E2E.');
        await page.getByRole('button', { name: 'Ícone' }).click();
        await page.getByPlaceholder('Ex: memory').fill('code');
        await page.getByRole('button', { name: 'Salvar Submódulo' }).click();

        await expect(page).toHaveURL(/\/professor\/editar-submodulo\/[0-9a-f-]{36}$/);
        expect(sql(`select s.title, s.slug from submodules s where s.module_id = '${moduleId}'`)).toBe('E2E Submódulo Novo|e2e-submodulo-novo');
    });

    test('edits the title of an existing lesson', async ({ page }) => {
        const moduleId = createModule('E2E Módulo Edição', 'e2e-modulo-edicao');
        const lessonId = createLesson(createSubmodule(moduleId, 'E2E Submódulo Edição', 'e2e-submodulo-edicao'), 'E2E Lição Antiga');

        await page.goto(`/professor/editar-licao/${lessonId}`);
        await expect(page.getByRole('heading', { level: 1, name: 'Editar Lição' })).toBeVisible();
        const title = page.getByRole('textbox', { name: 'Título da Lição *' });
        await expect(title).toHaveValue('E2E Lição Antiga');
        await title.fill('E2E Lição Nova');
        await page.getByRole('button', { name: 'Salvar Lição' }).click();

        await expect.poll(() => sql(`select title from lessons where id = '${lessonId}'`)).toBe('E2E Lição Nova');
    });

    test('saves a quiz question with exactly one correct answer', async ({ page }) => {
        const moduleId = createModule('E2E Módulo Quiz', 'e2e-modulo-quiz');
        const lessonId = createLesson(createSubmodule(moduleId, 'E2E Submódulo Quiz', 'e2e-submodulo-quiz'), 'E2E Lição Quiz');

        await page.goto(`/professor/editar-licao/${lessonId}`);
        await page.getByRole('button', { name: 'Quiz' }).click();
        await expect(page.getByRole('heading', { level: 4, name: 'Pergunta 1', exact: true })).toBeVisible();

        const editor = page.locator('.monaco-editor').first();
        await expect(editor).toBeVisible({ timeout: 30_000 });
        await editor.click();
        await page.keyboard.type('Qual tag define um parágrafo no E2E?');

        const options = ['<p>', '<pg>', '<para>', '<text>'];
        for (const [index, text] of options.entries()) {
            await page.getByRole('textbox', { name: `Texto da alternativa ${index + 1}` }).first().fill(text);
            await page.getByRole('textbox', { name: `Justificativa da alternativa ${index + 1}` }).first().fill(`Justificativa ${index + 1}`);
        }
        await page.getByRole('button', { name: 'Marcar alternativa 1 como correta' }).first().click();
        await page.getByRole('button', { name: 'Salvar Questão 1', exact: true }).click();

        await expect
            .poll(() =>
                sql(
                    `select count(*) filter (where a.is_correct) || '/' || count(*) from answers a join questions q on q.id = a.question_id
                     join quizzes z on z.id = q.quiz_id where z.lesson_id = '${lessonId}'`,
                ),
            )
            .toBe('1/4');
        expect(
            sql(`select a.text from answers a join questions q on q.id = a.question_id join quizzes z on z.id = q.quiz_id where z.lesson_id = '${lessonId}' and a.is_correct`),
        ).toBe('<p>');
    });

    test('saving a new lesson creates it', async ({ page }) => {
        const moduleId = createModule('E2E Módulo Lição', 'e2e-modulo-licao');
        const submoduleId = createSubmodule(moduleId, 'E2E Submódulo Lição', 'e2e-submodulo-licao');

        await page.goto(`/professor/criar-licao/${submoduleId}`);
        await page.getByRole('textbox', { name: 'Título da Lição *' }).fill('E2E Lição Criada');
        await page.getByRole('textbox', { name: 'Descrição *' }).fill('Lição criada pelo teste E2E.');
        await page.getByRole('button', { name: 'Salvar Lição' }).click();

        await expect(page.getByText(/violates|null value/)).toHaveCount(0);
        await expect.poll(() => sql(`select count(*) from lessons where sub_module_id = '${submoduleId}'`)).toBe('1');
    });

    test('/professor/criar-modulo has no AXE violations', async ({ page }) => {
        await page.goto('/professor/criar-modulo');
        await expect(page.getByRole('heading', { level: 1, name: 'Criar Módulo' })).toBeVisible();
        await expectNoAxeViolations(page, { exclude: ['iframe'] });
    });
});
