import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { PublicCatalogService } from './services/public-catalog/public-catalog';
import { PUBLIC_CATALOG_SOURCE } from './services/public-catalog/public-catalog.source';

// Só as páginas públicas são pré-renderizadas; as áreas logadas continuam 100% no navegador (index.csr.html).
export const serverRoutes: ServerRoute[] = [
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'cursos', renderMode: RenderMode.Prerender },
    {
        path: 'cursos/:moduleSlug',
        renderMode: RenderMode.Prerender,
        async getPrerenderParams() {
            const curriculum = await inject(PublicCatalogService).getCurriculum();
            return curriculum.map(module => ({ moduleSlug: module.slug }));
        },
    },
    {
        path: 'cursos/:moduleSlug/:submoduleSlug/:lessonSlug',
        renderMode: RenderMode.Prerender,
        async getPrerenderParams() {
            const source = inject(PUBLIC_CATALOG_SOURCE);
            const curriculum = await inject(PublicCatalogService).getCurriculum();
            const lessons = curriculum.flatMap(module =>
                module.submodules.flatMap(sub =>
                    sub.lessons.map(lesson => ({
                        id: lesson.id,
                        params: { moduleSlug: module.slug, submoduleSlug: sub.slug, lessonSlug: lesson.slug },
                    }))
                )
            );
            // Aula sem texto não tem prévia; pré-renderizá-la geraria uma página "não encontrada" com status 200
            const withPreview = await Promise.all(lessons.map(async lesson => !!(await source.preview(lesson.id))));
            return lessons.filter((_, index) => withPreview[index]).map(lesson => lesson.params);
        },
    },
    { path: 'support/contact', renderMode: RenderMode.Prerender },
    { path: 'termos-de-uso', renderMode: RenderMode.Prerender },
    { path: 'nao-encontrado', renderMode: RenderMode.Prerender },
    { path: '**', renderMode: RenderMode.Client },
];
