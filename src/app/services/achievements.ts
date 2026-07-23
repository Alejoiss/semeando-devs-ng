import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Achievements } from '../../models/achievements/achievements';
import { UserAchievement } from '../../models/user-achievement/user-achievement';
import { SupabaseService } from './supabase';
import { UserService } from './user';

@Injectable({
    providedIn: 'root',
})
export class AchievementsService {
    private supabase: SupabaseClient = inject(SupabaseService).client;
    private userService = inject(UserService);

    public unseenAchievement = signal<any | null>(null);

    async getAchievements(): Promise<Achievements[]> {
        try {
            const { data, error } = await this.supabase
                .from('achievements')
                .select('*')
                .eq('is_visible', true)
                .order('created_at', { ascending: true });

            if (error) {
                throw new Error(error.message);
            }

            return (data || []).map((item: any) => new Achievements(item));
        } catch (error) {
            console.error('Error fetching achievements:', error);
            return [];
        }
    }

    async getAchievementByModuleId(moduleId: string): Promise<Achievements | null> {
        try {
            const { data, error } = await this.supabase
                .from('achievements')
                .select('*')
                .eq('module_id', moduleId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(error.message);
            }

            return new Achievements(data);
        } catch (error) {
            console.error('Error fetching achievement by module id:', error);
            return null;
        }
    }

    async getUserAchievements(): Promise<UserAchievement[]> {
        try {
            const user = await this.userService.getUserProfile();
            if (!user) return [];
            return this.getUserAchievementsForUser(user.id);
        } catch (error) {
            console.error('Error fetching user achievements:', error);
            return [];
        }
    }

    async getUserAchievementsForUser(userId: string): Promise<UserAchievement[]> {
        try {
            const { data, error } = await this.supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', userId)
                .eq('completed', true);

            if (error) {
                throw new Error(error.message);
            }

            return (data || []).map((item: any) => new UserAchievement(item));
        } catch (error) {
            console.error('Error fetching user achievements:', error);
            return [];
        }
    }

    async checkUnseenAchievements(): Promise<void> {
        try {
            const user = await this.userService.getUserProfile();
            if (!user) {
                console.warn('[AchievementsService] No user profile found');
                return;
            }

            const { data, error } = await this.supabase
                .from('user_achievements')
                .select('*, achievement:achievements(*)')
                .eq('user_id', user.id)
                .eq('completed', true)
                .eq('viewed', false)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('[AchievementsService] Error fetching unseen:', error);
                throw error;
            }

            this.unseenAchievement.set(data);
        } catch (error) {
            this.unseenAchievement.set(null);
        }
    }

    async markAsViewed(achievementId: string): Promise<void> {
        try {
            const user = await this.userService.getUserProfile();
            if (!user) return;

            const { data, error, count } = await this.supabase
                .from('user_achievements')
                .update({ viewed: true })
                .match({ user_id: user.id, achievement_id: achievementId })
                .select();

            if (error) {
                console.error('[AchievementsService] Update error:', error);
                throw error;
            }

            // Set locally first to ensure UI reacts immediately
            this.unseenAchievement.set(null);

            // Then check for next one
            await this.checkUnseenAchievements();
        } catch (error) {
            console.error('[AchievementsService] markAsViewed failed:', error);
        }
    }
}
