import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { RankingResult } from '../../models/ranking/ranking';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class RankingOverallService {
    private supabase: SupabaseClient;
    private userService = inject(UserService);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

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
