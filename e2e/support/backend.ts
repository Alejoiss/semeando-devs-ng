import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertLocalUrl, e2eSupabaseKey, e2eSupabaseUrl } from './local-only';

const DB_PORT = '54400';
export const DB_URL = assertLocalUrl(
    process.env['E2E_DB_URL'] ?? `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`,
    'E2E_DB_URL',
);

if (new URL(DB_URL).port === '54300') {
    throw new Error('[e2e] Refusing to run: E2E_DB_URL points to the development database (54300).');
}

export const SUPABASE_URL = e2eSupabaseUrl();
export const SUPABASE_KEY = e2eSupabaseKey();

export function sql(statement: string): string {
    return execFileSync('psql', [DB_URL, '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-c', statement], { encoding: 'utf8' }).trim();
}

export function resetUserState(): void {
    execFileSync('psql', [DB_URL, '-v', 'ON_ERROR_STOP=1', '-q', '-f', resolve(__dirname, '../backend/reset-user-state.sql')], {
        stdio: 'inherit',
    });
}
