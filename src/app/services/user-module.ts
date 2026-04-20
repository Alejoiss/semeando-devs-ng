import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { UserModule } from '../../models/user-module/user-module';

@Injectable({
    providedIn: 'root',
})
export class UserModuleService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

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
}
