import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

describe('Footer', () => {
    let fixture: ComponentFixture<Footer>;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        fixture = TestBed.createComponent(Footer);
        fixture.detectChanges();
    });

    it('shows the current year', () => {
        expect(fixture.nativeElement.textContent).toContain(`© ${new Date().getFullYear()} Semeando Devs`);
    });

    it('links to courses, terms and support', () => {
        const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a[href^="/"]')).map((a: any) => a.getAttribute('href'));
        expect(hrefs).toEqual(['/cursos', '/termos-de-uso', '/support/contact']);
    });

    it('opens social links in a new tab safely and labels them for screen readers', () => {
        const social = Array.from(fixture.nativeElement.querySelectorAll('a[target="_blank"]')) as HTMLAnchorElement[];

        expect(social.length).toBeGreaterThan(0);
        for (const link of social) {
            expect(link.rel).toContain('noopener');
            expect(link.getAttribute('aria-label')).toContain('abre em nova aba');
        }
    });
});
