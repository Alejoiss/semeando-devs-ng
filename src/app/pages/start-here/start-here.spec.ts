import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { activePromo, StartHere } from './start-here';
import { ShowcaseCourse } from '../../services/public-catalog/public-catalog';

describe('StartHere', () => {
    let fixture: ComponentFixture<StartHere>;

    const courses: ShowcaseCourse[] = [
        { id: 'c1', slug: 'git-e-github', title: 'Git e GitHub', description: 'Versione seu código', icon: 'commit', avatar: null, inRevision: false },
        { id: 'c2', slug: 'html', title: 'HTML', description: 'Estrutura', icon: null, avatar: 'html.png', inRevision: false },
        { id: 'c3', slug: 'react', title: 'React', description: 'Em breve', icon: null, avatar: null, inRevision: true },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StartHere],
            providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { courses } } } }],
        }).compileComponents();

        fixture = TestBed.createComponent(StartHere);
        fixture.detectChanges();
    });

    it('lists each published course with its title apart from its description, linked to its public page', () => {
        const element: HTMLElement = fixture.nativeElement;
        const gitCard = element.querySelector('a[href="/cursos/git-e-github"]');

        expect(gitCard?.querySelector('h3')?.textContent?.trim()).toBe('Git e GitHub');
        expect(gitCard?.querySelector('p')?.textContent?.trim()).toBe('Versione seu código');
        expect(gitCard?.querySelector('.material-symbols-outlined')?.textContent?.trim()).toBe('commit');
        expect(element.querySelector('a[href="/cursos/html"] img')).toBeTruthy();
    });

    it('hides courses still in revision', () => {
        expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/cursos/react"]')).toBeNull();
    });

    it('opens and closes an FAQ answer', () => {
        const element: HTMLElement = fixture.nativeElement;
        const button = element.querySelector<HTMLButtonElement>('button[aria-controls="faq-0"]')!;

        button.click();
        fixture.detectChanges();
        expect(button.getAttribute('aria-expanded')).toBe('true');

        button.click();
        fixture.detectChanges();
        expect(button.getAttribute('aria-expanded')).toBe('false');
    });
});

describe('activePromo', () => {
    it('shows the Black Friday coupon until the end of 30/11 in Brasília', () => {
        expect(activePromo(new Date('2026-11-30T23:59:00-03:00'))?.code).toBe('BLACKFRIDAY2026');
    });

    it('switches to FIMDEANO on 01/12 and ends with the year', () => {
        expect(activePromo(new Date('2026-12-01T00:00:00-03:00'))?.code).toBe('FIMDEANO');
        expect(activePromo(new Date('2027-01-01T00:00:00-03:00'))).toBeNull();
    });

    it('shows nothing before the campaign', () => {
        expect(activePromo(new Date('2026-11-01T12:00:00-03:00'))).toBeNull();
    });
});
