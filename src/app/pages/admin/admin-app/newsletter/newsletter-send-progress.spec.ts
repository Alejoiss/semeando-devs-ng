import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsletterSendProgressBar } from './newsletter-send-progress';
import { NewsletterSendProgress } from '../../../../../models/newsletter/newsletter';

describe('NewsletterSendProgressBar', () => {
    let fixture: ComponentFixture<NewsletterSendProgressBar>;

    const render = (progress?: NewsletterSendProgress | null) => {
        fixture = TestBed.createComponent(NewsletterSendProgressBar);
        if (progress !== undefined) fixture.componentRef.setInput('progress', progress);
        fixture.detectChanges();
    };
    const bar = () => fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = () => bar().firstElementChild as HTMLElement;
    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();

    it('says it is starting before any progress arrives', () => {
        render(null);

        expect(text()).toBe('Iniciando envio...');
        expect(fill().style.width).toBe('0%');
        expect(bar().getAttribute('aria-valuenow')).toBe('0');
        expect(bar().getAttribute('aria-valuemax')).toBe('0');
    });

    it('shows sent over total and the matching percentage', () => {
        render({ sent: 50, failed: 0, remaining: 150, total: 200 });

        expect(text()).toBe('50 de 200 enviados');
        expect(fill().style.width).toBe('25%');
        expect(bar().getAttribute('aria-valuenow')).toBe('50');
        expect(bar().getAttribute('aria-valuemax')).toBe('200');
    });

    it('rounds the percentage', () => {
        render({ sent: 1, failed: 0, remaining: 2, total: 3 });
        expect(fill().style.width).toBe('33%');
    });

    it('reports failures when there are any', () => {
        render({ sent: 8, failed: 2, remaining: 0, total: 10 });
        expect(text()).toContain('· 2 com falha');
    });

    it('does not mention failures when there are none', () => {
        render({ sent: 8, failed: 0, remaining: 2, total: 10 });
        expect(text()).not.toContain('falha');
    });

    it('stays at 0% when the total is zero', () => {
        render({ sent: 0, failed: 0, remaining: 0, total: 0 });
        expect(fill().style.width).toBe('0%');
    });

    it('is a labeled live region', () => {
        render(null);
        expect(bar().getAttribute('aria-label')).toBe('Progresso do envio');
        expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).toBeTruthy();
    });
});
