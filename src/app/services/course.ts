import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Course } from '../../models/course/course';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class CourseService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getCourses(): Promise<Course[]> {
        const { data, error } = await this.supabase
            .from('modules')
            .select('*');

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map(m => ({
            ...m,
            inRevision: m.in_revision
        })) as Course[];
    }

    async getCoursesForDisplay(): Promise<Course[]> {
        const { data, error } = await this.supabase
            .from('modules')
            .select('id, title, description, slug, avatar, icon, in_revision');

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map(m => ({
            ...m,
            inRevision: m.in_revision
        })) as Course[];
    }

    async getCourseBySlug(slug: string): Promise<Course | null> {
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
            } as Course;
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
            .eq('in_revision', false)
            .order('order', { foreignTable: 'submodules', ascending: true })
            .order('order', { foreignTable: 'submodules.lessons', ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map(({ submodules, ...course }: any) => ({ ...course, modules: submodules ?? [] }));
    }

    async getTeacherCourses(teacherId: string): Promise<Course[]> {
        const { data, error } = await this.supabase
            .from('teacher_modules')
            .select('*, course:modules(*)')
            .eq('teacher_id', teacherId);

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map((tm: any) => ({
            ...tm.course,
            inRevision: tm.course.in_revision
        })) as Course[];
    }

    async createCourse(payload: CreateCoursePayload): Promise<Course> {
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
        } as Course;
    }

    async uploadCourseAvatar(file: File): Promise<string> {
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

    async assignTeacherToCourse(teacherId: string, courseId: string): Promise<void> {
        const { error } = await this.supabase
            .from('teacher_modules')
            .insert({
                teacher_id: teacherId,
                module_id: courseId
            });

        if (error) {
            throw new Error(error.message);
        }
    }

    async getCourseById(id: string): Promise<Course | null> {
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
            } as Course;
        } catch {
            return null;
        }
    }

    async updateCourse(id: string, payload: Partial<CreateCoursePayload>): Promise<Course> {
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
        } as Course;
    }

    async checkAllLessonsValidated(courseId: string): Promise<boolean> {
        const { data: modules, error: subError } = await this.supabase
            .from('submodules')
            .select('id')
            .eq('module_id', courseId);

        if (subError || !modules) return false;

        if (modules.length === 0) return true;

        const moduleIds = modules.map((s: any) => s.id);

        const { data: lessons, error: lessonError } = await this.supabase
            .from('lessons')
            .select('id, is_validated')
            .in('sub_module_id', moduleIds)
            .neq('type', 'REVISION');

        if (lessonError) return false;

        if (!lessons || lessons.length === 0) return true;

        return lessons.every((l: any) => l.is_validated === true);
    }

    async updateCourseAvailability(courseId: string, available: boolean): Promise<void> {
        const { error } = await this.supabase
            .from('modules')
            .update({ in_revision: !available })
            .eq('id', courseId);

        if (error) {
            throw new Error(error.message);
        }
    }
}

export interface CreateCoursePayload {
    title: string;
    description: string;
    slug: string;
    avatar?: string | null;
    icon?: string | null;
    inRevision?: boolean;
    createdBy: string;
}
