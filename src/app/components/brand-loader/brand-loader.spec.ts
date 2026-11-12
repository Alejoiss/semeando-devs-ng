import { TestBed } from '@angular/core/testing';
import { BrandLoader } from './brand-loader';

describe('BrandLoader', () => {
    it('exposes a status role with the accessible label and hides the logo from assistive tech', () => {
        const fixture = TestBed.createComponent(BrandLoader);
        fixture.componentRef.setInput('label', 'Carregando ranking');
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('[role="status"]')).not.toBeNull();
        expect(el.querySelector('.sr-only')!.textContent).toBe('Carregando ranking');
        expect(el.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
        expect(el.querySelectorAll('.brand-line').length).toBe(7);
    });
});
