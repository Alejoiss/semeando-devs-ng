import { TestBed } from '@angular/core/testing';
import { provideEchartsCore } from 'ngx-echarts';
import { BarChart } from './bar-chart/bar-chart/bar-chart';
import { DonutChart } from './donut-chart/donut-chart/donut-chart';

describe('Dashboard charts', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideEchartsCore({ echarts: () => import('echarts') })],
        });
    });

    for (const [name, component, defaultLabel] of [
        ['BarChart', BarChart, 'Gráfico de barras'],
        ['DonutChart', DonutChart, 'Gráfico de rosca'],
    ] as const) {
        describe(name, () => {
            it('describes the chart with the given aria-label', () => {
                const fixture = TestBed.createComponent(component);
                fixture.componentRef.setInput('options', {});
                fixture.componentRef.setInput('ariaLabel', 'Receita por mês');
                fixture.detectChanges();

                expect(fixture.nativeElement.querySelector('figure').getAttribute('aria-label')).toBe('Receita por mês');
            });

            it(`uses "${defaultLabel}" when no label is given`, () => {
                const fixture = TestBed.createComponent(component);
                fixture.componentRef.setInput('options', {});
                fixture.detectChanges();

                expect(fixture.nativeElement.querySelector('figure').getAttribute('aria-label')).toBe(defaultLabel);
            });

            it('renders the chart container', () => {
                const fixture = TestBed.createComponent(component);
                fixture.componentRef.setInput('options', {});
                fixture.detectChanges();

                expect(fixture.nativeElement.querySelector('figure [echarts]')).toBeTruthy();
            });
        });
    }
});
