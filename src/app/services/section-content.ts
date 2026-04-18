import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { SectionContent } from '../../models/section-content/section-content';

@Injectable({
    providedIn: 'root',
})
export class SectionContentService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getSectionContentsByLessonId(lessonId: string): Promise<SectionContent[]> {
        const { data, error } = await this.supabase
            .from('section_content')
            .select('id, type, content, file, fileDescription:file_description, order')
            .eq('lesson_id', lessonId)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as SectionContent[];
    }
}
