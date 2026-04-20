import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Quiz } from '../../models/quiz/quiz';

@Injectable({
    providedIn: 'root',
})
export class QuizService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
        const { data, error } = await this.supabase
            .from('quizzes')
            .select('*')
            .eq('lesson_id', lessonId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(error.message);
        }

        if (!data) return null;

        return {
            id: data.id,
            lessonId: data.lesson_id,
            spentTime: data.spent_time,
            createdAt: new Date(data.created_at),
        } as Quiz;
    }

    async completeQuiz(attemptId: string, lessonId: string, correctCount: number, totalCount: number, spentTime: number): Promise<any> {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (!session) throw new Error('No active session found');

        const { data, error } = await this.supabase.functions.invoke('complete-quiz', {
            body: { attemptId, lessonId, correctCount, totalCount, spentTime },
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (error) {
            throw new Error(error.message || 'Error completing quiz');
        }

        return data;
    }
}
