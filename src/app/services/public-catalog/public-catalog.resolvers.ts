import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { PublicCatalogService, PublicLessonPage, PublicModule, ShowcaseModule } from './public-catalog';

const notFound = () => {
    const router = inject(Router);
    return new RedirectCommand(router.parseUrl('/nao-encontrado'), { skipLocationChange: true });
};

export const showcaseModulesResolver: ResolveFn<ShowcaseModule[]> = () =>
    inject(PublicCatalogService).getShowcaseModules().catch(() => []);

export const publicCurriculumResolver: ResolveFn<PublicModule[]> = () =>
    inject(PublicCatalogService).getCurriculum().catch(() => []);

export const publicModuleResolver: ResolveFn<PublicModule> = async route => {
    const redirect = notFound();
    const module = await inject(PublicCatalogService).getModule(route.paramMap.get('moduleSlug') ?? '');
    return module ?? redirect;
};

export const publicLessonResolver: ResolveFn<PublicLessonPage> = async route => {
    const redirect = notFound();
    const params = route.paramMap;
    const page = await inject(PublicCatalogService).getLessonPage(
        params.get('moduleSlug') ?? '',
        params.get('submoduleSlug') ?? '',
        params.get('lessonSlug') ?? ''
    );
    return page ?? redirect;
};
