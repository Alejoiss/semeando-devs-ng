import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
    let fixture: ComponentFixture<Header>;

    const nav = () => fixture.nativeElement.querySelector('nav') as HTMLElement;
    const scrollTo = (y: number) => {
        spyOnProperty(window, 'pageYOffset', 'get').and.returnValue(y);
        window.dispatchEvent(new Event('scroll'));
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        fixture = TestBed.createComponent(Header);
        fixture.detectChanges();
    });

    it('offers login and register actions', () => {
        const labels = Array.from(fixture.nativeElement.querySelectorAll('button')).map((b: any) => b.textContent.trim());
        expect(labels).toEqual(['Entrar', 'Registrar']);
    });

    it('links the logo to the home page', () => {
        const brand = fixture.nativeElement.querySelector('a.brand') as HTMLAnchorElement;
        expect(brand.getAttribute('href')).toBe('/');
        expect(brand.querySelector('img')?.getAttribute('alt')).toBe('Logo Semeando Devs');
    });

    it('is not marked as scrolled at the top', () => {
        expect(nav().classList).not.toContain('scrolled');
    });

    it('is marked as scrolled after passing 20px', () => {
        scrollTo(21);
        expect(nav().classList).toContain('scrolled');
    });

    it('is not scrolled at exactly 20px', () => {
        scrollTo(20);
        expect(nav().classList).not.toContain('scrolled');
    });
});
