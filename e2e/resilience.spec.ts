import { test, expect } from './support/test';
import { storageStateFor } from './support/users';

const CHALLENGE_URL = '/app/c/html-essencial/m/primeiros-passos/lesson/0ba1e272-a3c2-536f-93e2-9ef72798eed1/challenge';

test('login renders when the Monaco CDN is unreachable', async ({ page }) => {
    await page.route(url => url.hostname === 'cdn.jsdelivr.net', route => route.abort());
    await page.goto('/auth/login');
    await expect(page.locator('#email')).toBeVisible();
});

test.describe('code editor routes without the Monaco CDN', () => {
    test.use({ storageState: storageStateFor('challenger') });

    test('the challenge sends the student back to the app instead of opening a broken editor', async ({ page }) => {
        await page.route(url => url.hostname === 'cdn.jsdelivr.net', route => route.abort());
        await page.goto(CHALLENGE_URL);
        await expect(page).toHaveURL(/\/app$/);
    });
});
