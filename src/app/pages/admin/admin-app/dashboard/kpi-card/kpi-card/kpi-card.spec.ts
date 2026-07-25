import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
    let fixture: ComponentFixture<KpiCard>;
    let component: KpiCard;

    function createComponent(inputs: Partial<{ label: string; value: string; icon: string; trend: number | null; isLoading: boolean; hasError: boolean }> = {}) {
        TestBed.configureTestingModule({ imports: [KpiCard] });
        fixture = TestBed.createComponent(KpiCard);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('label', inputs.label ?? 'Total');
        fixture.componentRef.setInput('value', inputs.value ?? '42');
        fixture.componentRef.setInput('icon', inputs.icon ?? 'school');
        if (inputs.trend !== undefined) fixture.componentRef.setInput('trend', inputs.trend);
        if (inputs.isLoading !== undefined) fixture.componentRef.setInput('isLoading', inputs.isLoading);
        if (inputs.hasError !== undefined) fixture.componentRef.setInput('hasError', inputs.hasError);
        fixture.detectChanges();
        return fixture;
    }

    it('displays value and label when not loading and no error', () => {
        createComponent({ label: 'Alunos', value: '100', icon: 'school' });
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('100');
        expect(el.textContent).toContain('Alunos');
    });

    it('shows skeleton placeholder while loading', () => {
        createComponent({ isLoading: true });
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('.animate-pulse')).toBeTruthy();
        expect(el.textContent).not.toContain('42');
    });

    it('shows error indicator without displaying value', () => {
        createComponent({ hasError: true, isLoading: false });
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('Erro');
        expect(el.textContent).not.toContain('42');
    });

    it('renders positive trend percentage when trend is positive', () => {
        createComponent({ trend: 15, isLoading: false, hasError: false });
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('+15%');
    });

    it('renders negative trend percentage when trend is negative', () => {
        createComponent({ trend: -8, isLoading: false, hasError: false });
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('-8%');
    });

    it('does not render trend section when trend is null', () => {
        createComponent({ trend: null, isLoading: false, hasError: false });
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).not.toContain('%');
    });
});
