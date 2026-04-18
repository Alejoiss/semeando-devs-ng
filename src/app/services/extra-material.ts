import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { ExtraMaterial } from '../../models/extra-material/extra-material';

@Injectable({
    providedIn: 'root',
})
export class ExtraMaterialService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

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
}
