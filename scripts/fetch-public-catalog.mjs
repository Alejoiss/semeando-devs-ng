// Baixa uma única vez o catálogo público (módulos, submódulos, aulas e a prévia de cada aula) para a pré-renderização.
// Sem isso, cada worker do build consultaria o Supabase em paralelo e as páginas estourariam o timeout.
import { readFile, writeFile } from 'node:fs/promises';

const OUTPUT = 'src/app/services/public-catalog/public-catalog.snapshot.json';

// Mantenha em sincronia com src/app/services/public-catalog/public-catalog.source.ts
const SHOWCASE_SELECT = 'id,slug,title,description,icon,avatar,in_revision';
const CURRICULUM_SELECT = 'id,slug,title,description,icon,avatar,submodules(id,slug,title,description,icon,order,lessons(id,title,description,type,order))';

const env = await readFile('src/environments/environment.prod.ts', 'utf8');
const read = key => env.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`))?.[1];
const baseUrl = read('supabaseUrl');
const apiKey = read('supabaseKey');
if (!baseUrl || !apiKey) {
    throw new Error('supabaseUrl/supabaseKey não encontrados em environment.prod.ts');
}

async function query(path, body) {
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
                method: body ? 'POST' : 'GET',
                headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: body && JSON.stringify(body),
                signal: AbortSignal.timeout(30_000),
            });
            if (!response.ok) {
                throw new Error(`${response.status} ${await response.text()}`);
            }
            return await response.json();
        } catch (error) {
            if (attempt >= 3) {
                throw new Error(`Falha ao consultar ${path}: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
}

const [showcase, curriculum, previewRows] = await Promise.all([
    query(`modules?select=${SHOWCASE_SELECT}`),
    query(`modules?select=${CURRICULUM_SELECT}&in_revision=eq.false`),
    // Só a prévia: o conteúdo completo das aulas não é legível sem login
    query('rpc/get_lesson_previews', {}),
]);
const previews = Object.fromEntries(previewRows.map(row => [row.lesson_id, row.preview]));

await writeFile(OUTPUT, JSON.stringify({ showcase, curriculum, previews }));
const lessons = curriculum.flatMap(module => module.submodules.flatMap(sub => sub.lessons)).length;
console.log(`fetch-public-catalog: ${curriculum.length} módulos, ${lessons} lições e ${previewRows.length} prévias.`);
