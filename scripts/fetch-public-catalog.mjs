// Baixa uma única vez o catálogo público (módulos, submódulos, aulas, prévias e as aulas gratuitas) para a pré-renderização.
// Sem isso, cada worker do build consultaria o Supabase em paralelo e as páginas estourariam o timeout.
import { readFile, writeFile } from 'node:fs/promises';

const OUTPUT = 'src/app/services/public-catalog/public-catalog.snapshot.json';

// Mantenha em sincronia com src/app/services/public-catalog/public-catalog.source.ts
const SHOWCASE_SELECT = 'id,slug,title,description,icon,avatar,in_revision';
const CURRICULUM_SELECT = 'id,slug,title,description,icon,avatar,submodules(id,slug,title,description,icon,order,lessons(id,title,description,type,order))';

const envFile = process.env.CATALOG_ENV_FILE ?? 'src/environments/environment.prod.ts';
const env = await readFile(envFile, 'utf8');
const read = key => env.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`))?.[1];
const baseUrl = read('supabaseUrl');
const apiKey = read('supabaseKey');
if (!baseUrl || !apiKey) {
    throw new Error(`supabaseUrl/supabaseKey não encontrados em ${envFile}`);
}
if (process.env.CATALOG_ENV_FILE && !['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) {
    throw new Error(`CATALOG_ENV_FILE aponta para ${baseUrl}: o override só aceita um Supabase local.`);
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

const [showcase, curriculum, previewRows, freeRows] = await Promise.all([
    query(`modules?select=${SHOWCASE_SELECT}`),
    query(`modules?select=${CURRICULUM_SELECT}&in_revision=eq.false`),
    // O conteúdo completo das aulas não é legível sem login: só a prévia e as aulas gratuitas
    query('rpc/get_lesson_previews', {}),
    query('rpc/get_free_lesson_sections', {}),
]);
const previews = Object.fromEntries(previewRows.map(row => [row.lesson_id, row.preview]));
const freeSections = {};
for (const { lesson_id, file_description, order, ...section } of freeRows) {
    (freeSections[lesson_id] ??= []).push({ ...section, fileDescription: file_description });
}

await writeFile(OUTPUT, JSON.stringify({ showcase, curriculum, previews, freeSections }));
const lessons = curriculum.flatMap(module => module.submodules.flatMap(sub => sub.lessons)).filter(lesson => lesson.type === 'LESSON');
const withoutPreview = lessons.filter(lesson => !previews[lesson.id]).length;
console.log(`fetch-public-catalog: ${curriculum.length} módulos, ${lessons.length} aulas teóricas, ${previewRows.length} prévias, ` +
    `${Object.keys(freeSections).length} aulas gratuitas` +
    (withoutPreview ? ` (${withoutPreview} aulas sem prévia)` : '') + '.');
