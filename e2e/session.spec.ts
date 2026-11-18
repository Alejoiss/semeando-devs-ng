import { test, expect } from '@playwright/test';
import { SUPABASE_URL } from './support/backend';
import { storageStateFor } from './support/users';

for (const role of ['student', 'teacher', 'admin'] as const) {
    test.describe(`${role} session`, () => {
        test.use({ storageState: storageStateFor(role) });

        test('programmatic login is accepted and only the e2e backend is used', async ({ page }) => {
            const supabaseHosts = new Set<string>();
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.pathname.startsWith('/rest/v1') || url.pathname.startsWith('/auth/v1')) {
                    supabaseHosts.add(url.origin);
                }
            });

            await page.goto('/app');
            await page.waitForLoadState('networkidle');

            await expect(page).not.toHaveURL(/auth\/login/);
            expect([...supabaseHosts]).toEqual([new URL(SUPABASE_URL).origin]);
        });
    });
}
