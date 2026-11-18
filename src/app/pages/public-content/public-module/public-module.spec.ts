import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PublicModule } from './public-module';
import { PublicModule as PublicModuleData } from '../../../services/public-catalog/public-catalog';
import { SeoService } from '../../../services/seo/seo';

describe('PublicModule page', () => {
    let fixture: ComponentFixture<PublicModule>;
    let data$: BehaviorSubject<{ module: PublicModuleData }>;
    let seo: jasmine.SpyObj<SeoService>;

    const lesson = (id: string, title: string, isFree = false) => ({ id, slug: `aula-${id}`, title, description: '', isFree });

    const makeModule = (over: Partial<PublicModuleData> = {}): PublicModuleData => ({
        id: 'm1',
        slug: 'html',
        title: 'HTML',
        description: 'Aprenda a marcar páginas',
        icon: 'code',
        avatar: null,
        submodules: [
            { id: 's1', slug: 'tags', title: 'Tags', description: 'As primeiras tags', icon: null, lessons: [lesson('1', 'O que é HTML', true), lesson('2', 'Parágrafos')] },
            { id: 's2', slug: 'forms', title: 'Formulários', description: '', icon: null, lessons: [lesson('3', 'Inputs', true)] },
        ],
        ...over,
    });

    const text = () => fixture.nativeElement.textContent as string;

    function setup(module = makeModule()) {
        data$ = new BehaviorSubject({ module });
        seo = jasmine.createSpyObj('SeoService', ['update']);
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: SeoService, useValue: seo },
                { provide: ActivatedRoute, useValue: { data: data$, snapshot: { data: { module } } } },
            ],
        });
        fixture = TestBed.createComponent(PublicModule);
        fixture.detectChanges();
    }

    it('shows the title, description and the chapter and lesson counts', () => {
        setup();

        expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Curso de HTML');
        expect(text()).toContain('Aprenda a marcar páginas');
        expect(text()).toContain('2 capítulos · 3 aulas');
    });

    it('lists each chapter with its numbered position and lessons linking to the public lesson page', () => {
        setup();

        const sections = fixture.nativeElement.querySelectorAll('section') as NodeListOf<HTMLElement>;
        expect(sections.length).toBe(2);
        expect(sections[0].querySelector('h2')!.textContent).toContain('Tags');
        expect(sections[0].textContent).toContain('As primeiras tags');

        const links = Array.from(sections[0].querySelectorAll('ol a')) as HTMLAnchorElement[];
        expect(links.map(a => a.getAttribute('href'))).toEqual(['/cursos/html/tags/aula-1', '/cursos/html/tags/aula-2']);
    });

    it('labels only the free lessons', () => {
        setup();

        const items = Array.from(fixture.nativeElement.querySelectorAll('ol ol li, section ol li')) as HTMLElement[];
        const free = items.filter(li => li.textContent!.includes('Grátis')).map(li => li.textContent!.replace(/\s+/g, ' ').trim());
        expect(free.length).toBe(2);
        expect(free[0]).toContain('O que é HTML');
        expect(free[1]).toContain('Inputs');
    });

    it('shows the avatar when there is one, the icon otherwise', () => {
        setup(makeModule({ avatar: 'html.png' }));
        expect(fixture.nativeElement.querySelector('main header img').getAttribute('src')).toBe('html.png');
        TestBed.resetTestingModule();

        setup(makeModule({ avatar: null, icon: 'code' }));
        expect(fixture.nativeElement.querySelector('main header img')).toBeNull();
        expect(text()).toContain('code');
    });

    it('omits the description paragraph when the module has none', () => {
        setup(makeModule({ description: '' }));
        expect(fixture.nativeElement.querySelector('header p.text-lg')).toBeNull();
    });

    it('invites visitors to sign up or log in', () => {
        setup();

        const hrefs = Array.from(fixture.nativeElement.querySelectorAll('aside a')).map((a: any) => a.getAttribute('href'));
        expect(hrefs).toEqual(['/auth/register', '/auth/login']);
    });

    describe('SEO', () => {
        it('uses the module description for the meta description', () => {
            setup();
            expect(seo.update).toHaveBeenCalledWith({ title: 'Curso de HTML - Semeando Devs', description: 'Aprenda a marcar páginas' });
        });

        it('builds a description from the lesson count when the module has none', () => {
            setup(makeModule({ description: '' }));
            expect(seo.update).toHaveBeenCalledWith({
                title: 'Curso de HTML - Semeando Devs',
                description: 'Conheça o currículo do curso de HTML: 3 aulas com quizzes e desafios práticos.',
            });
        });

        it('updates the page when the route data changes', () => {
            setup();
            data$.next({ module: makeModule({ title: 'CSS', slug: 'css' }) });
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Curso de CSS');
            expect(seo.update).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Curso de CSS - Semeando Devs' }));
        });
    });
});
