import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserSubModule } from '../../models/user-sub-module/user-sub-module';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class UserSubModuleService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getUserSubModules(): Promise<UserSubModule[]> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await this.supabase
            .from('user_submodules')
            .select('*, subModule:submodules(*)').eq('user_id', user.id);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as UserSubModule[];
    }

    async getUserSubModulesForUser(userId: string): Promise<UserSubModule[]> {
        const { data, error } = await this.supabase
            .from('user_submodules')
            .select('*, subModule:submodules(*)')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []) as unknown as UserSubModule[];
    }

    async startSubModule(subModuleId: string): Promise<void> {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { error } = await this.supabase
            .from('user_submodules')
            .insert({
                user_id: user.id,
                sub_module_id: subModuleId,
                completed: false,
                completed_at: null
            });

        if (error) {
            throw new Error(error.message);
        }
    }
}
