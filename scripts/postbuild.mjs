// Ajustes no build estático para o Firebase Hosting:
// - publica a página 404 pré-renderizada como 404.html (o Hosting a serve com status 404)
// - gera o sitemap a partir das rotas que o Angular pré-renderizou
import { copyFile, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE_URL = 'https://semeandodevs.com.br';
const DIST = 'dist/semeandodevsapp';
const BROWSER = join(DIST, 'browser');
const NOT_FOUND_ROUTE = 'nao-encontrado';
const EXCLUDED = new Set(['', NOT_FOUND_ROUTE]);

const priorityFor = path => {
    if (path === 'home') return '1.0';
    if (path === 'cursos') return '0.9';
    if (/^cursos\/[^/]+$/.test(path)) return '0.8';
    if (path.startsWith('cursos/')) return '0.7';
    return '0.3';
};

await copyFile(join(BROWSER, NOT_FOUND_ROUTE, 'index.html'), join(BROWSER, '404.html'));
await rm(join(BROWSER, NOT_FOUND_ROUTE), { recursive: true });

const { routes } = JSON.parse(await readFile(join(DIST, 'prerendered-routes.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const urls = Object.keys(routes)
    .map(route => route.replace(/^\//, ''))
    .filter(path => !EXCLUDED.has(path))
    .sort()
    .map(path => `    <url>
        <loc>${SITE_URL}/${encodeURI(path)}</loc>
        <lastmod>${today}</lastmod>
        <priority>${priorityFor(path)}</priority>
    </url>`);

await writeFile(join(BROWSER, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`);

console.log(`postbuild: 404.html publicado e sitemap com ${urls.length} URLs gerado.`);
