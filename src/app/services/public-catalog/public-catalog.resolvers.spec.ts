import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    convertToParamMap,
    provideRouter,
    RedirectCommand,
    RouterStateSnapshot,
} from '@angular/router';
import { PublicCatalogService } from './public-catalog';
import {
    publicCurriculumResolver,
    publicLessonAdsResolver,
    publicLessonResolver,
    publicCourseResolver,
    showcaseCoursesResolver,
} from './public-catalog.resolvers';

describe('public catalog resolvers', () => {
    let catalog: jasmine.SpyObj<PublicCatalogService>;
    let assign: jasmine.Spy;

    const route = (params: Record<string, string> = {}) =>
        ({ paramMap: convertToParamMap(params) }) as ActivatedRouteSnapshot;
    const state = (url: string) => ({ url }) as RouterStateSnapshot;
    const inCtx = <T>(fn: () => T): T => TestBed.runInInjectionContext(fn);

    function configure(platform: 'browser' | 'server' = 'browser') {
        catalog = jasmine.createSpyObj('PublicCatalogService', ['getShowcaseCourses', 'getCurriculum', 'getCourse', 'getLessonPage']);
        assign = jasmine.createSpy('assign');
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: PublicCatalogService, useValue: catalog },
                { provide: PLATFORM_ID, useValue: platform },
                { provide: DOCUMENT, useValue: { location: { assign } } },
            ],
        });
    }


    beforeEach(() => sessionStorage.clear());
    afterEach(() => sessionStorage.clear());

    describe('list resolvers', () => {
        beforeEach(() => configure());

        it('showcaseCoursesResolver returns the courses', async () => {
            catalog.getShowcaseCourses.and.resolveTo([{ id: 'm1' }] as any);
            expect(await inCtx(() => showcaseCoursesResolver(route(), state('/')))).toEqual([{ id: 'm1' }] as any);
        });

        it('showcaseCoursesResolver falls back to an empty list on error', async () => {
            catalog.getShowcaseCourses.and.rejectWith(new Error('down'));
            expect(await inCtx(() => showcaseCoursesResolver(route(), state('/')))).toEqual([]);
        });

        it('publicCurriculumResolver returns the curriculum, or an empty list on error', async () => {
            catalog.getCurriculum.and.resolveTo([{ id: 'm1' }] as any);
            expect(await inCtx(() => publicCurriculumResolver(route(), state('/cursos')))).toEqual([{ id: 'm1' }] as any);

            catalog.getCurriculum.and.rejectWith(new Error('down'));
            expect(await inCtx(() => publicCurriculumResolver(route(), state('/cursos')))).toEqual([]);
        });
    });

    describe('publicCourseResolver', () => {
        const url = '/cursos/html';
        const resolve = () => inCtx(() => publicCourseResolver(route({ courseSlug: 'html' }), state(url))) as Promise<unknown>;

        describe('in the browser', () => {
            beforeEach(() => configure('browser'));

            it('loads the course by slug', async () => {
                const course = { id: 'm1' };
                catalog.getCourse.and.resolveTo(course as any);

                expect(await resolve()).toBe(course);
                expect(catalog.getCourse).toHaveBeenCalledWith('html');
            });

            it('redirects to /nao-encontrado without changing the URL when the course does not exist', async () => {
                catalog.getCourse.and.resolveTo(null);
                const result = await resolve();
                expect(result instanceof RedirectCommand).toBeTrue();
                expect((result as RedirectCommand).redirectTo.toString()).toBe('/nao-encontrado');
                expect((result as RedirectCommand).navigationBehaviorOptions).toEqual({ skipLocationChange: true });
            });

            it('clears the reload marker after a successful load', async () => {
                sessionStorage.setItem('public-catalog-reload', url);
                catalog.getCourse.and.resolveTo({ id: 'm1' } as any);

                await resolve();

                expect(sessionStorage.getItem('public-catalog-reload')).toBeNull();
            });

            it('reloads the page once when the API fails, leaving the navigation pending', async () => {
                catalog.getCourse.and.rejectWith(new Error('down'));
                let settled = false;

                resolve().then(() => (settled = true));
                await new Promise(r => setTimeout(r, 20));

                expect(assign).toHaveBeenCalledOnceWith(url);
                expect(sessionStorage.getItem('public-catalog-reload')).toBe(url);
                expect(settled).toBeFalse();
            });

            it('does not reload a second time for the same URL and redirects to not found instead', async () => {
                sessionStorage.setItem('public-catalog-reload', url);
                catalog.getCourse.and.rejectWith(new Error('down'));

                const result = await resolve();

                expect(assign).not.toHaveBeenCalled();
                expect(result instanceof RedirectCommand).toBeTrue();
                expect(sessionStorage.getItem('public-catalog-reload')).toBeNull();
            });

            it('reloads again when the marker belongs to a different URL', async () => {
                sessionStorage.setItem('public-catalog-reload', '/cursos/outro');
                catalog.getCourse.and.rejectWith(new Error('down'));

                resolve();
                await new Promise(r => setTimeout(r, 20));

                expect(assign).toHaveBeenCalledOnceWith(url);
            });
        });

        describe('on the server (prerender)', () => {
            beforeEach(() => configure('server'));

            it('propagates the error so the build fails instead of baking in a wrong page', async () => {
                catalog.getCourse.and.rejectWith(new Error('down'));
                await expectAsync(resolve()).toBeRejectedWithError('down');
                expect(assign).not.toHaveBeenCalled();
            });
        });
    });

    describe('publicLessonResolver', () => {
        beforeEach(() => configure('browser'));

        const params = { courseSlug: 'html', moduleSlug: 'tags', lessonSlug: 'o-que-e-html' };

        it('loads the lesson page from the three slugs', async () => {
            const page = { content: { kind: 'full' } };
            catalog.getLessonPage.and.resolveTo(page as any);

            const result = await inCtx(() => publicLessonResolver(route(params), state('/cursos/html/tags/o-que-e-html')));

            expect(result).toBe(page as any);
            expect(catalog.getLessonPage).toHaveBeenCalledWith('html', 'tags', 'o-que-e-html');
        });

        it('redirects to not found when the lesson does not exist', async () => {
            catalog.getLessonPage.and.resolveTo(null);
            const result = await inCtx(() => publicLessonResolver(route(params), state('/x')));
            expect(result instanceof RedirectCommand).toBeTrue();
        });
    });

    describe('publicLessonAdsResolver', () => {
        beforeEach(() => configure('browser'));

        const params = { courseSlug: 'html', moduleSlug: 'tags', lessonSlug: 'aula' };
        const resolve = () => inCtx(() => publicLessonAdsResolver(route(params), state('/x'))) as Promise<boolean>;

        it('shows ads only for free lessons with full content', async () => {
            catalog.getLessonPage.and.resolveTo({ content: { kind: 'full' } } as any);
            expect(await resolve()).toBeTrue();
            expect(catalog.getLessonPage).toHaveBeenCalledWith('html', 'tags', 'aula');
        });

        it('hides ads on previews', async () => {
            catalog.getLessonPage.and.resolveTo({ content: { kind: 'preview' } } as any);
            expect(await resolve()).toBeFalse();
        });

        it('hides ads when the lesson does not exist or loading fails', async () => {
            catalog.getLessonPage.and.resolveTo(null);
            expect(await resolve()).toBeFalse();

            catalog.getLessonPage.and.rejectWith(new Error('down'));
            expect(await resolve()).toBeFalse();
        });
    });
});
