import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Answer } from '../../models/answer/answer';

@Injectable({
    providedIn: 'root',
})
export class AnswerService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getAnswersByQuestionId(questionId: string): Promise<Answer[]> {
        const { data, error } = await this.supabase.rpc('get_quiz_answers_safe', {
            p_question_id: questionId
        });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map((a: any) => ({
            id: a.id,
            questionId: a.question_id,
            text: a.text
        })) as Answer[];
    }

    async getAnswersByQuestionIdForEditor(questionId: string): Promise<Answer[]> {
        const { data, error } = await this.supabase
            .from('answers')
            .select('*')
            .eq('question_id', questionId);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map(a => ({
            id: a.id,
            questionId: a.question_id,
            text: a.text,
            isCorrect: a.is_correct,
            reason: a.reason,
            createdAt: new Date(a.created_at)
        })) as Answer[];
    }

    async verifyAnswer(answerId: string): Promise<{ isCorrect: boolean; reason: string }> {
        const { data, error } = await this.supabase.rpc('verify_quiz_answer', {
            p_answer_id: answerId
        });

        if (error) {
            throw new Error(error.message);
        }

        const result = data?.[0];
        return {
            isCorrect: result?.is_correct ?? false,
            reason: result?.reason ?? ''
        };
    }

    async getQuestionHint(questionId: string): Promise<string> {
        const { data, error } = await this.supabase.rpc('get_quiz_question_hint', {
            p_question_id: questionId
        });

        if (error) {
            throw new Error(error.message);
        }

        return data ?? '';
    }
}
