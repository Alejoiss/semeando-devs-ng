// Gera e2e/backend/supabase/ (workdir do Supabase CLI) a partir de supabase/config.toml, com project_id e portas próprios,
// para que o stack do E2E nunca se confunda com o banco de desenvolvimento (portas 543xx).
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const target = join(root, 'e2e/backend/supabase');
const PORT_OFFSET = 100;

function disableSection(lines, section) {
    const start = lines.findIndex(line => line.trim() === `[${section}]`);
    if (start < 0) return lines;
    for (let i = start + 1; i < lines.length && !lines[i].startsWith('['); i++) {
        if (/^enabled\s*=/.test(lines[i])) lines[i] = 'enabled = false';
    }
    return lines;
}

let lines = (await readFile(join(root, 'supabase/config.toml'), 'utf8')).split('\n').map(line => {
    if (/^project_id\s*=/.test(line)) return 'project_id = "semeandodevsapp-e2e"';
    if (/^\s*(shadow_)?port\s*=\s*54\d{3}\b/.test(line) || /^\s*smtp_port\s*=\s*54\d{3}\b/.test(line)) {
        return line.replace(/54\d{3}/, port => String(Number(port) + PORT_OFFSET));
    }
    if (/^inspector_port\s*=/.test(line)) return 'inspector_port = 8183';
    return line.replaceAll('http://localhost:4201', 'http://localhost:4301');
});
for (const section of ['studio', 'analytics']) lines = disableSection(lines, section);

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await writeFile(join(target, 'config.toml'), lines.join('\n'));
for (const dir of ['migrations', 'templates', 'functions']) {
    await symlink(relative(target, join(root, 'supabase', dir)), join(target, dir));
}
console.log(`e2e backend workdir ready at ${relative(root, target)}`);
