import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Module } from '../../models/module/module';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class ModuleService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getModulesByCourseSlug(slug: string): Promise<Module[]> {
        const { data, error } = await this.supabase
            .from('submodules')
            .select('*, course:modules!inner(*)')
            .eq('modules.slug', slug)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data as unknown as Module[];
    }

    async getModulesByCourseId(courseId: string): Promise<Module[]> {
        const { data, error } = await this.supabase
            .from('submodules')
            .select('*')
            .eq('module_id', courseId)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data as unknown as Module[];
    }

    async getModuleCountByCourseId(courseId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('submodules')
            .select('*', { count: 'exact', head: true })
            .eq('module_id', courseId);

        if (error) {
            throw new Error(error.message);
        }

        return count ?? 0;
    }

    async updateModuleOrder(updates: { id: string; order: number }[]): Promise<void> {
        const promises = updates.map(u =>
            this.supabase
                .from('submodules')
                .update({ order: u.order })
                .eq('id', u.id)
        );

        const results = await Promise.all(promises);
        const error = results.find(r => r.error)?.error;

        if (error) {
            throw new Error(error.message);
        }
    }

    async createModule(payload: { title: string; description: string; slug: string; module_id: string; avatar?: string | null; icon?: string | null; order?: number }): Promise<Module> {
        const { data, error } = await this.supabase
            .from('submodules')
            .insert({
                title: payload.title,
                description: payload.description,
                slug: payload.slug,
                module_id: payload.module_id,
                avatar: payload.avatar,
                icon: payload.icon,
                order: payload.order ?? 0
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as unknown as Module;
    }

    async updateModule(id: string, payload: { title?: string; description?: string; slug?: string; avatar?: string | null; icon?: string | null }): Promise<Module> {
        const { data, error } = await this.supabase
            .from('submodules')
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as unknown as Module;
    }

    async getModuleById(id: string): Promise<Module | null> {
        try {
            const { data, error } = await this.supabase
                .from('submodules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return null;
            }

            return data as unknown as Module;
        } catch {
            return null;
        }
    }

    async uploadModuleAvatar(file: File): Promise<string> {
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('A imagem não pode ter mais de 2MB.');
        }

        const uuid = crypto.randomUUID();
        const fileName = `${uuid}/${file.name}`;

        const { error } = await this.supabase.storage
            .from('submodule-avatars')
            .upload(fileName, file);

        if (error) {
            throw new Error(error.message);
        }

        const { data } = this.supabase.storage
            .from('submodule-avatars')
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async deleteModule(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('submodules')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    }
}
