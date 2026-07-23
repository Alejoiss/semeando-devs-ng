import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { RankingResult } from '../../models/ranking/ranking';
import { SupabaseService } from './supabase';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class RankingOverallService {
    private supabase: SupabaseClient = inject(SupabaseService).client;
    private userService = inject(UserService);

    async getRanking(): Promise<RankingResult> {
        try {
            const user = await this.userService.getUserProfile();
            const { data, error } = await this.supabase.rpc('get_ranking_overall', {
                p_user_id: user.id
            });

            if (error) {
                throw new Error(error.message);
            }

            return data as RankingResult;
        } catch (error) {
            console.error('Error fetching overall ranking:', error);
            throw error;
        }
    }
}
