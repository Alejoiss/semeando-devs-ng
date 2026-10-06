import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { PublicCatalogService } from './services/public-catalog/public-catalog';

// Só as páginas públicas são pré-renderizadas; as áreas logadas continuam 100% no navegador (index.csr.html).
export const serverRoutes: ServerRoute[] = [
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'home', renderMode: RenderMode.Prerender },
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
            const curriculum = await inject(PublicCatalogService).getCurriculum();
            return curriculum.flatMap(module =>
                module.submodules.flatMap(sub =>
                    sub.lessons.map(lesson => ({
                        moduleSlug: module.slug,
                        submoduleSlug: sub.slug,
                        lessonSlug: lesson.slug,
                    }))
                )
            );
        },
    },
    { path: 'support/contact', renderMode: RenderMode.Prerender },
    { path: 'termos-de-uso', renderMode: RenderMode.Prerender },
    { path: 'nao-encontrado', renderMode: RenderMode.Prerender },
    { path: '**', renderMode: RenderMode.Client },
];
