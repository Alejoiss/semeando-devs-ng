import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UserQuestion } from '../../models/user-question/user-question';

@Injectable({
    providedIn: 'root',
})
export class UserQuestionService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

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
