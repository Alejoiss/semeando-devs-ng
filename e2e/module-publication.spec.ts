import { test, expect } from './support/test';
import { SUPABASE_KEY, SUPABASE_URL, sql } from './support/backend';
import { cloneCourse, removeCourse, type ClonedCourse } from './support/clone-course';
import { E2E_USERS, storageStateFor } from './support/users';

const teacherId = E2E_USERS.teacher.id;
const setPublished = (moduleId: string, published: boolean) => sql(`update public.submodules set published = ${published} where id = '${moduleId}'`);
const isPublished = (moduleId: string) => sql(`select published from public.submodules where id = '${moduleId}'`);

test.describe.configure({ mode: 'serial' });

test.describe('module publication', () => {
    let course: ClonedCourse;
    const [first, second] = [() => course.modules[0], () => course.modules[1]];
    const lessonPath = () => `/app/c/${course.slug}/m/${first().slug}/lesson/${first().lessonIds[0]}`;

    test.beforeEach(() => {
        course = cloneCourse('pub-clone');
    });
    test.afterEach(() => removeCourse(course.courseId));

    test('a cloned module is published and its lessons are valid by the app rules', () => {
        expect(isPublished(first().id)).toBe('t');
        expect(second()).toBeDefined();
    });

    test.describe('student', () => {
        test.use({ storageState: storageStateFor('student') });

        test('a published module opens its lesson', async ({ page }) => {
            await page.goto(lessonPath());
            await expect(page.getByRole('heading', { level: 1, name: 'O que é HTML?' }).first()).toBeVisible();
        });

        test('an unpublished module is not reachable by direct link', async ({ page }) => {
            setPublished(first().id, false);

            await page.goto(lessonPath());

            await expect(page.getByRole('heading', { level: 1, name: 'O que é HTML?' })).toHaveCount(0);
            await expect(page.getByText('Estrutura de uma página')).toHaveCount(0);
        });

        test('the other published module of the course stays available', async ({ page }) => {
            setPublished(first().id, false);

            await page.goto(`/app/c/${course.slug}`);

            await expect(page.getByText(second().title).first()).toBeVisible();
        });
    });

    test.describe('student catalog', () => {
        test.use({ storageState: storageStateFor('student') });

        test('the course page shows the unpublished module as "Em breve" and announces it', async ({ page }) => {
            setPublished(first().id, false);

            await page.goto(`/app/c/${course.slug}`);

            const comingSoon = page.getByTestId('coming-soon-module');
            await expect(comingSoon).toHaveCount(1);
            await expect(comingSoon).toContainText(first().title);
            await expect(comingSoon).toContainText('Em breve');
            await expect(comingSoon.getByRole('button')).toHaveCount(0);
            await expect(page.getByTestId('coming-soon-banner')).toContainText('1 módulo deste curso será liberado em breve');
            await expect(page.getByText(second().title).first()).toBeVisible();
        });

        test('a course with no published module leaves the course list, and returns when one is published', async ({ page }) => {
            await page.goto('/app');
            await expect(page.getByRole('heading', { name: `ZZ Clone ${course.slug}` })).toBeVisible();

            for (const module of course.modules) setPublished(module.id, false);
            await page.goto('/app');
            await expect(page.getByRole('heading', { name: 'HTML Essencial' })).toBeVisible();
            await expect(page.getByRole('heading', { name: `ZZ Clone ${course.slug}` })).toHaveCount(0);

            setPublished(second().id, true);
            await page.goto('/app');
            await expect(page.getByRole('heading', { name: `ZZ Clone ${course.slug}` })).toBeVisible();
        });
    });

    test('a visitor cannot read lessons of an unpublished module through the API', async ({ request }) => {
        const read = async () =>
            (await request.get(`${SUPABASE_URL}/rest/v1/lessons?sub_module_id=eq.${first().id}&select=id`, { headers: { apikey: SUPABASE_KEY } })).json();

        expect(await read()).not.toEqual([]);
        setPublished(first().id, false);
        expect(await read()).toEqual([]);
    });

    test.describe('professor panel', () => {
        test.beforeEach(() => {
            for (const id of [teacherId, E2E_USERS.admin.id]) {
                sql(`update profiles set teacher_terms_accepted = true, teacher_terms_accepted_at = now() where id = '${id}'`);
            }
        });

        test.describe('admin', () => {
            test.use({ storageState: storageStateFor('admin') });

            test('unpublishes without a warning and publishes again after validating every lesson', async ({ page }) => {
                await page.goto(`/professor/editar-modulo/${first().id}`);
                await expect(page.getByTestId('publication-status')).toHaveText('Módulo publicado');

                await page.getByRole('button', { name: 'Despublicar' }).click();
                await expect(page.getByTestId('publication-status')).toHaveText('Módulo em rascunho');
                expect(isPublished(first().id)).toBe('f');

                await page.getByRole('button', { name: 'Validar e publicar' }).click();
                await expect(page.getByTestId('publication-status')).toHaveText('Módulo publicado');
                expect(isPublished(first().id)).toBe('t');
                expect(sql(`select count(*) from public.lessons where sub_module_id = '${first().id}' and is_validated is not true`)).toBe('0');
            });

            test('validates the REVISION lesson too, which creates its missing quiz link', async ({ page }) => {
                setPublished(first().id, false);
                const revisionId = sql(
                    `insert into lessons (sub_module_id, title, description, type, "order", xp, created_by)
                     values ('${first().id}', 'Revisão do módulo', 'Revisão sem vínculos', 'REVISION', 99, 50, '${teacherId}') returning id`,
                ).split('\n')[0];
                expect(sql(`select count(*) from quizzes where lesson_id = '${revisionId}'`)).toBe('0');

                await page.goto(`/professor/editar-modulo/${first().id}`);
                await page.getByRole('button', { name: 'Validar e publicar' }).click();

                await expect(page.getByTestId('publication-status')).toHaveText('Módulo publicado');
                expect(sql(`select count(*) from quizzes where lesson_id = '${revisionId}'`)).toBe('1');
                expect(sql(`select is_validated from lessons where id = '${revisionId}'`)).toBe('t');
            });
        });

        test.describe('teacher', () => {
            test.use({ storageState: storageStateFor('teacher') });

            test('refuses to publish while a lesson is invalid and names it', async ({ page }) => {
                sql(`insert into teacher_modules (teacher_id, module_id, assigned_by) values ('${teacherId}', '${course.courseId}', '${teacherId}')`);
                setPublished(first().id, false);
                sql(`delete from section_content where lesson_id = '${first().lessonIds[0]}'`);

                await page.goto(`/professor/editar-modulo/${first().id}`);
                await expect(page.getByTestId('publication-status')).toHaveText('Módulo em rascunho');
                await page.getByRole('button', { name: 'Validar e publicar' }).click();

                await expect(page.getByRole('alert')).toContainText('O que é HTML?');
                await expect(page.getByTestId('publication-status')).toHaveText('Módulo em rascunho');
                expect(isPublished(first().id)).toBe('f');
            });
        });
    });
});
