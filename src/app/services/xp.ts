import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class XpService {
    private supabase: SupabaseClient = inject(SupabaseService).client;
    private userService = inject(UserService);

    private readonly _totalXp = signal<number>(0);
    public readonly totalXp = this._totalXp.asReadonly();

    async getXp(): Promise<number> {
        try {
            const user = await this.userService.getUserProfile();
            if (!user) return 0;
            const xp = await this.getXpForUser(user.id);
            this._totalXp.set(xp);
            return xp;
        } catch (error) {
            console.error('Error fetching XP:', error);
            return 0;
        }
    }

    async getXpForUser(userId: string): Promise<number> {
        try {
            const { data, error } = await this.supabase
                .from('xp')
                .select('total_xp')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                throw new Error(error.message);
            }

            return data?.total_xp || 0;
        } catch (error) {
            console.error('Error fetching XP for user:', error);
            return 0;
        }
    }

    async refreshXp(): Promise<void> {
        await this.getXp();
    }
}
