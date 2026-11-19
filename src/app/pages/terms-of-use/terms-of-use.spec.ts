import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsOfUse } from './terms-of-use';

describe('TermsOfUse', () => {
    let fixture: ComponentFixture<TermsOfUse>;
    let component: any;
    let scrollTo: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        scrollTo = spyOn(window, 'scrollTo');
        fixture = TestBed.createComponent(TermsOfUse);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('has a single main heading and the legal sections', () => {
        expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
        for (const id of ['termos', 'uso-plataforma', 'gamificacao', 'pagamentos', 'rescisao', 'privacidade', 'dados-coletados', 'uso-ia', 'compartilhamento', 'direitos']) {
            expect(fixture.nativeElement.querySelector(`#${id}`)).withContext(id).toBeTruthy();
        }
    });

    describe('back to top button', () => {
        const button = () => fixture.nativeElement.querySelector('button[aria-label="Voltar ao topo"]') as HTMLButtonElement;

        it('is hidden while the index is still visible', () => {
            spyOn(component.indexSection()!.nativeElement, 'getBoundingClientRect').and.returnValue({ bottom: 200 } as DOMRect);
            window.dispatchEvent(new Event('scroll'));
            fixture.detectChanges();

            expect(component.showBackToTop()).toBeFalse();
            expect(button().classList).not.toContain('visible-btn');
        });

        it('shows once the index has scrolled out of view', () => {
            spyOn(component.indexSection()!.nativeElement, 'getBoundingClientRect').and.returnValue({ bottom: -1 } as DOMRect);
            window.dispatchEvent(new Event('scroll'));
            fixture.detectChanges();

            expect(component.showBackToTop()).toBeTrue();
            expect(button().classList).toContain('visible-btn');
        });

        it('scrolls smoothly to the top when clicked', () => {
            button().click();
            expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        });
    });

    describe('index', () => {
        it('scrolls to the chosen section, leaving room for the fixed header', () => {
            const target = fixture.nativeElement.querySelector('#pagamentos') as HTMLElement;
            spyOn(target, 'getBoundingClientRect').and.returnValue({ top: 1000 } as DOMRect);
            spyOnProperty(window, 'pageYOffset', 'get').and.returnValue(50);

            component.scrollToSection('pagamentos');

            expect(scrollTo).toHaveBeenCalledWith({ top: 1000 + 50 - 120, behavior: 'smooth' });
        });

        it('does nothing for an unknown section', () => {
            component.scrollToSection('nao-existe');
            expect(scrollTo).not.toHaveBeenCalled();
        });

        it('exposes every index entry as a keyboard-focusable link to an existing section', () => {
            const links = Array.from(fixture.nativeElement.querySelectorAll('[class*="glass-panel"] a[href^="#"]')) as HTMLAnchorElement[];
            expect(links.length).toBe(10);
            for (const link of links) {
                const id = link.getAttribute('href')!.slice(1);
                expect(fixture.nativeElement.querySelector(`#${id}`)).withContext(id).toBeTruthy();
            }
        });

        it('scrolls without changing the URL when an index link is activated', () => {
            const link = fixture.nativeElement.querySelector('a[href="#pagamentos"]') as HTMLAnchorElement;
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            link.dispatchEvent(event);
            expect(event.defaultPrevented).toBeTrue();
            expect(scrollTo).toHaveBeenCalled();
        });

        it('has an entry for every section it links to', () => {
            const calls = Array.from(fixture.nativeElement.querySelectorAll('[class*="glass-panel"] a')).length;
            expect(calls).toBeGreaterThanOrEqual(10);
        });
    });
});
