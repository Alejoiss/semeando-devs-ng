import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SeoService } from './seo';

@Component({ template: '' })
class BlankPage {}

describe('SeoService', () => {
    let service: SeoService;
    let router: Router;
    let meta: Meta;

    const content = (selector: string) => meta.getTag(selector)?.content;
    const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([{ path: '**', component: BlankPage }])],
        });
        service = TestBed.inject(SeoService);
        router = TestBed.inject(Router);
        meta = TestBed.inject(Meta);
    });

    afterEach(() => {
        document.head.querySelector('link[rel="canonical"]')?.remove();
    });

    describe('update', () => {
        it('sets the document title and the description/open graph/twitter tags', () => {
            service.update({ title: 'Cursos', description: 'Aprenda a programar' });

            expect(TestBed.inject(Title).getTitle()).toBe('Cursos');
            expect(content('name="description"')).toBe('Aprenda a programar');
            expect(content('property="og:title"')).toBe('Cursos');
            expect(content('property="og:description"')).toBe('Aprenda a programar');
            expect(content('name="twitter:title"')).toBe('Cursos');
            expect(content('name="twitter:description"')).toBe('Aprenda a programar');
        });

        it('replaces the tags on a second call instead of duplicating them', () => {
            service.update({ title: 'A', description: 'a' });
            service.update({ title: 'B', description: 'b' });

            expect(meta.getTags('name="description"').length).toBe(1);
            expect(content('name="description"')).toBe('b');
        });
    });

    describe('init', () => {
        beforeEach(() => service.init());

        it('creates the canonical link and url tags after navigation, ignoring query and hash', async () => {
            await router.navigateByUrl('/cursos/html?utm=x#topo');

            const url = `${environment.urlBase}/cursos/html`;
            expect(canonical()).toBe(url);
            expect(content('property="og:url"')).toBe(url);
            expect(content('name="twitter:url"')).toBe(url);
        });

        it('reuses the same canonical link on later navigations', async () => {
            await router.navigateByUrl('/cursos');
            await router.navigateByUrl('/contato');

            expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
            expect(canonical()).toBe(`${environment.urlBase}/contato`);
        });

        it('indexes public pages', async () => {
            await router.navigateByUrl('/cursos');
            expect(content('name="robots"')).toBe('index, follow');
        });

        for (const path of ['/app', '/app/perfil', '/professor/meus-modulos', '/admin/dashboard', '/auth/login', '/recuperar-senha', '/redefinir-senha', '/nao-encontrado']) {
            it(`marks ${path} as noindex`, async () => {
                await router.navigateByUrl(path);
                expect(content('name="robots"')).toBe('noindex, follow');
            });
        }

        it('does not treat a public path that only shares a prefix as private', async () => {
            await router.navigateByUrl('/application-guide');
            expect(content('name="robots"')).toBe('index, follow');
        });
    });
});
