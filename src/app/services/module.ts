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

        return (data || []).map(m => ({
            ...m,
            inRevision: m.in_revision
        })) as Module[];
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

            return {
                ...data,
                inRevision: data.in_revision
            } as Module;
        } catch {
            return null;
        }
    }

    async getCurriculum(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('modules')
            .select(`
                *,
                submodules (
                    *,
                    lessons (
                        *
                    )
                )
            `)
            .order('order', { foreignTable: 'submodules', ascending: true })
            .order('order', { foreignTable: 'submodules.lessons', ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}
