import { defineConfig, devices } from '@playwright/test';
import { assertLocalUrl, devSupabaseUrl } from './e2e/support/local-only';

const PORT = 4201;
const baseURL = assertLocalUrl(process.env['E2E_BASE_URL'] ?? `http://localhost:${PORT}`, 'E2E_BASE_URL');
devSupabaseUrl();

export default defineConfig({
    testDir: './e2e',
    outputDir: './test-results',
    fullyParallel: true,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 1 : 0,
    workers: process.env['CI'] ? 2 : undefined,
    reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : [['list']],
    use: {
        baseURL,
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop',
            testIgnore: /mobile\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile',
            testMatch: /mobile\.spec\.ts/,
            use: { ...devices['Pixel 7'] },
        },
    ],
    webServer: {
        command: `npx ng serve --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env['CI'],
        timeout: 240_000,
        stdout: 'ignore',
        stderr: 'ignore',
    },
});
