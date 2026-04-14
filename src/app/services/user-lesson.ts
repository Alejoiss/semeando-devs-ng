import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UserLesson } from '../../models/user-lesson/user-lesson';

@Injectable({
    providedIn: 'root',
})
export class UserLessonService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getUserLessons(): Promise<UserLesson[]> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await this.supabase
            .from('user_lessons')
            .select('*, lesson:lessons(*)')
            .eq('user_id', user.id);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as UserLesson[];
    }
}
