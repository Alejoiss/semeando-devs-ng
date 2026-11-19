import { TestBed } from '@angular/core/testing';
import { ResultIllustration } from './result-illustration';

describe('ResultIllustration', () => {
    function render(passed: boolean) {
        const fixture = TestBed.createComponent(ResultIllustration);
        fixture.componentRef.setInput('passed', passed);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    it('is decorative and hidden from assistive tech', () => {
        expect(render(true).querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('grows a complete faceted tree when passed', () => {
        const el = render(true);
        expect(el.querySelectorAll('.facet').length).toBe(6);
        expect(el.querySelector('.ghost')).toBeNull();
    });

    it('shows the same tree unfinished, with ghost facets still to fill, when failed', () => {
        const el = render(false);
        expect(el.querySelectorAll('.facet').length).toBe(4);
        expect(el.querySelectorAll('.ghost').length).toBe(3);
    });
});
