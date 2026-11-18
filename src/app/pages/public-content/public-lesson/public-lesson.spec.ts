import { DeferBlockBehavior } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { BehaviorSubject } from 'rxjs';
import { PublicLesson } from './public-lesson';
import { PublicLessonPage } from '../../../services/public-catalog/public-catalog';
import { SeoService } from '../../../services/seo/seo';
import { UserService } from '../../../services/user';
import { AdsenseService } from '../../../services/adsense/adsense';

describe('PublicLesson page', () => {
    let fixture: ComponentFixture<PublicLesson>;
    let data$: BehaviorSubject<{ lesson: PublicLessonPage }>;
    let seo: jasmine.SpyObj<SeoService>;
    let currentUser: ReturnType<typeof signal<any>>;

    const base = (content: PublicLessonPage['content'], over: Partial<PublicLessonPage> = {}): PublicLessonPage => ({
        module: { slug: 'html', title: 'HTML' },
        submodule: { slug: 'tags', title: 'Tags' },
        lesson: { id: 'l1', slug: 'o-que-e-html', title: 'O que é HTML', description: 'Primeira aula', isFree: true },
        content,
        previous: null,
        next: { title: 'Parágrafos', path: ['/cursos', 'html', 'tags', 'paragrafos'] },
        ...over,
    });

    const full = (sections: any[] = []) => base({ kind: 'full', sections });
    const preview = () => base({ kind: 'preview', markdown: '# Prévia\n\nTrecho inicial' });

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const hrefs = (sel: string) => Array.from(fixture.nativeElement.querySelectorAll(sel)).map((a: any) => a.getAttribute('href'));

    function setup(page: PublicLessonPage, user: unknown = null) {
        data$ = new BehaviorSubject({ lesson: page });
        seo = jasmine.createSpyObj('SeoService', ['update']);
        currentUser = signal(user);
        TestBed.configureTestingModule({
            deferBlockBehavior: DeferBlockBehavior.Manual,
            providers: [
                provideRouter([]),
                provideMarkdown(),
                { provide: SeoService, useValue: seo },
                { provide: UserService, useValue: { currentUser } },
                { provide: AdsenseService, useValue: { shouldShowAds: () => false, footerAdSlot: '', adClient: '' } },
                { provide: ActivatedRoute, useValue: { data: data$, snapshot: { data: { lesson: page } } } },
            ],
        });
        fixture = TestBed.createComponent(PublicLesson);
        fixture.detectChanges();
    }

    it('shows the title, description and breadcrumb', () => {
        setup(full());

        expect(fixture.nativeElement.querySelector('h1').textContent).toContain('O que é HTML');
        expect(text()).toContain('Primeira aula');
        expect(hrefs('nav[aria-label="Trilha de navegação"] a')).toEqual(['/cursos', '/cursos/html', '/cursos/html#tags']);
    });

    describe('free lesson (full content)', () => {
        it('is labeled as a free lesson', () => {
            setup(full());
            expect(text()).toContain('Aula gratuita');
            expect(text()).toContain('Teste o que você aprendeu');
        });

        it('renders each section type', () => {
            setup(full([
                { id: 'a', type: 'MARKDOWN', content: 'Conteúdo markdown', file: null, fileDescription: null },
                { id: 'b', type: 'TEXT', content: 'Texto simples', file: null, fileDescription: null },
                { id: 'c', type: 'IMAGE', content: null, file: 'img.png', fileDescription: 'Legenda da imagem' },
                { id: 'd', type: 'VIDEO', content: '<iframe title="vídeo" src="about:blank"></iframe>', file: null, fileDescription: null },
            ]));

            expect(fixture.nativeElement.querySelectorAll('markdown').length).toBe(1);
            expect(text()).toContain('Texto simples');
            const img = fixture.nativeElement.querySelector('figure img') as HTMLImageElement;
            expect(img.getAttribute('src')).toBe('img.png');
            expect(img.getAttribute('alt')).toBe('Legenda da imagem');
            expect(fixture.nativeElement.querySelector('figcaption').textContent).toContain('Legenda da imagem');
            expect(fixture.nativeElement.querySelector('.video-embed iframe')).toBeTruthy();
        });

        it('skips images without file and videos without embed code', () => {
            setup(full([
                { id: 'c', type: 'IMAGE', content: null, file: null, fileDescription: null },
                { id: 'd', type: 'VIDEO', content: null, file: null, fileDescription: null },
            ]));

            expect(fixture.nativeElement.querySelector('figure')).toBeNull();
            expect(fixture.nativeElement.querySelector('.video-embed')).toBeNull();
        });

        it('drops the leading "# Title" of the first markdown section, since the page already has an h1', () => {
            setup(full([
                { id: 'a', type: 'MARKDOWN', content: '# O que é HTML\nCorpo da aula', file: null, fileDescription: null },
                { id: 'b', type: 'MARKDOWN', content: '# Segundo título\nOutro corpo', file: null, fileDescription: null },
            ]));

            const sections = (fixture.componentInstance as any).sections();
            expect(sections[0].content).toBe('Corpo da aula');
            expect(sections[1].content).toBe('# Segundo título\nOutro corpo');
        });

        it('only strips a heading of the first section when that section is markdown', () => {
            setup(full([{ id: 'a', type: 'TEXT', content: '# Não é markdown', file: null, fileDescription: null }]));
            expect((fixture.componentInstance as any).sections()[0].content).toBe('# Não é markdown');
        });

        it('schedules the ad banner for free lessons only', async () => {
            setup(full());
            expect((await fixture.getDeferBlocks()).length).toBe(1);
        });
    });

    describe('preview', () => {
        it('shows the preview markdown, faded, and no ad', async () => {
            setup(preview());

            expect(text()).toContain('Prévia da aula');
            expect(fixture.nativeElement.querySelector('.preview markdown')).toBeTruthy();
            expect(fixture.nativeElement.querySelector('.preview-fade')).toBeTruthy();
            expect((await fixture.getDeferBlocks()).length).toBe(0);
        });

        it('asks visitors to sign up to read the full lesson', () => {
            setup(preview());

            expect(text()).toContain('Continue esta aula');
            expect(text()).toContain('ler a aula completa');
            expect(hrefs('aside a')).toEqual(['/auth/register', '/auth/login']);
        });
    });

    describe('call to action', () => {
        it('asks visitors of a free lesson to sign up for the quiz', () => {
            setup(full());
            expect(text()).toContain('Esta aula é gratuita. Crie sua conta');
            expect(hrefs('aside a')).toEqual(['/auth/register', '/auth/login']);
        });

        it('sends logged users back to the app', () => {
            setup(preview(), { id: 'u1' });

            expect(text()).toContain('Continuar meu aprendizado');
            expect(hrefs('aside a')).toEqual(['/app']);
        });
    });

    describe('lesson navigation', () => {
        it('shows only the next lesson when there is no previous one', () => {
            setup(full());
            expect(hrefs('nav[aria-label="Navegação entre aulas"] a')).toEqual(['/cursos/html/tags/paragrafos']);
            expect(text()).toContain('Próxima aula');
            expect(text()).not.toContain('Aula anterior');
        });

        it('shows both neighbours', () => {
            setup({ ...full(), previous: { title: 'Intro', path: ['/cursos', 'html', 'tags', 'intro'] } });
            expect(hrefs('nav[aria-label="Navegação entre aulas"] a')).toEqual(['/cursos/html/tags/intro', '/cursos/html/tags/paragrafos']);
        });

        it('shows only the previous lesson on the last one', () => {
            const page = { ...full(), previous: { title: 'Intro', path: ['/cursos', 'html', 'tags', 'intro'] }, next: null };
            setup(page);
            expect(text()).toContain('Aula anterior');
            expect(text()).not.toContain('Próxima aula');
        });
    });

    describe('SEO', () => {
        it('sets title and description from the lesson', () => {
            setup(full());
            expect(seo.update).toHaveBeenCalledWith({ title: 'O que é HTML | HTML - Semeando Devs', description: 'Primeira aula' });
        });

        it('falls back to a generated description', () => {
            const page = full();
            page.lesson = { ...page.lesson, description: '' };
            setup(page);
            expect(seo.update).toHaveBeenCalledWith({ title: 'O que é HTML | HTML - Semeando Devs', description: 'Aula de HTML: O que é HTML.' });
        });

        it('follows route data changes', () => {
            setup(full());
            const next = { ...preview(), lesson: { id: 'l2', slug: 'x', title: 'Outra', description: 'd', isFree: false } };
            data$.next({ lesson: next });
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Outra');
            expect(text()).toContain('Prévia da aula');
        });
    });
});
