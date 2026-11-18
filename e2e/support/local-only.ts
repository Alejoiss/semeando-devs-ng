import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEV_STACK_API_PORT = '54321';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function assertLocalUrl(url: string, label: string): string {
    let host: string;
    try {
        host = new URL(url).hostname;
    } catch {
        throw new Error(`[e2e] ${label} is not a valid URL: "${url}"`);
    }
    if (!LOCAL_HOSTS.has(host)) {
        throw new Error(`[e2e] Refusing to run: ${label} points to "${host}". E2E only runs against localhost.`);
    }
    return url;
}

function e2eEnvironment(): string {
    return readFileSync(resolve(__dirname, '../../src/environments/environment.e2e.ts'), 'utf8');
}

export function e2eSupabaseKey(): string {
    const key = e2eEnvironment().match(/supabaseKey:\s*['"]([^'"]+)['"]/)?.[1];
    if (!key) {
        throw new Error('[e2e] supabaseKey not found in src/environments/environment.e2e.ts');
    }
    return key;
}

export function devSupabaseUrl(): string {
    const url = e2eEnvironment().match(/supabaseUrl:\s*['"]([^'"]+)['"]/)?.[1];
    if (!url) {
        throw new Error('[e2e] supabaseUrl not found in src/environments/environment.e2e.ts');
    }
    assertLocalUrl(url, 'supabaseUrl (src/environments/environment.e2e.ts)');
    if (new URL(url).port === DEV_STACK_API_PORT) {
        throw new Error('[e2e] Refusing to run: the e2e environment points to the development Supabase stack (54321).');
    }
    return url;
}

export function e2eSupabaseUrl(): string {
    return assertLocalUrl(process.env['E2E_SUPABASE_URL'] ?? devSupabaseUrl(), 'E2E_SUPABASE_URL');
}
