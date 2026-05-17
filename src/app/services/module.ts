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

    async getTeacherModules(teacherId: string): Promise<Module[]> {
        const { data, error } = await this.supabase
            .from('teacher_modules')
            .select('*, module:modules(*)')
            .eq('teacher_id', teacherId);

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map((tm: any) => ({
            ...tm.module,
            inRevision: tm.module.in_revision
        })) as Module[];
    }

    async createModule(payload: CreateModulePayload): Promise<Module> {
        const { data, error } = await this.supabase
            .from('modules')
            .insert({
                title: payload.title,
                description: payload.description,
                slug: payload.slug,
                avatar: payload.avatar,
                icon: payload.icon,
                in_revision: payload.inRevision ?? true,
                created_by: payload.createdBy
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            ...data,
            inRevision: data.in_revision
        } as Module;
    }

    async uploadModuleAvatar(file: File): Promise<string> {
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('A imagem não pode ter mais de 2MB.');
        }

        const uuid = crypto.randomUUID();
        const fileName = `${uuid}/${file.name}`;

        const { error } = await this.supabase.storage
            .from('module-avatars')
            .upload(fileName, file);

        if (error) {
            throw new Error(error.message);
        }

        const { data } = this.supabase.storage
            .from('module-avatars')
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async assignTeacherToModule(teacherId: string, moduleId: string): Promise<void> {
        const { error } = await this.supabase
            .from('teacher_modules')
            .insert({
                teacher_id: teacherId,
                module_id: moduleId
            });

        if (error) {
            throw new Error(error.message);
        }
    }

    async getModuleById(id: string): Promise<Module | null> {
        try {
            const { data, error } = await this.supabase
                .from('modules')
                .select('*')
                .eq('id', id)
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

    async updateModule(id: string, payload: Partial<CreateModulePayload>): Promise<Module> {
        const updateData: any = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.slug !== undefined) updateData.slug = payload.slug;
        if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
        if (payload.icon !== undefined) updateData.icon = payload.icon;
        if (payload.inRevision !== undefined) updateData.in_revision = payload.inRevision;

        const { data, error } = await this.supabase
            .from('modules')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            ...data,
            inRevision: data.in_revision
        } as Module;
    }
}

export interface CreateModulePayload {
    title: string;
    description: string;
    slug: string;
    avatar?: string | null;
    icon?: string | null;
    inRevision?: boolean;
    createdBy: string;
}
