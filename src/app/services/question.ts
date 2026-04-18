import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Question } from '../../models/question/question';
import { SectionContentType } from '../../models/section-content/section-content';

@Injectable({
    providedIn: 'root',
})
export class QuestionService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getQuestionsByQuizId(quizId: string): Promise<Question[]> {
        const { data, error } = await this.supabase
        .from('questions')
        .select('*, sectionContents:section_content(*)')
            .eq('quiz_id', quizId);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map(q => ({
            id: q.id,
            quizId: q.quiz_id,
            createdAt: new Date(q.created_at),
            sectionContents: (q.sectionContents ?? []).map((sc: any) => ({
                id: sc.id,
                type: sc.type as SectionContentType,
                content: sc.content,
                file: sc.file,
                fileDescription: sc.file_description,
                order: sc.order,
                lessonId: sc.lesson_id,
                questionId: sc.question_id
            }))
        })).sort((a, b) => a.sectionContents[0].order - b.sectionContents[0].order) as Question[];
    }
}
