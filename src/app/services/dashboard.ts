import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import type { EChartsOption } from 'echarts';
import { SupabaseService } from './supabase';
import { DASHBOARD_PALETTE } from '../pages/admin/admin-app/dashboard/constants/palette';
import {
    DashboardKpi,
    MonthlyDataPoint,
    GroupedDataPoint,
    PeriodValue,
} from '../pages/admin/admin-app/dashboard/models/dashboard.models';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function buildFromDate(period: PeriodValue): Date {
    const now = new Date();
    switch (period) {
        case '7d': now.setDate(now.getDate() - 7); break;
        case '30d': now.setDate(now.getDate() - 30); break;
        case '90d': now.setDate(now.getDate() - 90); break;
        case '12m': now.setFullYear(now.getFullYear() - 1); break;
    }
    return now;
}

function buildPriorFromDate(period: PeriodValue): { current: Date; prior: Date } {
    const now = new Date();
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '12m') days = 365;
    const current = new Date(now); current.setDate(now.getDate() - days);
    const prior = new Date(now); prior.setDate(now.getDate() - days * 2);
    return { current, prior };
}

function buildLast12MonthsLabels(): { label: string; year: number; month: number }[] {
    const result: { label: string; year: number; month: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push({ label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return result;
}

function groupByMonth(rows: { created_at: string }[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of rows) {
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
}

function baseChartDefaults(): Partial<EChartsOption> {
    return {
        backgroundColor: 'transparent',
        textStyle: { color: DASHBOARD_PALETTE.onSurface, fontFamily: 'Inter, sans-serif' },
        tooltip: { trigger: 'axis', backgroundColor: DASHBOARD_PALETTE.surfaceContainerHigh, borderColor: 'transparent', textStyle: { color: DASHBOARD_PALETTE.onSurface } },
    };
}

function emptyOption(message = 'Sem dados'): EChartsOption {
    return {
        ...baseChartDefaults(),
        graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: message, fill: DASHBOARD_PALETTE.onSurfaceMuted, fontSize: 14 } }],
    };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly supabase: SupabaseClient = inject(SupabaseService).client;

    readonly selectedPeriod = signal<PeriodValue>('30d');
    readonly fromDate = computed(() => buildFromDate(this.selectedPeriod()));

    readonly kpis = signal<DashboardKpi[]>([
        { label: 'Total de Alunos', value: '—', icon: 'school', trend: null, isLoading: true, hasError: false },
        { label: 'Alunos PRO', value: '—', icon: 'workspace_premium', trend: null, isLoading: true, hasError: false },
        { label: 'MRR Estimado', value: '—', icon: 'payments', trend: null, isLoading: true, hasError: false },
        { label: 'Assinaturas Ativas', value: '—', icon: 'subscriptions', trend: null, isLoading: true, hasError: false },
        { label: 'Novos Alunos (período)', value: '—', icon: 'person_add', trend: null, isLoading: true, hasError: false },
        { label: 'Cancelamentos (período)', value: '—', icon: 'cancel', trend: null, isLoading: true, hasError: false },
    ]);

    readonly userGrowthOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly proFreeOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly subStatusOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly revenueOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly billingCycleOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly xpOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly aiUsageOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly seedOption = signal<EChartsOption>(emptyOption('Carregando...'));
    readonly lessonsPerModuleOption = signal<EChartsOption>(emptyOption('Carregando...'));

    constructor() {
        effect(() => {
            const _ = this.selectedPeriod();
            this.loadAll();
        });
    }

    setPeriod(period: PeriodValue): void {
        this.selectedPeriod.set(period);
    }

    private async loadAll(): Promise<void> {
        await Promise.allSettled([
            this.loadKpis(),
            this.loadUserGrowth(),
            this.loadProFree(),
            this.loadSubStatus(),
            this.loadRevenue(),
            this.loadBillingCycle(),
            this.loadXp(),
            this.loadAiUsage(),
            this.loadSeeds(),
            this.loadLessonsPerModule(),
        ]);
    }

    private updateKpi(index: number, patch: Partial<DashboardKpi>): void {
        this.kpis.update(current => current.map((k, i) => i === index ? { ...k, ...patch } : k));
    }

    private async loadKpis(): Promise<void> {
        const from = this.fromDate();
        const { current: currentFrom, prior: priorFrom } = buildPriorFromDate(this.selectedPeriod());

        const safeCount = async (query: Promise<{ count: number | null; error: any }>): Promise<number | null> => {
            const { count, error } = await query;
            return error ? null : (count ?? 0);
        };

        const safeSum = async (query: Promise<{ data: any[] | null; error: any }>): Promise<number | null> => {
            const { data, error } = await query;
            return error ? null : (data ?? []).reduce((s: number, r: any) => s + Number(r.transaction_amount ?? 0), 0);
        };

        const [total, pro, mrr, active, newCurrent, newPrior, cancelCurrent, cancelPrior, mrrPrior] = await Promise.all([
            safeCount(this.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student') as any),
            safeCount(this.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_pro', true) as any),
            safeSum(this.supabase.from('subscriptions').select('transaction_amount').eq('status', 'active') as any),
            safeCount(this.supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active') as any),
            safeCount(this.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', currentFrom.toISOString()) as any),
            safeCount(this.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', priorFrom.toISOString()).lt('created_at', currentFrom.toISOString()) as any),
            safeCount(this.supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'cancelled').gte('created_at', currentFrom.toISOString()) as any),
            safeCount(this.supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'cancelled').gte('created_at', priorFrom.toISOString()).lt('created_at', currentFrom.toISOString()) as any),
            safeSum(this.supabase.from('subscriptions').select('transaction_amount').eq('status', 'active').lt('created_at', currentFrom.toISOString()) as any),
        ]);

        const calcTrend = (curr: number | null, prior: number | null): number | null => {
            if (curr === null || prior === null || prior === 0) return null;
            return Math.round(((curr - prior) / prior) * 100);
        };

        this.updateKpi(0, { value: total !== null ? total.toLocaleString('pt-BR') : '—', isLoading: false, hasError: total === null });
        this.updateKpi(1, { value: pro !== null ? pro.toLocaleString('pt-BR') : '—', isLoading: false, hasError: pro === null });
        this.updateKpi(2, { value: mrr !== null ? formatBRL(mrr) : '—', isLoading: false, hasError: mrr === null, trend: calcTrend(mrr, mrrPrior) });
        this.updateKpi(3, { value: active !== null ? active.toLocaleString('pt-BR') : '—', isLoading: false, hasError: active === null });
        this.updateKpi(4, { value: newCurrent !== null ? newCurrent.toLocaleString('pt-BR') : '—', isLoading: false, hasError: newCurrent === null, trend: calcTrend(newCurrent, newPrior) });
        this.updateKpi(5, { value: cancelCurrent !== null ? cancelCurrent.toLocaleString('pt-BR') : '—', isLoading: false, hasError: cancelCurrent === null, trend: calcTrend(cancelCurrent, cancelPrior) });
    }

    private async loadUserGrowth(): Promise<void> {
        const months = buildLast12MonthsLabels();
        const from = new Date(months[0].year, months[0].month - 1, 1);
        const { data, error } = await this.supabase
            .from('profiles')
            .select('created_at')
            .eq('role', 'student')
            .gte('created_at', from.toISOString());

        if (error) { this.userGrowthOption.set(emptyOption('Erro ao carregar dados')); return; }

        const counts = groupByMonth(data ?? []);
        const values = months.map(m => counts[`${m.year}-${m.month}`] ?? 0);

        this.userGrowthOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>${p[0].value} alunos` },
            xAxis: { type: 'category', data: months.map(m => m.label), axisLine: { lineStyle: { color: DASHBOARD_PALETTE.onSurfaceMuted } }, axisLabel: { color: DASHBOARD_PALETTE.onSurface } },
            yAxis: { type: 'value', axisLabel: { color: DASHBOARD_PALETTE.onSurface }, splitLine: { lineStyle: { color: 'rgba(222,229,255,0.08)' } } },
            series: [{ name: 'Novos alunos', type: 'line', data: values, smooth: true, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(63,194,251,0.3)' }, { offset: 1, color: 'rgba(63,194,251,0)' }] } }, lineStyle: { color: DASHBOARD_PALETTE.primary, width: 2 }, itemStyle: { color: DASHBOARD_PALETTE.primary }, symbol: 'circle', symbolSize: 6 }],
            grid: { left: 16, right: 16, top: 16, bottom: 24, containLabel: true },
        });
    }

    private async loadProFree(): Promise<void> {
        const [proRes, freeRes] = await Promise.all([
            this.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_pro', true),
            this.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_pro', false),
        ]);

        if (proRes.error || freeRes.error) { this.proFreeOption.set(emptyOption('Erro ao carregar dados')); return; }

        const proCount = proRes.count ?? 0;
        const freeCount = freeRes.count ?? 0;
        const total = proCount + freeCount;

        this.proFreeOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>${p.value} (${p.percent}%)` },
            legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { color: DASHBOARD_PALETTE.onSurface }, formatter: (name: string) => { const v = name === 'PRO' ? proCount : freeCount; const pct = total > 0 ? Math.round((v / total) * 100) : 0; return `${name}: ${v} (${pct}%)`; } },
            series: [{ type: 'pie', radius: ['48%', '72%'], center: ['35%', '50%'], data: [{ name: 'PRO', value: proCount, itemStyle: { color: DASHBOARD_PALETTE.primary } }, { name: 'Gratuito', value: freeCount, itemStyle: { color: DASHBOARD_PALETTE.surfaceContainerHighest } }], label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: DASHBOARD_PALETTE.primary } } }],
        });
    }

    private async loadSubStatus(): Promise<void> {
        const statuses = ['active', 'cancelled', 'payment_failed', 'pending'];
        const colors: Record<string, string> = { active: DASHBOARD_PALETTE.primary, cancelled: DASHBOARD_PALETTE.error, payment_failed: DASHBOARD_PALETTE.secondary, pending: DASHBOARD_PALETTE.tertiary };
        const labels: Record<string, string> = { active: 'Ativa', cancelled: 'Cancelada', payment_failed: 'Falha', pending: 'Pendente' };

        const results = await Promise.all(statuses.map(s => this.supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', s)));
        if (results.some(r => r.error)) { this.subStatusOption.set(emptyOption('Erro ao carregar dados')); return; }

        const data = statuses.map((s, i) => ({ name: labels[s], value: results[i].count ?? 0, itemStyle: { color: colors[s] } }));

        this.subStatusOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>${p.value} assinaturas` },
            legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { color: DASHBOARD_PALETTE.onSurface } },
            series: [{ type: 'pie', radius: ['48%', '72%'], center: ['35%', '50%'], data, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10 } } }],
        });
    }

    private async loadRevenue(): Promise<void> {
        const months = buildLast12MonthsLabels();
        const from = new Date(months[0].year, months[0].month - 1, 1);
        const { data, error } = await this.supabase.from('subscriptions').select('transaction_amount, created_at').gte('created_at', from.toISOString());

        if (error) { this.revenueOption.set(emptyOption('Erro ao carregar dados')); return; }

        const sums: Record<string, number> = {};
        for (const row of data ?? []) {
            const d = new Date(row.created_at);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            sums[key] = (sums[key] ?? 0) + Number(row.transaction_amount ?? 0);
        }
        const values = months.map(m => sums[`${m.year}-${m.month}`] ?? 0);

        this.revenueOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>${formatBRL(p[0].value)}` },
            xAxis: { type: 'category', data: months.map(m => m.label), axisLabel: { color: DASHBOARD_PALETTE.onSurface }, axisLine: { lineStyle: { color: DASHBOARD_PALETTE.onSurfaceMuted } } },
            yAxis: { type: 'value', axisLabel: { color: DASHBOARD_PALETTE.onSurface, formatter: (v: number) => `R$${(v / 1000).toFixed(0)}k` }, splitLine: { lineStyle: { color: 'rgba(222,229,255,0.08)' } } },
            series: [{ type: 'bar', data: values, itemStyle: { color: DASHBOARD_PALETTE.primary, borderRadius: [4, 4, 0, 0] }, emphasis: { itemStyle: { color: DASHBOARD_PALETTE.primaryDim } } }],
            grid: { left: 16, right: 16, top: 16, bottom: 24, containLabel: true },
        });
    }

    private async loadBillingCycle(): Promise<void> {
        const [monthlyRes, yearlyRes] = await Promise.all([
            this.supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('billing_cycle', 'monthly'),
            this.supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('billing_cycle', 'yearly'),
        ]);

        if (monthlyRes.error || yearlyRes.error) { this.billingCycleOption.set(emptyOption('Erro ao carregar dados')); return; }

        const monthly = monthlyRes.count ?? 0;
        const yearly = yearlyRes.count ?? 0;

        this.billingCycleOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            xAxis: { type: 'value', axisLabel: { color: DASHBOARD_PALETTE.onSurface }, splitLine: { lineStyle: { color: 'rgba(222,229,255,0.08)' } } },
            yAxis: { type: 'category', data: ['Mensal', 'Anual'], axisLabel: { color: DASHBOARD_PALETTE.onSurface }, axisLine: { lineStyle: { color: DASHBOARD_PALETTE.onSurfaceMuted } } },
            series: [{ type: 'bar', data: [{ value: monthly, itemStyle: { color: DASHBOARD_PALETTE.primary, borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: DASHBOARD_PALETTE.onSurface, formatter: '{c}' } }, { value: yearly, itemStyle: { color: DASHBOARD_PALETTE.tertiary, borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: DASHBOARD_PALETTE.onSurface, formatter: '{c}' } }] }],
            grid: { left: 16, right: 48, top: 8, bottom: 8, containLabel: true },
        });
    }

    private async loadXp(): Promise<void> {
        const months = buildLast12MonthsLabels();
        const from = new Date(months[0].year, months[0].month - 1, 1);
        const { data, error } = await this.supabase.from('xp_log').select('amount, reason, created_at').gte('created_at', from.toISOString());

        if (error) { this.xpOption.set(emptyOption('Erro ao carregar dados')); return; }

        const reasons = ['LESSON', 'ACHIEVEMENT', 'PURCHASE_TIP'];
        const reasonColors: Record<string, string> = { LESSON: DASHBOARD_PALETTE.primary, ACHIEVEMENT: DASHBOARD_PALETTE.secondary, PURCHASE_TIP: DASHBOARD_PALETTE.tertiary };
        const reasonLabels: Record<string, string> = { LESSON: 'Aula', ACHIEVEMENT: 'Conquista', PURCHASE_TIP: 'Dica' };

        const sums: Record<string, Record<string, number>> = {};
        for (const row of data ?? []) {
            const d = new Date(row.created_at);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            if (!sums[key]) sums[key] = {};
            sums[key][row.reason] = (sums[key][row.reason] ?? 0) + Number(row.amount ?? 0);
        }

        this.xpOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: reasons.map(r => reasonLabels[r]), textStyle: { color: DASHBOARD_PALETTE.onSurface }, top: 4 },
            xAxis: { type: 'category', data: months.map(m => m.label), axisLabel: { color: DASHBOARD_PALETTE.onSurface }, axisLine: { lineStyle: { color: DASHBOARD_PALETTE.onSurfaceMuted } } },
            yAxis: { type: 'value', axisLabel: { color: DASHBOARD_PALETTE.onSurface }, splitLine: { lineStyle: { color: 'rgba(222,229,255,0.08)' } } },
            series: reasons.map(r => ({ name: reasonLabels[r], type: 'bar', stack: 'xp', data: months.map(m => sums[`${m.year}-${m.month}`]?.[r] ?? 0), itemStyle: { color: reasonColors[r] } })),
            grid: { left: 16, right: 16, top: 40, bottom: 24, containLabel: true },
        });
    }

    private async loadAiUsage(): Promise<void> {
        const from = this.fromDate();
        const { data, error } = await this.supabase.from('ai_usage_logs').select('action_type, created_at').gte('created_at', from.toISOString());

        if (error) { this.aiUsageOption.set(emptyOption('Erro ao carregar dados')); return; }

        const days: string[] = [];
        const now = new Date();
        const diffMs = now.getTime() - from.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        for (let i = diffDays - 1; i >= 0; i--) {
            const d = new Date(now); d.setDate(now.getDate() - i);
            days.push(d.toISOString().slice(0, 10));
        }

        const types = ['evaluate_content', 'submit_code'];
        const typeLabels: Record<string, string> = { evaluate_content: 'Avaliar conteúdo', submit_code: 'Enviar código' };
        const typeColors: Record<string, string> = { evaluate_content: DASHBOARD_PALETTE.primary, submit_code: DASHBOARD_PALETTE.secondary };

        const counts: Record<string, Record<string, number>> = {};
        for (const row of data ?? []) {
            const day = new Date(row.created_at).toISOString().slice(0, 10);
            if (!counts[day]) counts[day] = {};
            counts[day][row.action_type] = (counts[day][row.action_type] ?? 0) + 1;
        }

        this.aiUsageOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'axis' },
            legend: { data: types.map(t => typeLabels[t]), textStyle: { color: DASHBOARD_PALETTE.onSurface }, top: 4 },
            xAxis: { type: 'category', data: days, axisLabel: { color: DASHBOARD_PALETTE.onSurface, rotate: 30, formatter: (v: string) => v.slice(5) }, axisLine: { lineStyle: { color: DASHBOARD_PALETTE.onSurfaceMuted } } },
            yAxis: { type: 'value', axisLabel: { color: DASHBOARD_PALETTE.onSurface }, splitLine: { lineStyle: { color: 'rgba(222,229,255,0.08)' } } },
            series: types.map(t => ({ name: typeLabels[t], type: 'line', data: days.map(d => counts[d]?.[t] ?? 0), smooth: true, lineStyle: { color: typeColors[t] }, itemStyle: { color: typeColors[t] }, symbol: 'none' })),
            grid: { left: 16, right: 16, top: 40, bottom: 32, containLabel: true },
        });
    }

    private async loadSeeds(): Promise<void> {
        const months = buildLast12MonthsLabels();
        const from = new Date(months[0].year, months[0].month - 1, 1);
        const { data, error } = await this.supabase.from('seed_log').select('amount, created_at').gte('created_at', from.toISOString());

        if (error) { this.seedOption.set(emptyOption('Erro ao carregar dados')); return; }

        const sums: Record<string, number> = {};
        for (const row of data ?? []) {
            const d = new Date(row.created_at);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            sums[key] = (sums[key] ?? 0) + Number(row.amount ?? 0);
        }
        const values = months.map(m => sums[`${m.year}-${m.month}`] ?? 0);

        this.seedOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>${p[0].value.toLocaleString('pt-BR')} seeds` },
            xAxis: { type: 'category', data: months.map(m => m.label), axisLabel: { color: DASHBOARD_PALETTE.onSurface }, axisLine: { lineStyle: { color: DASHBOARD_PALETTE.onSurfaceMuted } } },
            yAxis: { type: 'value', axisLabel: { color: DASHBOARD_PALETTE.onSurface }, splitLine: { lineStyle: { color: 'rgba(222,229,255,0.08)' } } },
            series: [{ type: 'bar', data: values, itemStyle: { color: DASHBOARD_PALETTE.tertiary, borderRadius: [4, 4, 0, 0] } }],
            grid: { left: 16, right: 16, top: 16, bottom: 24, containLabel: true },
        });
    }

    private async loadLessonsPerModule(): Promise<void> {
        const { data, error } = await this.supabase
            .from('user_lessons')
            .select(`
                id,
                lesson:lesson_id (
                    sub_module:sub_module_id (
                        module:module_id (
                            title
                        )
                    )
                )
            `)
            .eq('completed', true);

        if (error) { this.lessonsPerModuleOption.set(emptyOption('Erro ao carregar dados')); return; }

        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
            const moduleTitle = (row.lesson as any)?.sub_module?.module?.title;
            if (moduleTitle) {
                counts[moduleTitle] = (counts[moduleTitle] ?? 0) + 1;
            }
        }

        const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]); // Sort descending
        if (keys.length === 0) {
            this.lessonsPerModuleOption.set(emptyOption('Sem lições concluídas'));
            return;
        }

        const values = keys.map(k => counts[k]);

        this.lessonsPerModuleOption.set({
            ...baseChartDefaults(),
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            xAxis: { type: 'value', axisLabel: { color: DASHBOARD_PALETTE.onSurface }, splitLine: { lineStyle: { color: 'rgba(222,229,255,0.08)' } } },
            yAxis: { type: 'category', data: keys, axisLabel: { color: DASHBOARD_PALETTE.onSurface, width: 120, overflow: 'truncate' }, axisLine: { lineStyle: { color: DASHBOARD_PALETTE.onSurfaceMuted } }, inverse: true },
            series: [{ type: 'bar', data: values, itemStyle: { color: DASHBOARD_PALETTE.primary, borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: DASHBOARD_PALETTE.onSurface, formatter: '{c}' } }],
            grid: { left: 16, right: 48, top: 8, bottom: 8, containLabel: true },
        });
    }
}
