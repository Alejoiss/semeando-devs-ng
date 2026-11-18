import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFound } from './not-found';

describe('NotFound', () => {
    let fixture: ComponentFixture<NotFound>;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        fixture = TestBed.createComponent(NotFound);
        fixture.detectChanges();
    });

    it('explains that the page does not exist', () => {
        expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Página não encontrada');
        expect(fixture.nativeElement.textContent).toContain('404');
    });

    it('offers a way to the courses and to the home page', () => {
        const links = Array.from(fixture.nativeElement.querySelectorAll('main a')) as HTMLAnchorElement[];
        expect(links.map(a => [a.textContent!.trim(), a.getAttribute('href')])).toEqual([
            ['Ver cursos', '/cursos'],
            ['Ir para o início', '/'],
        ]);
    });
});
