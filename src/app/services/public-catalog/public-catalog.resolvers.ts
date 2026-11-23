import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { PublicCatalogService, PublicLessonPage, PublicCourse, ShowcaseCourse } from './public-catalog';

const notFound = () => {
    const router = inject(Router);
    return new RedirectCommand(router.parseUrl('/nao-encontrado'), { skipLocationChange: true });
};

const RELOAD_KEY = 'public-catalog-reload';

const safeSession = <T>(action: (storage: Storage) => T): T | undefined => {
    try {
        return action(sessionStorage);
    } catch {
        return undefined;
    }
};

/**
 * As páginas de curso e de aula são pré-renderizadas com os dados embutidos. Se a API falhar numa navegação
 * dentro do app, carrega a URL do zero em vez de mostrar um 404 falso ou deixar o usuário preso na página atual.
 */
const loadOrReload = <T>(url: string, load: () => Promise<T | null>): Promise<T | RedirectCommand> => {
    const redirect = notFound();
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    const location = inject(DOCUMENT).location;

    return load().then(
        value => {
            safeSession(storage => storage.removeItem(RELOAD_KEY));
            return value ?? redirect;
        },
        error => {
            if (!isBrowser) {
                throw error;
            }
            // Recarrega no máximo uma vez por URL para nunca entrar em loop
            const alreadyReloaded = safeSession(storage => storage.getItem(RELOAD_KEY) === url);
            if (alreadyReloaded) {
                safeSession(storage => storage.removeItem(RELOAD_KEY));
                return redirect;
            }
            safeSession(storage => storage.setItem(RELOAD_KEY, url));
            location.assign(url);
            return new Promise<never>(() => undefined);
        }
    );
};

export const showcaseCoursesResolver: ResolveFn<ShowcaseCourse[]> = () =>
    inject(PublicCatalogService).getShowcaseCourses().catch(() => []);

export const publicCurriculumResolver: ResolveFn<PublicCourse[]> = () =>
    inject(PublicCatalogService).getCurriculum().catch(() => []);

export const publicCourseResolver: ResolveFn<PublicCourse> = (route, state) => {
    const catalog = inject(PublicCatalogService);
    return loadOrReload(state.url, () => catalog.getCourse(route.paramMap.get('courseSlug') ?? ''));
};

/** Anúncios só nas aulas gratuitas, que têm conteúdo completo; nunca nas prévias. */
export const publicLessonAdsResolver: ResolveFn<boolean> = route => {
    const params = route.paramMap;
    return inject(PublicCatalogService)
        .getLessonPage(params.get('courseSlug') ?? '', params.get('moduleSlug') ?? '', params.get('lessonSlug') ?? '')
        .then(page => page?.content.kind === 'full', () => false);
};

export const publicLessonResolver: ResolveFn<PublicLessonPage> = (route, state) => {
    const catalog = inject(PublicCatalogService);
    const params = route.paramMap;
    return loadOrReload(state.url, () => catalog.getLessonPage(
        params.get('courseSlug') ?? '',
        params.get('moduleSlug') ?? '',
        params.get('lessonSlug') ?? ''
    ));
};
