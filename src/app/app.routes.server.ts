import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { PublicCatalogService } from './services/public-catalog/public-catalog';

// Só as páginas públicas são pré-renderizadas; as áreas logadas continuam 100% no navegador (index.csr.html).
export const serverRoutes: ServerRoute[] = [
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'comece', renderMode: RenderMode.Prerender },
    { path: 'cursos', renderMode: RenderMode.Prerender },
    {
        path: 'cursos/:courseSlug',
        renderMode: RenderMode.Prerender,
        async getPrerenderParams() {
            const curriculum = await inject(PublicCatalogService).getCurriculum();
            return curriculum.map(course => ({ courseSlug: course.slug }));
        },
    },
    {
        path: 'cursos/:courseSlug/:moduleSlug/:lessonSlug',
        renderMode: RenderMode.Prerender,
        async getPrerenderParams() {
            const catalog = inject(PublicCatalogService);
            const curriculum = await catalog.getCurriculum();
            const lessons = curriculum.flatMap(course =>
                course.modules.flatMap(sub =>
                    sub.lessons.map(lesson => ({ courseSlug: course.slug, moduleSlug: sub.slug, lessonSlug: lesson.slug }))
                )
            );
            // Aula sem texto não tem conteúdo público; pré-renderizá-la geraria uma página "não encontrada" com status 200
            const pages = await Promise.all(lessons.map(p => catalog.getLessonPage(p.courseSlug, p.moduleSlug, p.lessonSlug)));
            return lessons.filter((_, index) => pages[index]);
        },
    },
    { path: 'support/contact', renderMode: RenderMode.Prerender },
    { path: 'termos-de-uso', renderMode: RenderMode.Prerender },
    { path: 'nao-encontrado', renderMode: RenderMode.Prerender },
    { path: '**', renderMode: RenderMode.Client },
];
