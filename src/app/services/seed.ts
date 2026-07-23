import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class SeedService {
    private supabase: SupabaseClient = inject(SupabaseService).client;
    private userService = inject(UserService);

    private readonly _totalSeeds = signal<number>(0);
    public readonly totalSeeds = this._totalSeeds.asReadonly();

    async getSeeds(): Promise<number> {
        try {
            const user = await this.userService.getUserProfile();
            if (!user) return 0;
            const seeds = await this.getSeedsForUser(user.id);
            this._totalSeeds.set(seeds);
            return seeds;
        } catch (error) {
            console.error('Error fetching seeds:', error);
            return 0;
        }
    }

    async getSeedsForUser(userId: string): Promise<number> {
        try {
            const { data, error } = await this.supabase
                .from('seed')
                .select('total_seeds')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                throw new Error(error.message);
            }

            return data?.total_seeds || 0;
        } catch (error) {
            console.error('Error fetching seeds for user:', error);
            return 0;
        }
    }

    async refreshSeeds(): Promise<void> {
        await this.getSeeds();
    }

    async creditSeeds(amount: number): Promise<void> {
        try {
            const user = await this.userService.getUserProfile();
            const { error } = await this.supabase
                .from('seed_log')
                .insert({
                    user_id: user.id,
                    amount: amount
                });

            if (error) {
                throw new Error(error.message);
            }

            await this.refreshSeeds();
        } catch (error) {
            console.error('Error crediting seeds:', error);
        }
    }

    async spendSeeds(amount: number): Promise<boolean> {
        try {
            const user = await this.userService.getUserProfile();
            const { error } = await this.supabase
                .from('seed_log')
                .insert({
                    user_id: user.id,
                    amount: -amount
                });

            if (error) {
                throw new Error(error.message);
            }

            await this.refreshSeeds();
            return true;
        } catch (error) {
            console.error('Error spending seeds:', error);
            return false;
        }
    }
}
