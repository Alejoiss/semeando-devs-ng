import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, type FullConfig } from '@playwright/test';
import { SUPABASE_KEY, SUPABASE_URL, resetUserState } from './support/backend';
import { E2E_PASSWORD, E2E_USERS } from './support/users';

export const AUTH_DIR = resolve(__dirname, '.auth');

async function signIn(email: string) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: E2E_PASSWORD }),
    }).catch(() => null);
    if (!response?.ok) {
        throw new Error(`[e2e] Could not sign in as ${email} on ${SUPABASE_URL}. Is the backend up? Run: npm run e2e:backend:start`);
    }
    return response.json();
}

const WARMUP_ROUTES = ['/', '/auth/login', '/app', '/professor', '/admin'];

// O primeiro acesso ao servidor de desenvolvimento faz o Vite reotimizar dependências e recarregar páginas no meio dos testes
async function warmUpDevServer(origin: string, storageState: string) {
    const browser = await chromium.launch();
    try {
        const context = await browser.newContext({ storageState });
        const page = await context.newPage();
        for (const route of WARMUP_ROUTES) {
            await page.goto(`${origin}${route}`).catch(() => undefined);
            await page.waitForLoadState('networkidle').catch(() => undefined);
        }
    } finally {
        await browser.close();
    }
}

export default async function globalSetup(config: FullConfig) {
    resetUserState();
    mkdirSync(AUTH_DIR, { recursive: true });
    const origin = new URL(config.projects[0].use.baseURL ?? config.webServer?.url ?? 'http://localhost:4301').origin;
    const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

    for (const [role, user] of Object.entries(E2E_USERS)) {
        const session = await signIn(user.email);
        const state = { cookies: [], origins: [{ origin, localStorage: [{ name: storageKey, value: JSON.stringify(session) }] }] };
        writeFileSync(resolve(AUTH_DIR, `${role}.json`), JSON.stringify(state));
    }

    await warmUpDevServer(origin, resolve(AUTH_DIR, 'admin.json'));
}
