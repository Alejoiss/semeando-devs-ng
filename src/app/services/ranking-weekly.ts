import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { RankingResult } from '../../models/ranking/ranking';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class RankingWeeklyService {
    private supabase: SupabaseClient;
    private userService = inject(UserService);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getRanking(): Promise<RankingResult> {
        try {
            const user = await this.userService.getUserProfile();
            const now = new Date();
            
            const { data, error } = await this.supabase.rpc('get_ranking_weekly', {
                p_user_id: user.id,
                p_year: this.getISOYear(now),
                p_week: this.getISOWeek(now)
            });

            if (error) {
                throw new Error(error.message);
            }

            return data as RankingResult;
        } catch (error) {
            console.error('Error fetching weekly ranking:', error);
            throw error;
        }
    }

    private getISOWeek(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    private getISOYear(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        return d.getUTCFullYear();
    }
}
