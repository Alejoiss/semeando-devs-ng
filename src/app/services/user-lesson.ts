import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UserLesson } from '../../models/user-lesson/user-lesson';

@Injectable({
    providedIn: 'root',
})
export class UserLessonService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

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

        return (data ?? []) as unknown as UserLesson[];
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

        return data ? (data as unknown as UserLesson) : null;
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
