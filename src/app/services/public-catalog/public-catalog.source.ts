import { InjectionToken, inject } from '@angular/core';
import { SupabaseService } from '../supabase';

export interface ShowcaseRow {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    icon: string | null;
    avatar: string | null;
    in_revision: boolean;
}

export interface CurriculumRow {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    icon: string | null;
    avatar: string | null;
    submodules: {
        id: string;
        slug: string;
        title: string;
        description: string | null;
        icon: string | null;
        order: number;
        lessons: { id: string; title: string; description: string | null; type: string; order: number }[];
    }[];
}

export interface LessonPreviewRow {
    lesson_id: string;
    preview: string;
}

/**
 * De onde vêm os dados públicos: Supabase no navegador, snapshot gerado antes do build na pré-renderização.
 * Expõe o catálogo e só a prévia de cada aula (função get_lesson_previews); o conteúdo completo exige login.
 */
export interface PublicCatalogSource {
    showcase(): Promise<ShowcaseRow[]>;
    curriculum(): Promise<CurriculumRow[]>;
    preview(lessonId: string): Promise<string | null>;
}

// Mantenha em sincronia com scripts/fetch-public-catalog.mjs, que gera o snapshot usado na pré-renderização
export const SHOWCASE_SELECT = 'id, slug, title, description, icon, avatar, in_revision';
export const CURRICULUM_SELECT = `
    id, slug, title, description, icon, avatar,
    submodules ( id, slug, title, description, icon, order,
        lessons ( id, title, description, type, order )
    )`;

export const PUBLIC_CATALOG_SOURCE = new InjectionToken<PublicCatalogSource>('PUBLIC_CATALOG_SOURCE', {
    providedIn: 'root',
    factory: () => {
        const supabase = inject(SupabaseService).client;
        const unwrap = <T>({ data, error }: { data: T | null; error: { message: string } | null }): T => {
            if (error) {
                throw new Error(error.message);
            }
            return data as T;
        };

        return {
            showcase: async () => unwrap(await supabase
                .from('modules')
                .select(SHOWCASE_SELECT)
                .returns<ShowcaseRow[]>()) ?? [],
            curriculum: async () => unwrap(await supabase
                .from('modules')
                .select(CURRICULUM_SELECT)
                .eq('in_revision', false)
                .order('order', { foreignTable: 'submodules', ascending: true })
                .order('order', { foreignTable: 'submodules.lessons', ascending: true })
                .returns<CurriculumRow[]>()) ?? [],
            preview: async lessonId => {
                const { data, error } = await supabase.rpc('get_lesson_previews', { p_lesson_id: lessonId });
                const rows = unwrap({ data: data as LessonPreviewRow[] | null, error }) ?? [];
                return rows[0]?.preview ?? null;
            },
        };
    },
});
