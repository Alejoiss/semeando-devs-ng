import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserQuestion } from '../../models/user-question/user-question';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class UserQuestionService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async saveUserQuestion(userQuestion: Partial<UserQuestion>): Promise<UserQuestion> {
        const { data, error } = await this.supabase
            .from('user_questions')
            .insert({
                user_id: userQuestion.userId,
                question_id: userQuestion.questionId,
                answer_id: userQuestion.answerId,
                is_correct: userQuestion.isCorrect,
                answered_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            id: data.id,
            userId: data.user_id,
            questionId: data.question_id,
            answerId: data.answer_id,
            isCorrect: data.is_correct,
            answeredAt: new Date(data.answered_at)
        } as UserQuestion;
    }
}
