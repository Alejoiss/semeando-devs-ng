import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { RankingResult } from '../../models/ranking/ranking';
import { SupabaseService } from './supabase';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class RankingMonthlyService {
    private supabase: SupabaseClient = inject(SupabaseService).client;
    private userService = inject(UserService);

    async getRanking(): Promise<RankingResult> {
        try {
            const user = await this.userService.getUserProfile();
            const now = new Date();
            const { data, error } = await this.supabase.rpc('get_ranking_monthly', {
                p_user_id: user.id,
                p_year: now.getFullYear(),
                p_month: now.getMonth() + 1
            });

            if (error) {
                throw new Error(error.message);
            }

            return data as RankingResult;
        } catch (error) {
            console.error('Error fetching monthly ranking:', error);
            throw error;
        }
    }
}
