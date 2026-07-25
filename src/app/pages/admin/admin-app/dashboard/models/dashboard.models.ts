export type PeriodValue = '7d' | '30d' | '90d' | '12m';

export interface PeriodOption {
    label: string;
    value: PeriodValue;
}

export interface DashboardKpi {
    label: string;
    value: string;
    icon: string;
    trend: number | null;
    isLoading: boolean;
    hasError: boolean;
}

export interface MonthlyDataPoint {
    month: string;
    value: number;
}

export interface GroupedDataPoint {
    month: string;
    series: Record<string, number>;
}
