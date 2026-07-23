import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UserLesson } from '../../models/user-lesson/user-lesson';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class UserLessonService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getUserLessons(): Promise<UserLesson[]> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await this.supabase
            .from('user_lessons')
            .select('*, lesson:lessons(*)')
            .eq('user_id', user.id);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map(item => this.mapUserLesson(item));
    }

    async getUserLessonsForUser(userId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('user_lessons')
            .select('id, completed, lesson:lessons(id, sub_module_id)')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map((item: any) => ({
            id: item.id,
            completed: item.completed,
            lesson: item.lesson ? {
                id: item.lesson.id,
                subModuleId: item.lesson.sub_module_id
            } : undefined
        }));
    }

    async startLesson(lessonId: string): Promise<void> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { error } = await this.supabase
            .from('user_lessons')
            .insert({
                user_id: user.id,
                lesson_id: lessonId,
                completed: false,
                completed_at: null
            });

        if (error) {
            throw new Error(error.message);
        }
    }

    async getUserLesson(lessonId: string): Promise<UserLesson | null> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();
        if (authError || !user) throw new Error('User not authenticated');

        const { data, error } = await this.supabase
            .from('user_lessons')
            .select('*, lesson:lessons(*)')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(error.message);
        }

        return data ? this.mapUserLesson(data) : null;
    }

    private mapUserLesson(data: any): UserLesson {
        if (!data) return null as any;
        return {
            id: data.id,
            completed: data.completed,
            completedAt: data.completed_at ? new Date(data.completed_at) : null,
            savedCode: data.saved_code,
            submittedCode: data.submitted_code,
            aiFeedback: data.ai_feedback,
            user: data.user,
            lesson: data.lesson ? {
                id: data.lesson.id,
                title: data.lesson.title,
                description: data.lesson.description,
                type: data.lesson.type,
                order: data.lesson.order,
                subModuleId: data.lesson.sub_module_id,
                xp: data.lesson.xp,
                language: data.lesson.language,
                initialCode: data.lesson.initial_code,
                createdBy: data.lesson.created_by
            } : undefined
        } as unknown as UserLesson;
    }

    async updateDraftCode(lessonId: string, code: string): Promise<void> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();
        if (authError || !user) throw new Error('User not authenticated');

        const { error } = await this.supabase
            .from('user_lessons')
            .update({ saved_code: code })
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId);

        if (error) {
            throw new Error(error.message);
        }
    }

    async evaluateChallenge(lessonId: string, description: string, code: string): Promise<{ aiFeedback: string; xpAwarded: number; earnedAchievements: any[]; subModuleCompleted: boolean; moduleCompleted: boolean }> {
        const { data: { session }, error: authError } = await this.supabase.auth.getSession();
        if (authError || !session) throw new Error('User not authenticated');

        const response = await fetch(`${environment.supabaseUrl}/functions/v1/evaluate-challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ lessonId, description, code }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to evaluate challenge');
        }

        return data;
    }
}
