import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Quiz } from '../../models/quiz/quiz';
import { Question } from '../../models/question/question';
import { QuestionService } from './question';
import { LessonService } from './lesson';

@Injectable({
    providedIn: 'root',
})
export class QuizService {
    private supabase: SupabaseClient;
    private questionService = inject(QuestionService);
    private lessonService = inject(LessonService);

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

    async getOrCreateQuiz(lessonId: string): Promise<Quiz> {
        let quiz = await this.getQuizByLessonId(lessonId);
        if (quiz) return quiz;

        const { data, error } = await this.supabase
            .from('quizzes')
            .insert({ lesson_id: lessonId })
            .select()
            .single();

        if (error) throw new Error(error.message);

        return {
            id: data.id,
            lessonId: data.lesson_id,
            spentTime: data.spent_time,
            createdAt: new Date(data.created_at),
        } as Quiz;
    }

    async saveQuestion(quizId: string, questionData: any): Promise<any> {
        // 1. Upsert Question
        const qPayload = questionData.id ? { id: questionData.id, quiz_id: quizId } : { quiz_id: quizId };
        const { data: qData, error: qError } = await this.supabase
            .from('questions')
            .upsert(qPayload)
            .select()
            .single();

        if (qError) throw new Error(qError.message);
        const savedQuestionId = qData.id;

        // 2. Upsert SectionContent
        const scPayload = {
            id: questionData.sectionContent?.id || undefined,
            question_id: savedQuestionId,
            type: 'MARKDOWN',
            content: questionData.statement || '',
            order: 0
        };
        const { data: scData, error: scError } = await this.supabase
            .from('section_content')
            .upsert(scPayload)
            .select()
            .single();

        if (scError) throw new Error(scError.message);

        // 3. Upsert Answers
        const answersPayload = questionData.answers.map((a: any) => ({
            id: a.id || crypto.randomUUID(),
            question_id: savedQuestionId,
            text: a.text || '',
            is_correct: !!a.isCorrect,
            reason: a.justification || a.reason || ''
        }));
        
        const { error: ansError } = await this.supabase
            .from('answers')
            .upsert(answersPayload);

        if (ansError) throw new Error(ansError.message);

        return {
            id: savedQuestionId,
            statement: scData.content || '',
            answers: answersPayload.map((a: any) => ({
                id: a.id,
                text: a.text,
                justification: a.reason,
                isCorrect: a.is_correct
            })),
            sectionContent: scData
        };
    }

    async getRevisionQuestions(lessonId: string, subModuleId: string): Promise<Question[]> {
        const lesson = await this.lessonService.getLessonById(lessonId);
        if (!lesson) return [];

        const currentOrder = lesson.order;

        // 'order' is a reserved PostgREST keyword, so we cannot use .lt('order', ...)
        // directly. Instead we fetch all lessons in the submodule and filter client-side.
        const { data: lessonsData, error: lessonsError } = await this.supabase
            .from('lessons')
            .select('id, order')
            .eq('sub_module_id', subModuleId);

        if (lessonsError) {
            throw new Error(lessonsError.message);
        }

        const eligibleLessonIds = (lessonsData ?? [])
            .filter((l: any) => l.order < currentOrder)
            .map((l: any) => l.id);

        if (eligibleLessonIds.length === 0) return [];

        const { data: quizzesData, error: quizzesError } = await this.supabase
            .from('quizzes')
            .select('id')
            .in('lesson_id', eligibleLessonIds);

        if (quizzesError) {
            throw new Error(quizzesError.message);
        }

        if (!quizzesData || quizzesData.length === 0) return [];

        const allQuestions: Question[] = [];
        for (const quiz of quizzesData) {
            const questions = await this.questionService.getQuestionsByQuizId(quiz.id);
            allQuestions.push(...questions);
        }

        return this.shuffle(allQuestions).slice(0, 10);
    }

    async completeQuiz(attemptId: string | null, lessonId: string, correctCount: number, totalCount: number, spentTime: number): Promise<any> {
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

    private shuffle<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}

