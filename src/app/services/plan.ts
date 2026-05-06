import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import { Plan } from '../../models/plan/plan';

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private readonly supabase = inject(SupabaseService);

    async getMainPlan(): Promise<Plan | null> {
        const { data, error } = await this.supabase.client
            .from('plans')
            .select('*')
            .eq('is_main', true)
            .single();

        if (error) {
            console.error('Error fetching main plan:', error);
            return null;
        }

        return data ? new Plan(data) : null;
    }
}
