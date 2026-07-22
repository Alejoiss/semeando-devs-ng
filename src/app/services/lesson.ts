import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Lesson, LessonType } from '../../models/lesson/lesson';

@Injectable({
    providedIn: 'root',
})
export class LessonService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getLessonsBySubModuleSlug(slug: string): Promise<Lesson[]> {
        const { data, error } = await this.supabase
            .from('lessons')
            .select('*, subModule:submodules!inner(*)')
            .eq('submodules.slug', slug)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as Lesson[];
    }

    async getLessonsByModuleSlug(slug: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('lessons')
            .select('id, order, sub_module_id, subModule:submodules!inner(id, module:modules!inner(slug))')
            .eq('submodules.modules.slug', slug)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map((d: any) => ({
            id: d.id,
            order: d.order,
            subModuleId: d.sub_module_id,
            subModule: d.subModule ? {
                id: d.subModule.id
            } : undefined
        }));
    }

    async getLessonsLightweight(): Promise<{ id: string; subModuleId: string; moduleId: string }[]> {
        const { data, error } = await this.supabase
            .from('lessons')
            .select('id, sub_module_id, subModule:submodules!inner(module_id)');

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map((item: any) => ({
            id: item.id,
            subModuleId: item.sub_module_id,
            moduleId: item.subModule?.module_id
        }));
    }

    async getLessonsBySubModuleId(subModuleId: string): Promise<Lesson[]> {
        const { data, error } = await this.supabase
            .from('lessons')
            .select('*')
            .eq('sub_module_id', subModuleId)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map(d => ({
            id: d.id,
            title: d.title,
            description: d.description,
            type: d.type,
            order: d.order,
            subModuleId: d.sub_module_id,
            xp: d.xp,
            language: d.language,
            initialCode: d.initial_code,
            createdBy: d.created_by,
            isValidated: d.is_validated,
        })) as Lesson[];
    }

    async updateLessonOrder(updates: { id: string; order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            this.supabase
                .from('lessons')
                .update({ order: u.order })
                .eq('id', u.id)
        );

        const results = await Promise.all(promises);
        const error = results.find(r => r.error)?.error;

        if (error) {
            throw new Error(error.message);
        }
    }

    async deleteLesson(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('lessons')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    }

    async getAllLessons(): Promise<Lesson[]> {
        const { data, error } = await this.supabase
            .from('lessons')
            .select('*, subModule:submodules(*, module:modules(*))');

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as Lesson[];
    }

    async getLessonById(lessonId: string): Promise<Lesson | null> {
        const { data, error } = await this.supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(error.message);
        }

        if (!data) return null;

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            type: data.type,
            order: data.order,
            subModuleId: data.sub_module_id,
            xp: data.xp,
            language: data.language,
            initialCode: data.initial_code,
            createdBy: data.created_by,
        } as Lesson;
    }

    async createLesson(lesson: Partial<Lesson>): Promise<Lesson> {
        const { data, error } = await this.supabase
            .from('lessons')
            .insert({
                title: lesson.title,
                description: lesson.description,
                type: lesson.type,
                order: lesson.order,
                sub_module_id: lesson.subModuleId,
                xp: lesson.xp,
                created_by: lesson.createdBy,
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            type: data.type,
            order: data.order,
            subModuleId: data.sub_module_id,
            xp: data.xp,
            language: data.language,
            initialCode: data.initial_code,
            createdBy: data.created_by,
        } as Lesson;
    }

    async updateLesson(id: string, lesson: Partial<Lesson>): Promise<Lesson> {
        const payload: any = {};
        if (lesson.title !== undefined) payload.title = lesson.title;
        if (lesson.description !== undefined) payload.description = lesson.description;
        if (lesson.type !== undefined) payload.type = lesson.type;
        if (lesson.order !== undefined) payload.order = lesson.order;
        if (lesson.subModuleId !== undefined) payload.sub_module_id = lesson.subModuleId;
        if (lesson.xp !== undefined) payload.xp = lesson.xp;
        if (lesson.language !== undefined) payload.language = lesson.language;
        if (lesson.initialCode !== undefined) payload.initial_code = lesson.initialCode;

        const { data, error } = await this.supabase
            .from('lessons')
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            type: data.type,
            order: data.order,
            subModuleId: data.sub_module_id,
            xp: data.xp,
            language: data.language,
            initialCode: data.initial_code,
            createdBy: data.created_by,
        } as Lesson;
    }

    async getLessonCountBySubModuleId(subModuleId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('sub_module_id', subModuleId);

        if (error) {
            throw new Error(error.message);
        }

        return count ?? 0;
    }

    async invalidateLesson(lessonId: string): Promise<void> {
        const { error } = await this.supabase
            .from('lessons')
            .update({ is_validated: null })
            .eq('id', lessonId);

        if (error) {
            throw new Error(error.message);
        }
    }

    async validateLesson(lessonId: string, lessonType: LessonType): Promise<boolean> {
        let passed = false;

        if (lessonType === LessonType.LESSON) {
            passed = await this._validateLessonType(lessonId);
        } else if (lessonType === LessonType.CHALLENGE) {
            passed = await this._validateChallengeType(lessonId);
        } else if (lessonType === LessonType.REVISION) {
            passed = await this._validateRevisionType(lessonId);
        }

        const { error } = await this.supabase
            .from('lessons')
            .update({ is_validated: passed })
            .eq('id', lessonId);

        if (error) {
            throw new Error(error.message);
        }

        return passed;
    }

    private async _validateLessonType(lessonId: string): Promise<boolean> {
        const { count: scCount, error: scError } = await this.supabase
            .from('section_content')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lessonId);
        if (scError || (scCount ?? 0) < 1) return false;

        const { count: emCount, error: emError } = await this.supabase
            .from('extra_material')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lessonId);
        if (emError || (emCount ?? 0) < 1) return false;

        const { data: quizData, error: quizError } = await this.supabase
            .from('quizzes')
            .select('id')
            .eq('lesson_id', lessonId);
        if (quizError || !quizData || quizData.length !== 1) return false;

        const quizId = quizData[0].id;

        const { data: questions, error: questionsError } = await this.supabase
            .from('questions')
            .select('id')
            .eq('quiz_id', quizId);
        if (questionsError || !questions || questions.length !== 10) return false;

        for (const question of questions) {
            const { data: answers, error: answersError } = await this.supabase
                .from('answers')
                .select('id, is_correct')
                .eq('question_id', question.id);

            if (answersError || !answers || answers.length !== 4) return false;

            const correctCount = answers.filter((a: any) => a.is_correct === true).length;
            if (correctCount !== 1) return false;
        }

        return true;
    }

    private async _validateChallengeType(lessonId: string): Promise<boolean> {
        const { count: scCount, error: scError } = await this.supabase
            .from('section_content')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lessonId);
        if (scError || (scCount ?? 0) < 1) return false;

        const { data: lesson, error: lessonError } = await this.supabase
            .from('lessons')
            .select('language, initial_code')
            .eq('id', lessonId)
            .single();

        if (lessonError || !lesson) return false;

        const hasLanguage = typeof lesson.language === 'string' && lesson.language.trim().length > 0;
        const hasInitialCode = typeof lesson.initial_code === 'string' && lesson.initial_code.trim().length > 0;

        return hasLanguage && hasInitialCode;
    }

    private async _validateRevisionType(lessonId: string): Promise<boolean> {
        const { data: quizData, error: quizError } = await this.supabase
            .from('quizzes')
            .select('id')
            .eq('lesson_id', lessonId);
        
        if (quizError || !quizData || quizData.length !== 1) return false;

        return true;
    }
}
