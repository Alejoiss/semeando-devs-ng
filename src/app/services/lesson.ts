import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Lesson } from '../../models/lesson/lesson';

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

    async getLessonsBySubModuleId(subModuleId: string): Promise<Lesson[]> {
        const { data, error } = await this.supabase
            .from('lessons')
            .select('*')
            .eq('sub_module_id', subModuleId)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as Lesson[];
    }

    async updateLessonOrder(updates: { id: string; order: number }[]): Promise<void> {
        const { error } = await this.supabase
            .from('lessons')
            .upsert(updates);

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
}
