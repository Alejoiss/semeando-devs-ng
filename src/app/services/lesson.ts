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
        } as Lesson;
    }
}
