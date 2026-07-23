import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { ExtraMaterial } from '../../models/extra-material/extra-material';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class ExtraMaterialService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getExtraMaterialsByLessonId(lessonId: string): Promise<ExtraMaterial[]> {
        const { data, error } = await this.supabase
            .from('extra_material')
            .select('id, title, type, url, file')
            .eq('lesson_id', lessonId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as ExtraMaterial[];
    }

    async upsertExtraMaterials(lessonId: string, materials: Partial<ExtraMaterial>[]): Promise<void> {
        if (!materials.length) return;
        const payload = materials.map(m => ({
            id: m.id || crypto.randomUUID(),
            lesson_id: lessonId,
            title: m.title,
            type: m.type || 'URL',
            url: m.url,
            file: m.file || null
        }));

        const { error } = await this.supabase
            .from('extra_material')
            .upsert(payload);

        if (error) {
            throw new Error(error.message);
        }
    }

    async deleteExtraMaterials(ids: string[]): Promise<void> {
        if (!ids.length) return;
        const { error } = await this.supabase
            .from('extra_material')
            .delete()
            .in('id', ids);

        if (error) {
            throw new Error(error.message);
        }
    }
}
