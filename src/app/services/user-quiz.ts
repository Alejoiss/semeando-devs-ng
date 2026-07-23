import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserQuiz } from '../../models/user-quiz/user-quiz';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class UserQuizService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

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

    async getUserQuizzesBySubModule(subModuleId: string): Promise<UserQuiz[]> {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (!session) throw new Error('No active session found');

        const { data: results, error: fetchError } = await this.supabase
            .from('user_quizzes')
            .select(`
                *,
                quiz:quizzes!inner (
                    lesson_id,
                    lesson:lessons!inner (
                        sub_module_id
                    ),
                    questions:questions (count)
                )
            `)
            .eq('quiz.lesson.sub_module_id', subModuleId)
            .eq('user_id', session.user.id);

        if (fetchError) {
            throw new Error(fetchError.message);
        }

        return (results || []).map(q => this.mapUserQuiz(q));
    }

    private mapUserQuiz(data: any): UserQuiz {
        return {
            id: data.id,
            userId: data.user_id,
            quizId: data.quiz_id,
            lessonId: data.quiz?.lesson_id,
            score: data.score,
            spentTime: data.spent_time,
            completed: data.completed,
            completedAt: data.completed_at ? new Date(data.completed_at) : null,
            totalQuestions: data.quiz?.questions?.[0]?.count ?? 0,
            createdAt: new Date(data.created_at)
        } as UserQuiz;
    }
}
