import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
    let fixture: ComponentFixture<LandingPage>;
    let component: any;

    const courses = [
        { id: 'm1', slug: 'html', title: 'HTML', description: 'Estrutura da web', icon: 'code', avatar: null, inRevision: false },
        { id: 'm2', slug: 'react', title: 'React', description: 'Interfaces', icon: null, avatar: 'react.png', inRevision: true },
    ];

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

    function setup(data: Record<string, unknown> = { courses }, reducedMotion = true) {
        spyOn(window, 'matchMedia').and.callFake(
            (query: string) => ({ matches: reducedMotion && query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
        );
        TestBed.configureTestingModule({
            providers: [provideRouter([]), provideMarkdown(), { provide: ActivatedRoute, useValue: { snapshot: { data } } }],
        });
        fixture = TestBed.createComponent(LandingPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    describe('content', () => {
        beforeEach(() => setup());

        it('has a single main heading', () => {
            expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
        });

        it('offers login, courses and register actions', () => {
            const links = Array.from(fixture.nativeElement.querySelectorAll('[routerLink], a')).map((e: any) => e.getAttribute('routerLink') ?? e.getAttribute('href'));
            expect(links).toContain('/auth/login');
            expect(links).toContain('/cursos');
            expect(links).toContain('/auth/register');
        });

        it('shows the courses from the route data', () => {
            expect(fixture.nativeElement.querySelectorAll('#courses article').length).toBe(2);
            expect(text()).toContain('HTML');
            expect(text()).toContain('Estrutura da web');
        });

        it('links available courses to their public page', () => {
            const link = fixture.nativeElement.querySelector('#courses article a') as HTMLAnchorElement;
            expect(link.getAttribute('href')).toBe('/cursos/html');
            expect(link.textContent).toContain('HTML');
        });

        it('shows courses in revision as "Em Breve", without a link', () => {
            const article = fixture.nativeElement.querySelectorAll('#courses article')[1] as HTMLElement;

            expect(article.textContent).toContain('Em Breve');
            expect(article.querySelector('a')).toBeNull();
            expect(article.querySelector('img')!.getAttribute('src')).toBe('react.png');
        });

        it('shows the icon of a course without avatar, with a default', () => {
            expect(fixture.nativeElement.querySelector('#courses article .material-symbols-outlined').textContent).toContain('code');
        });

        it('shows the sample ranking highlighting the current user', () => {
            expect(component.mockRanking().filter((u: any) => u.isCurrentUser).length).toBe(1);
            expect(fixture.nativeElement.querySelector('#gamification').textContent).toContain('Ana Silva');
        });
    });

    it('shows no courses when the route has none', () => {
        setup({});
        expect(fixture.nativeElement.querySelectorAll('#courses article').length).toBe(0);
    });

    describe('FAQ', () => {
        beforeEach(() => setup());

        const button = (i: number) => fixture.nativeElement.querySelector(`#faq-button-${i}`) as HTMLButtonElement;
        const panel = (i: number) => fixture.nativeElement.querySelector(`#faq-panel-${i}`) as HTMLElement;

        it('starts with every answer closed', () => {
            expect(component.faqItems().every((i: any) => !i.expanded)).toBeTrue();
            expect(button(0).getAttribute('aria-expanded')).toBe('false');
            expect(panel(0).classList).not.toContain('is-open');
        });

        it('has one labeled panel per question', () => {
            expect(fixture.nativeElement.querySelectorAll('[id^="faq-button-"]').length).toBe(component.faqItems().length);
            expect(panel(2).getAttribute('aria-labelledby')).toBe('faq-button-2');
            expect(button(2).getAttribute('aria-controls')).toBe('faq-panel-2');
        });

        it('opens and closes an answer', () => {
            button(1).click();
            fixture.detectChanges();
            expect(button(1).getAttribute('aria-expanded')).toBe('true');
            expect(panel(1).classList).toContain('is-open');

            button(1).click();
            fixture.detectChanges();
            expect(button(1).getAttribute('aria-expanded')).toBe('false');
        });

        it('opens answers independently', () => {
            button(0).click();
            button(3).click();
            fixture.detectChanges();

            expect(button(0).getAttribute('aria-expanded')).toBe('true');
            expect(button(3).getAttribute('aria-expanded')).toBe('true');
            expect(button(1).getAttribute('aria-expanded')).toBe('false');
        });

        it('states the current prices and limits of the plans', () => {
            const answer = component.faqItems().find((i: any) => i.question.includes('Quanto custa')).answer as string;
            expect(answer).toContain('R$ 29,90 por mês');
            expect(answer).toContain('R$ 299,90 por ano');
        });
    });

    describe('methodology', () => {
        beforeEach(() => setup());

        it('starts on theory', () => {
            expect(component.activeMethodology()).toBe('teoria');
        });

        it('switches the active methodology when a card is clicked', () => {
            const cards = fixture.nativeElement.querySelectorAll('#methodology [data-reveal][class*="cursor-pointer"]') as NodeListOf<HTMLElement>;
            cards[1].click();
            fixture.detectChanges();
            expect(component.activeMethodology()).toBe('revisao');

            cards[2].click();
            expect(component.activeMethodology()).toBe('desafio');
        });

        it('has a preview image for each methodology', () => {
            expect(Object.keys(component.methodologyImages)).toEqual(['teoria', 'revisao', 'desafio']);
        });

        it('lets the animation layer swap the content when it is active', () => {
            const motion = { swapMethodology: jasmine.createSpy('swapMethodology').and.callFake((change: () => void) => change()), destroy: jasmine.createSpy('destroy') };
            component.motion = motion;

            component.selectMethodology('desafio');

            expect(motion.swapMethodology).toHaveBeenCalledTimes(1);
            expect(component.activeMethodology()).toBe('desafio');
        });

        it('ignores choosing the methodology that is already active', () => {
            const motion = { swapMethodology: jasmine.createSpy('swapMethodology'), destroy: jasmine.createSpy('destroy') };
            component.motion = motion;

            component.selectMethodology('teoria');

            expect(motion.swapMethodology).not.toHaveBeenCalled();
        });

        it('stops the animations when the page is destroyed', () => {
            const motion = { swapMethodology: jasmine.createSpy(), destroy: jasmine.createSpy('destroy') };
            component.motion = motion;

            fixture.destroy();

            expect(motion.destroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('animations', () => {
        it('are skipped for users who prefer reduced motion', async () => {
            setup({ courses }, true);
            await fixture.whenStable();
            await new Promise(r => setTimeout(r, 20));

            expect(component.motion).toBeUndefined();
        });
    });
});
