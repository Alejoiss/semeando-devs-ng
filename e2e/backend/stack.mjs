// Ciclo de vida do backend do E2E: Supabase local ISOLADO (project_id semeandodevsapp-e2e, API 54421, DB 54400).
// Uso: node e2e/backend/stack.mjs start | stop | seed | reset
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const workdir = join(root, 'e2e/backend');
const API = 'http://127.0.0.1:54421';
const DB = 'postgresql://postgres:postgres@127.0.0.1:54400/postgres';
const PASSWORD = 'E2e-Passw0rd!';
const USERS = [
    ['00000000-0000-4000-8000-0000000000a1', 'e2e-aluno@e2e.test', 'student'],
    ['634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', 'e2e-professor@e2e.test', 'teacher'],
    ['00000000-0000-4000-8000-0000000000a3', 'e2e-admin@e2e.test', 'admin'],
    ['00000000-0000-4000-8000-0000000000a4', 'e2e-aluno-desafio@e2e.test', 'student'],
    ['00000000-0000-4000-8000-0000000000a5', 'e2e-aluno-limite@e2e.test', 'student'],
    ['00000000-0000-4000-8000-0000000000a6', 'e2e-aluno-assinatura@e2e.test', 'student'],
    ['00000000-0000-4000-8000-0000000000a7', 'e2e-aluno-newsletter@e2e.test', 'student'],
];

const run = (cmd, args, options = {}) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', ...options });
const psql = (...args) => run('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-q', ...args]);

function serviceRoleKey() {
    const out = execFileSync('supabase', ['status', '--workdir', workdir, '-o', 'env'], { cwd: root, encoding: 'utf8' });
    const key = out.match(/^SERVICE_ROLE_KEY="?([^"\n]+)"?/m)?.[1];
    if (!key) throw new Error('SERVICE_ROLE_KEY not found in `supabase status` output');
    return key;
}

async function createUsers() {
    const key = serviceRoleKey();
    const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    for (const [id, email, role] of USERS) {
        const response = await fetch(`${API}/auth/v1/admin/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                id,
                email,
                password: PASSWORD,
                email_confirm: true,
                user_metadata: { terms_accepted: true, terms_accepted_at: new Date().toISOString() },
            }),
        });
        if (!response.ok && !(await response.text()).includes('already')) {
            throw new Error(`Failed to create ${email}: ${response.status}`);
        }
        psql('-c', `update public.profiles set role = '${role}' where id = '${id}'`);
    }
}

function seed() {
    psql('-f', 'e2e/backend/grants.sql');
    psql('-f', 'supabase/dev-seed/seed-test-content.sql');
}

async function waitUntilReady() {
    const key = serviceRoleKey();
    const checks = [`${API}/auth/v1/health`, `${API}/rest/v1/`, `${API}/storage/v1/status`];
    const deadline = Date.now() + 240_000;
    for (const url of checks) {
        for (;;) {
            const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } }).catch(() => null);
            if (response?.ok) break;
            if (Date.now() > deadline) throw new Error(`Timed out waiting for ${url}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

const commands = {
    async start() {
        run('node', ['e2e/backend/prepare.mjs']);
        // O storage demora a aplicar as próprias migrações no banco novo e estoura o health check padrão da CLI
        run('supabase', ['start', '--workdir', workdir, '--ignore-health-check']);
        await waitUntilReady();
        await createUsers();
        seed();
    },
    stop() {
        run('supabase', ['stop', '--workdir', workdir, '--no-backup']);
    },
    async seed() {
        await createUsers();
        seed();
    },
    async reset() {
        run('supabase', ['db', 'reset', '--workdir', workdir, '--local']);
        await createUsers();
        seed();
    },
};

const command = process.argv[2];
if (!commands[command]) {
    console.error(`Usage: node e2e/backend/stack.mjs ${Object.keys(commands).join('|')}`);
    process.exit(1);
}
await commands[command]();
