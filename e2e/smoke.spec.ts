import { test, expect } from './support/test';

test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
});
