import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboard } from './dashboard';
import { DashboardService } from '../../../../services/dashboard';
import { BarChart } from './charts/bar-chart/bar-chart/bar-chart';
import { DonutChart } from './charts/donut-chart/donut-chart/donut-chart';
import { LineChart } from './charts/line-chart/line-chart/line-chart';

@Component({ selector: 'app-line-chart', template: '' })
class LineChartStub {
    readonly options = input<unknown>();
    readonly ariaLabel = input<string>();
}
@Component({ selector: 'app-donut-chart', template: '' })
class DonutChartStub {
    readonly options = input<unknown>();
    readonly ariaLabel = input<string>();
}
@Component({ selector: 'app-bar-chart', template: '' })
class BarChartStub {
    readonly options = input<unknown>();
    readonly ariaLabel = input<string>();
}

describe('AdminDashboard', () => {
    let fixture: ComponentFixture<AdminDashboard>;
    let service: any;

    const kpi = (label: string, over: object = {}) => ({ label, value: '10', icon: 'school', trend: null, isLoading: false, hasError: false, ...over });
    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

    beforeEach(() => {
        service = {
            selectedPeriod: signal('30d'),
            setPeriod: jasmine.createSpy('setPeriod').and.callFake((p: string) => service.selectedPeriod.set(p)),
            kpis: signal([kpi('Total de Alunos'), kpi('MRR Estimado', { value: 'R$ 100' })]),
            userGrowthOption: signal({}),
            proFreeOption: signal({}),
            subStatusOption: signal({}),
            revenueOption: signal({}),
            billingCycleOption: signal({}),
            xpOption: signal({}),
            aiUsageOption: signal({}),
            seedOption: signal({}),
            lessonsPerModuleOption: signal({}),
        };
        TestBed.configureTestingModule({ providers: [{ provide: DashboardService, useValue: service }] });
        TestBed.overrideComponent(AdminDashboard, {
            remove: { imports: [LineChart, DonutChart, BarChart] },
            add: { imports: [LineChartStub, DonutChartStub, BarChartStub] },
        });
        fixture = TestBed.createComponent(AdminDashboard);
        fixture.detectChanges();
    });

    const periodButtons = () => Array.from(fixture.nativeElement.querySelectorAll('nav[aria-label="Filtro de período"] button')) as HTMLButtonElement[];

    it('offers the four period filters', () => {
        expect(periodButtons().map(b => b.textContent!.trim())).toEqual(['7 dias', '30 dias', '90 dias', '12 meses']);
    });

    it('marks only the selected period as pressed', () => {
        expect(periodButtons().map(b => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false', 'false']);
    });

    it('changes the period through the service and updates the pressed state', () => {
        periodButtons()[3].click();
        fixture.detectChanges();

        expect(service.setPeriod).toHaveBeenCalledOnceWith('12m');
        expect(periodButtons().map(b => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true']);
    });

    it('renders one KPI card per metric', () => {
        expect(fixture.nativeElement.querySelectorAll('app-kpi-card').length).toBe(2);
        expect(text()).toContain('Total de Alunos');
        expect(text()).toContain('R$ 100');
    });

    it('renders every chart with a descriptive label', () => {
        expect(fixture.nativeElement.querySelectorAll('app-line-chart').length).toBe(2);
        expect(fixture.nativeElement.querySelectorAll('app-donut-chart').length).toBe(2);
        expect(fixture.nativeElement.querySelectorAll('app-bar-chart').length).toBe(5);
    });

    it('groups the content in labeled sections', () => {
        const labels = Array.from(fixture.nativeElement.querySelectorAll('section')).map((s: any) => s.getAttribute('aria-label'));
        expect(labels).toEqual([
            'Métricas principais',
            'Usuários e crescimento',
            'Receita e assinaturas',
            'Engajamento e atividade da plataforma',
        ]);
    });
});
