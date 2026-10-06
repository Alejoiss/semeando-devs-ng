// Baixa uma única vez o conteúdo público (módulos, aulas e seções) para a pré-renderização.
// Sem isso, cada worker do build consultaria o Supabase em paralelo e as páginas estourariam o timeout.
import { readFile, writeFile } from 'node:fs/promises';

const OUTPUT = 'src/app/services/public-catalog/public-catalog.snapshot.json';
const PAGE_SIZE = 500;

// Mantenha em sincronia com src/app/services/public-catalog/public-catalog.source.ts
const SHOWCASE_SELECT = 'id,slug,title,description,icon,in_revision';
const CURRICULUM_SELECT = 'id,slug,title,description,icon,submodules(id,slug,title,description,icon,order,lessons(id,title,description,type,order))';
const SECTION_SELECT = 'id,lesson_id,type,content,file,fileDescription:file_description';

const env = await readFile('src/environments/environment.prod.ts', 'utf8');
const read = key => env.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`))?.[1];
const baseUrl = read('supabaseUrl');
const apiKey = read('supabaseKey');
if (!baseUrl || !apiKey) {
    throw new Error('supabaseUrl/supabaseKey não encontrados em environment.prod.ts');
}

async function query(path, range) {
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
                headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, ...(range && { Range: range }) },
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

const [showcase, curriculum] = await Promise.all([
    query(`modules?select=${SHOWCASE_SELECT}`),
    query(`modules?select=${CURRICULUM_SELECT}&in_revision=eq.false`),
]);

const sections = {};
for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await query(
        `section_content?select=${SECTION_SELECT}&lesson_id=not.is.null&order=lesson_id.asc,order.asc,id.asc`,
        `${offset}-${offset + PAGE_SIZE - 1}`
    );
    for (const { lesson_id, ...section } of page) {
        (sections[lesson_id] ??= []).push(section);
    }
    if (page.length < PAGE_SIZE) {
        break;
    }
}

await writeFile(OUTPUT, JSON.stringify({ showcase, curriculum, sections }));
console.log(`fetch-public-catalog: ${curriculum.length} módulos e ${Object.keys(sections).length} aulas com conteúdo.`);
