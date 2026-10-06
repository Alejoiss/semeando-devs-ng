import { InjectionToken, inject } from '@angular/core';
import { SupabaseService } from '../supabase';
import { SectionContentType } from '../../../models/section-content/section-content';

export interface ShowcaseRow {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    icon: string | null;
    in_revision: boolean;
}

export interface CurriculumRow {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    icon: string | null;
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

export interface PublicSection {
    id: string;
    type: SectionContentType;
    content: string | null;
    file: string | null;
    fileDescription: string | null;
}

/** De onde vêm os dados públicos: Supabase no navegador, snapshot gerado antes do build na pré-renderização. */
export interface PublicCatalogSource {
    showcase(): Promise<ShowcaseRow[]>;
    curriculum(): Promise<CurriculumRow[]>;
    sections(lessonId: string): Promise<PublicSection[]>;
}

// Mantenha em sincronia com scripts/fetch-public-catalog.mjs, que gera o snapshot usado na pré-renderização
export const SHOWCASE_SELECT = 'id, slug, title, description, icon, in_revision';
export const CURRICULUM_SELECT = `
    id, slug, title, description, icon,
    submodules ( id, slug, title, description, icon, order,
        lessons ( id, title, description, type, order )
    )`;
export const SECTION_SELECT = 'id, type, content, file, fileDescription:file_description';

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
            sections: async lessonId => unwrap(await supabase
                .from('section_content')
                .select(SECTION_SELECT)
                .eq('lesson_id', lessonId)
                .order('order', { ascending: true })
                .returns<PublicSection[]>()) ?? [],
        };
    },
});
