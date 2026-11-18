import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordToggle } from './password-toggle';

describe('PasswordToggle', () => {
    let fixture: ComponentFixture<PasswordToggle>;
    let input: HTMLInputElement;

    const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    beforeEach(() => {
        input = document.createElement('input');
        input.type = 'password';
        fixture = TestBed.createComponent(PasswordToggle);
        fixture.componentRef.setInput('input', input);
        fixture.detectChanges();
    });

    it('starts hidden with an accessible label to show the password', () => {
        expect(button().getAttribute('aria-label')).toBe('Mostrar senha');
        expect(button().getAttribute('aria-pressed')).toBe('false');
        expect(button().textContent).toContain('visibility');
        expect(button().type).toBe('button');
    });

    it('reveals the password on click and updates label and icon', () => {
        button().click();
        fixture.detectChanges();

        expect(input.type).toBe('text');
        expect(button().getAttribute('aria-label')).toBe('Ocultar senha');
        expect(button().getAttribute('aria-pressed')).toBe('true');
        expect(button().textContent).toContain('visibility_off');
    });

    it('hides it again on a second click', () => {
        button().click();
        button().click();
        fixture.detectChanges();

        expect(input.type).toBe('password');
        expect(button().getAttribute('aria-label')).toBe('Mostrar senha');
    });
});
