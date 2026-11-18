import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase';
import { UserService } from '../user';

export const DAILY_LIMIT = 5;

@Injectable({
    providedIn: 'root',
})
export class DailyLimitService {
    private supabase: SupabaseClient = inject(SupabaseService).client;
    private userService = inject(UserService);

    readonly dailyCompletedCount = signal<number>(0);

    readonly isDailyLimitReached = computed(() => {
        const isPro = this.userService.currentUser()?.isPro ?? false;
        return !isPro && this.dailyCompletedCount() >= DAILY_LIMIT;
    });

    readonly dailyIndicators = computed<boolean[]>(() =>
        Array.from({ length: DAILY_LIMIT }, (_, i) => i < this.dailyCompletedCount())
    );

    private getTodayRangeUtcMinus3(): { start: string; end: string } {
        const offsetMs = -3 * 60 * 60 * 1000;
        const localNow = new Date(Date.now() + offsetMs);

        const startMs =
            Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()) - offsetMs;
        const endMs = startMs + 24 * 60 * 60 * 1000 - 1;

        return { start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() };
    }

    async loadDailyCount(userId: string): Promise<void> {
        if (this.userService.currentUser()?.isPro) {
            return;
        }

        const { start, end } = this.getTodayRangeUtcMinus3();

        const { count, error } = await this.supabase
            .from('user_lessons')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .gte('completed_at', start)
            .lte('completed_at', end);

        if (error) {
            console.error('[DailyLimitService] Failed to load daily count:', error.message);
            return;
        }

        this.dailyCompletedCount.set(count ?? 0);
    }

    async isLessonAccessible(lessonId: string, userId: string): Promise<boolean> {
        if (this.userService.currentUser()?.isPro) {
            return true;
        }

        const { data, error } = await this.supabase
            .from('user_lessons')
            .select('completed')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .eq('completed', true)
            .maybeSingle();

        if (error) {
            console.error('[DailyLimitService] Failed to check lesson accessibility:', error.message);
            return true;
        }

        if (data?.completed === true) {
            return true;
        }

        return !this.isDailyLimitReached();
    }
}
