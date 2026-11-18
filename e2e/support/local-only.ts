import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

export function devSupabaseUrl(): string {
    const source = readFileSync(resolve(__dirname, '../../src/environments/environment.ts'), 'utf8');
    const url = source.match(/supabaseUrl:\s*['"]([^'"]+)['"]/)?.[1];
    if (!url) {
        throw new Error('[e2e] supabaseUrl not found in src/environments/environment.ts');
    }
    return assertLocalUrl(url, 'supabaseUrl (src/environments/environment.ts)');
}

export function e2eSupabaseUrl(): string {
    return assertLocalUrl(process.env['E2E_SUPABASE_URL'] ?? devSupabaseUrl(), 'E2E_SUPABASE_URL');
}
