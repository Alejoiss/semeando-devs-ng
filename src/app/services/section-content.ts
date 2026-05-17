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

    async upsertSectionContents(lessonId: string, contents: Partial<SectionContent>[]): Promise<void> {
        if (!contents.length) return;
        const payload = contents.map(c => ({
            id: c.id,
            lesson_id: lessonId,
            type: c.type,
            content: c.content,
            file: c.file,
            file_description: c.fileDescription,
            order: c.order
        }));

        const { error } = await this.supabase
            .from('section_content')
            .upsert(payload);

        if (error) {
            throw new Error(error.message);
        }
    }

    async deleteSectionContents(ids: string[]): Promise<void> {
        if (!ids.length) return;
        const { error } = await this.supabase
            .from('section_content')
            .delete()
            .in('id', ids);

        if (error) {
            throw new Error(error.message);
        }
    }

    async uploadLessonImage(file: File): Promise<string> {
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('A imagem não pode ter mais de 5MB.');
        }

        const uuid = crypto.randomUUID();
        const fileName = `${uuid}/${file.name}`;

        const { error } = await this.supabase.storage
            .from('image-lessons')
            .upload(fileName, file);

        if (error) {
            throw new Error(error.message);
        }

        const { data } = this.supabase.storage
            .from('image-lessons')
            .getPublicUrl(fileName);

        return data.publicUrl;
    }
}
