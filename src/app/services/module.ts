import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Module } from '../../models/module/module';

@Injectable({
    providedIn: 'root',
})
export class ModuleService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    async getModules(): Promise<Module[]> {
        const { data, error } = await this.supabase
            .from('modules')
            .select('*');

        if (error) {
            throw new Error(error.message);
        }

        return data as Module[];
    }

    async getModuleBySlug(slug: string): Promise<Module | null> {
        try {
            const { data, error } = await this.supabase
                .from('modules')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                return null;
            }

            return data as Module;
        } catch {
            return null;
        }
    }
}
