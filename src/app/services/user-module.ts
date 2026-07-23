import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserModule } from '../../models/user-module/user-module';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class UserModuleService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getUserModules(): Promise<UserModule[]> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await this.supabase
            .from('user_modules')
            .select('*, module:modules(*)')
            .eq('user_id', user.id);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as UserModule[];
    }

    async getUserModulesForUser(userId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('user_modules')
            .select('module_id, completed')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return data ?? [];
    }

    async startModule(moduleId: string): Promise<void> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { error } = await this.supabase
            .from('user_modules')
            .insert({
                user_id: user.id,
                module_id: moduleId,
                completed: false,
                completed_at: null
            });

        if (error) {
            throw new Error(error.message);
        }
    }

    async isModuleCompleted(moduleId: string): Promise<boolean> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            return false;
        }

        const { data, error } = await this.supabase
            .from('user_modules')
            .select('completed')
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .single();

        if (error || !data) {
            return false;
        }

        return (data as { completed: boolean }).completed === true;
    }
}
