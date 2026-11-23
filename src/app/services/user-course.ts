import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserCourse } from '../../models/user-course/user-course';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class UserCourseService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getUserCourses(): Promise<UserCourse[]> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await this.supabase
            .from('user_modules')
            .select('*, course:modules(*)')
            .eq('user_id', user.id);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as UserCourse[];
    }

    async getUserCoursesForUser(userId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('user_modules')
            .select('module_id, completed')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return data ?? [];
    }

    async startCourse(courseId: string): Promise<void> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { error } = await this.supabase
            .from('user_modules')
            .insert({
                user_id: user.id,
                module_id: courseId,
                completed: false,
                completed_at: null
            });

        if (error) {
            throw new Error(error.message);
        }
    }

    async isCourseCompleted(courseId: string): Promise<boolean> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            return false;
        }

        const { data, error } = await this.supabase
            .from('user_modules')
            .select('completed')
            .eq('user_id', user.id)
            .eq('module_id', courseId)
            .single();

        if (error || !data) {
            return false;
        }

        return (data as { completed: boolean }).completed === true;
    }
}
