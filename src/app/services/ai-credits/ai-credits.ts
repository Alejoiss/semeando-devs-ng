import { Injectable, computed, signal, inject, effect } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase';
import { UserService } from '../user';

export interface AiCreditsStatus {
    submitCodeUsed: number;
    submitCodeLimit: number;
}

@Injectable({
    providedIn: 'root',
})
export class AiCreditsService {
    private supabase: SupabaseClient = inject(SupabaseService).client;
    private userService = inject(UserService);

    private creditsState = signal<AiCreditsStatus>({
        submitCodeUsed: 0,
        submitCodeLimit: 5,
    });

    readonly submitCodeUsed = computed(() => this.creditsState().submitCodeUsed);
    readonly submitCodeLimit = computed(() => this.creditsState().submitCodeLimit);
    readonly submitCodeRemaining = computed(() => Math.max(0, this.creditsState().submitCodeLimit - this.creditsState().submitCodeUsed));

    constructor() {
        effect(() => {
            const user = this.userService.currentUser();
            if (user) {
                this.refreshCredits();
            }
        });
    }

    async refreshCredits() {
        const user = this.userService.currentUser();
        if (!user) return;

        const limit = user.isPro ? 30 : 5;

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const startOfDayStr = today.toISOString();

        const { count } = await this.supabase
            .from('ai_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action_type', 'submit_code')
            .gte('created_at', startOfDayStr);

        this.creditsState.set({
            submitCodeUsed: count || 0,
            submitCodeLimit: limit,
        });
    }

    incrementSubmitCodeUsage() {
        this.creditsState.update(state => ({
            ...state,
            submitCodeUsed: state.submitCodeUsed + 1
        }));
    }
}
