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
}
