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
}
