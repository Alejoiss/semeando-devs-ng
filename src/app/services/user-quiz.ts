import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UserQuiz } from '../../models/user-quiz/user-quiz';

@Injectable({
    providedIn: 'root',
})
export class UserQuizService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async createAttempt(userId: string, quizId: string): Promise<UserQuiz> {
        const { data, error } = await this.supabase
            .from('user_quizzes')
            .insert({
                user_id: userId,
                quiz_id: quizId
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return this.mapUserQuiz(data);
    }

    async finishAttempt(attemptId: string, score: number, spentTime: number): Promise<UserQuiz> {
        const { data, error } = await this.supabase
            .from('user_quizzes')
            .update({
                score,
                spent_time: spentTime,
                completed: true,
                completed_at: new Date().toISOString()
            })
            .eq('id', attemptId)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return this.mapUserQuiz(data);
    }

    private mapUserQuiz(data: any): UserQuiz {
        return {
            id: data.id,
            userId: data.user_id,
            quizId: data.quiz_id,
            score: data.score,
            spentTime: data.spent_time,
            completed: data.completed,
            completedAt: data.completed_at ? new Date(data.completed_at) : null,
            createdAt: new Date(data.created_at)
        } as UserQuiz;
    }
}
