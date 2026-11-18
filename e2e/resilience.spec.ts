import { test, expect } from '@playwright/test';

test.fixme('finding bug-app-boot-blocked-by-monaco-cdn: login renders when the Monaco CDN is unreachable', async ({ page }) => {
    await page.route(url => url.hostname === 'cdn.jsdelivr.net', route => route.abort());
    await page.goto('/auth/login');
    await expect(page.locator('#email')).toBeVisible();
});
