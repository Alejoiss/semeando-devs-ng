import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { SubModule } from '../../models/sub-module/sub-module';

@Injectable({
    providedIn: 'root',
})
export class SubModuleService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getSubModulesByModuleSlug(slug: string): Promise<SubModule[]> {
        const { data, error } = await this.supabase
            .from('submodules')
            .select('*, module:modules!inner(*)')
            .eq('modules.slug', slug)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data as unknown as SubModule[];
    }

    async getSubModulesByModuleId(moduleId: string): Promise<SubModule[]> {
        const { data, error } = await this.supabase
            .from('submodules')
            .select('*')
            .eq('module_id', moduleId)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data as unknown as SubModule[];
    }

    async updateSubModuleOrder(updates: { id: string; order: number }[]): Promise<void> {
        const { error } = await this.supabase
            .from('submodules')
            .upsert(updates);

        if (error) {
            throw new Error(error.message);
        }
    }

    async deleteSubModule(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('submodules')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    }
}
