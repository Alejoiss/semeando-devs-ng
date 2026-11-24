import { test, expect } from './support/test';
import { SUPABASE_KEY, SUPABASE_URL, sql } from './support/backend';
import { storageStateFor } from './support/users';

const MODULE_ID = 'e86aa906-95c5-5332-bb5b-f9456a72a87a';
const LESSON_ID = '0fb4e367-514b-5e00-889c-e2c1b08d6efd';
const LESSON_PATH = `/app/c/html-essencial/m/primeiros-passos/lesson/${LESSON_ID}`;

const setPublished = (published: boolean) => sql(`update public.submodules set published = ${published} where id = '${MODULE_ID}'`);

test.describe('module publication', () => {
    test.describe.configure({ mode: 'serial' });
    test.afterEach(() => setPublished(true));

    test('seeded modules start published', () => {
        expect(sql(`select published from public.submodules where id = '${MODULE_ID}'`)).toBe('t');
    });

    test.describe('student', () => {
        test.use({ storageState: storageStateFor('student') });

        test('a published module opens its lesson', async ({ page }) => {
            await page.goto(LESSON_PATH);
            await expect(page.getByRole('heading', { level: 1, name: 'O que é HTML?' }).first()).toBeVisible();
        });

        test('an unpublished module is not reachable by direct link', async ({ page }) => {
            setPublished(false);

            await page.goto(LESSON_PATH);

            await expect(page.getByRole('heading', { level: 1, name: 'O que é HTML?' }).first()).toHaveCount(0);
            await expect(page.getByText('Estrutura de uma página')).toHaveCount(0);
        });

        test('the other published module of the course stays available', async ({ page }) => {
            setPublished(false);

            await page.goto('/app/c/html-essencial');

            await expect(page.getByText('Formulários').first()).toBeVisible();
        });
    });

    test.describe('visitor', () => {
        test('cannot read lessons of an unpublished module through the API', async ({ request }) => {
            const read = async () =>
                (await request.get(`${SUPABASE_URL}/rest/v1/lessons?sub_module_id=eq.${MODULE_ID}&select=id`, { headers: { apikey: SUPABASE_KEY } })).json();

            expect(await read()).not.toEqual([]);
            setPublished(false);
            expect(await read()).toEqual([]);
        });
    });
});
