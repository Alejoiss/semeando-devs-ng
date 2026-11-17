import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RevenueReport } from '../../../../../models/revenue-report/revenue-report';
import { AdminRevenueReportService } from '../../../../services/admin-revenue-report';
import { KpiCard } from '../dashboard/kpi-card/kpi-card/kpi-card';
import { distributeCents, percentChange, TEACHERS_SHARE, toCents } from './revenue-split';

interface TeacherRow {
    key: string;
    name: string;
    lessons: number;
    sharePercent: number;
    amountCents: number;
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function previousMonth(): { year: number; month: number } {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

@Component({
    selector: 'app-admin-revenue-report',
    imports: [KpiCard],
    templateUrl: './revenue-report.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRevenueReport {
    private readonly service = inject(AdminRevenueReportService);

    protected readonly monthNames = MONTH_NAMES;
    protected readonly teachersSharePercent = TEACHERS_SHARE * 100;

    protected readonly month = signal(previousMonth().month);
    protected readonly year = signal(previousMonth().year);
    protected readonly income = signal<number | null>(null);
    protected readonly outgoing = signal<number | null>(null);

    protected readonly report = signal<RevenueReport | null>(null);
    protected readonly isLoading = signal(false);
    protected readonly error = signal<string | null>(null);

    protected readonly isYearValid = computed(() => Number.isInteger(this.year()) && this.year() >= 2000 && this.year() <= 2100);

    protected readonly periodLabel = computed(() => {
        const report = this.report();
        return report ? `${MONTH_NAMES[report.month - 1]} de ${report.year}` : '';
    });

    protected readonly netCents = computed(() => Math.max(0, toCents(this.income()) - toCents(this.outgoing())));
    protected readonly teachersCents = computed(() => Math.floor(this.netCents() * TEACHERS_SHARE));
    protected readonly platformCents = computed(() => this.netCents() - this.teachersCents());
    protected readonly outgoingExceedsIncome = computed(() => toCents(this.outgoing()) > toCents(this.income()));

    protected readonly averagePerLessonCents = computed(() => {
        const total = this.report()?.totalLessons ?? 0;
        return total > 0 ? Math.round(this.teachersCents() / total) : 0;
    });

    protected readonly teacherRows = computed<TeacherRow[]>(() => {
        const report = this.report();
        if (!report) return [];

        const amounts = distributeCents(this.teachersCents(), report.byTeacher.map(teacher => teacher.lessons));
        return report.byTeacher.map((teacher, index) => ({
            key: teacher.teacherId ?? 'sem-professor',
            name: teacher.teacherId ? (teacher.name ?? 'Professor sem nome') : 'Sem professor atribuído',
            lessons: teacher.lessons,
            sharePercent: report.totalLessons > 0 ? (teacher.lessons / report.totalLessons) * 100 : 0,
            amountCents: amounts[index],
        }));
    });

    protected readonly hasUnassignedLessons = computed(() => this.teacherRows().some(row => row.key === 'sem-professor'));

    protected readonly lessonsTrend = computed(() => {
        const report = this.report();
        return report ? percentChange(report.totalLessons, report.previousTotalLessons) : null;
    });

    protected readonly studentsTrend = computed(() => {
        const report = this.report();
        return report ? percentChange(report.activeStudents, report.previousActiveStudents) : null;
    });

    protected setMonth(value: string): void {
        this.month.set(Number(value));
    }

    protected setYear(value: string): void {
        this.year.set(Number(value));
    }

    protected setIncome(event: Event): void {
        this.income.set(this.readAmount(event));
    }

    protected setOutgoing(event: Event): void {
        this.outgoing.set(this.readAmount(event));
    }

    protected formatCents(cents: number): string {
        return currencyFormat.format(cents / 100);
    }

    protected formatPercent(value: number): string {
        return `${value.toFixed(1).replace('.', ',')}%`;
    }

    protected async generate(): Promise<void> {
        if (!this.isYearValid() || this.isLoading()) return;

        this.isLoading.set(true);
        this.error.set(null);
        try {
            this.report.set(await this.service.getReport(this.year(), this.month()));
        } catch (err) {
            this.report.set(null);
            this.error.set(err instanceof Error ? err.message : 'Não foi possível gerar o relatório.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected exportCsv(): void {
        const report = this.report();
        if (!report) return;

        const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
        const money = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
        const lines = [
            ['Professor', 'Lições concluídas', 'Participação (%)', 'Valor (R$)'].map(escape).join(';'),
            ...this.teacherRows().map(row =>
                [escape(row.name), row.lessons, row.sharePercent.toFixed(2).replace('.', ','), money(row.amountCents)].join(';'),
            ),
        ];

        const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-professores-${report.year}-${String(report.month).padStart(2, '0')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    private readAmount(event: Event): number | null {
        const value = (event.target as HTMLInputElement).valueAsNumber;
        return Number.isFinite(value) && value >= 0 ? value : null;
    }
}
