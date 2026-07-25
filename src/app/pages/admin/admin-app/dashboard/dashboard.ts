import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DashboardService } from '../../../../services/dashboard';
import { PeriodOption, PeriodValue } from './models/dashboard.models';
import { KpiCard } from './kpi-card/kpi-card/kpi-card';
import { LineChart } from './charts/line-chart/line-chart/line-chart';
import { DonutChart } from './charts/donut-chart/donut-chart/donut-chart';
import { BarChart } from './charts/bar-chart/bar-chart/bar-chart';

const PERIOD_OPTIONS: PeriodOption[] = [
    { label: '7 dias', value: '7d' },
    { label: '30 dias', value: '30d' },
    { label: '90 dias', value: '90d' },
    { label: '12 meses', value: '12m' },
];

@Component({
    selector: 'app-admin-dashboard',
    imports: [KpiCard, LineChart, DonutChart, BarChart],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
    protected readonly service = inject(DashboardService);
    protected readonly periodOptions = PERIOD_OPTIONS;

    setPeriod(value: PeriodValue): void {
        this.service.setPeriod(value);
    }
}
