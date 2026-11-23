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
            .from('user_submodules')
            .select('*, module:submodules(*)').eq('user_id', user.id);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as UserModule[];
    }

    async getUserModulesForUser(userId: string): Promise<UserModule[]> {
        const { data, error } = await this.supabase
            .from('user_submodules')
            .select('*, module:submodules(*)')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as UserModule[];
    }

    async startModule(moduleId: string): Promise<void> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { error } = await this.supabase
            .from('user_submodules')
            .insert({
                user_id: user.id,
                sub_module_id: moduleId,
                completed: false,
                completed_at: null
            });

        if (error) {
            throw new Error(error.message);
        }
    }
}
