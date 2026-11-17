import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { RevenueReport } from '../../models/revenue-report/revenue-report';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class AdminRevenueReportService {
    private readonly supabase: SupabaseClient = inject(SupabaseService).client;

    async getReport(year: number, month: number): Promise<RevenueReport> {
        const { data, error } = await this.supabase.rpc('admin_revenue_report', {
            p_year: year,
            p_month: month,
        });

        if (error) {
            throw new Error(error.message);
        }
        return data as RevenueReport;
    }
}
