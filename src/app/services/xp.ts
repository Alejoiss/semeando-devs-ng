import { inject, Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class XpService {
    private supabase: SupabaseClient;
    private userService = inject(UserService);

    private readonly _totalXp = signal<number>(0);
    public readonly totalXp = this._totalXp.asReadonly();

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getXp(): Promise<number> {
        try {
            const user = await this.userService.getUserProfile();
            const { data, error } = await this.supabase
                .from('xp')
                .select('total_xp')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error(error.message);
            }

            const xp = data?.total_xp || 0;
            this._totalXp.set(xp);
            return xp;
        } catch (error) {
            console.error('Error fetching XP:', error);
            return 0;
        }
    }

    async refreshXp(): Promise<void> {
        await this.getXp();
    }
}
