import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChart } from './line-chart';
import { NgxEchartsDirective } from 'ngx-echarts';

describe('LineChart', () => {
    let fixture: ComponentFixture<LineChart>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [LineChart],
        });
        fixture = TestBed.createComponent(LineChart);
        fixture.componentRef.setInput('options', {});
        fixture.componentRef.setInput('ariaLabel', 'Gráfico de crescimento de usuários');
        fixture.detectChanges();
    });

    it('renders a figure element with the provided aria-label', () => {
        const fig: HTMLElement = fixture.nativeElement.querySelector('figure');
        expect(fig).toBeTruthy();
        expect(fig.getAttribute('aria-label')).toBe('Gráfico de crescimento de usuários');
    });
});
