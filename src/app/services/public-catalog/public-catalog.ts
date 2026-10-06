import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { slugify } from '../../utils/slug';
import { CurriculumRow, PUBLIC_CATALOG_SOURCE, PublicSection } from './public-catalog.source';

export type { PublicSection } from './public-catalog.source';

export interface PublicLessonSummary {
    id: string;
    slug: string;
    title: string;
    description: string;
}

export interface PublicSubmodule {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    lessons: PublicLessonSummary[];
}

export interface PublicModule {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    submodules: PublicSubmodule[];
}

export interface ShowcaseModule {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    inRevision: boolean;
}

export interface PublicLessonLink {
    title: string;
    path: string[];
}

export interface PublicLessonPage {
    module: Pick<PublicModule, 'slug' | 'title'>;
    submodule: Pick<PublicSubmodule, 'slug' | 'title'>;
    lesson: PublicLessonSummary;
    sections: PublicSection[];
    previous: PublicLessonLink | null;
    next: PublicLessonLink | null;
}

export function publicLessonPath(moduleSlug: string, submoduleSlug: string, lessonSlug: string): string[] {
    return ['/cursos', moduleSlug, submoduleSlug, lessonSlug];
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;
const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'pt-BR');

/** Gera slugs estáveis e únicos por submódulo, já que as aulas não possuem slug próprio no banco. */
function withLessonSlugs(lessons: CurriculumRow['submodules'][number]['lessons']): PublicLessonSummary[] {
    const used = new Set<string>();
    return lessons.map(lesson => {
        const base = slugify(lesson.title) || lesson.id;
        let slug = base;
        for (let i = 2; used.has(slug); i++) {
            slug = `${base}-${i}`;
        }
        used.add(slug);
        return { id: lesson.id, slug, title: lesson.title, description: lesson.description ?? '' };
    });
}

function toPublicModules(rows: CurriculumRow[]): PublicModule[] {
    return [...rows].sort(byTitle).map(module => ({
        id: module.id,
        slug: module.slug,
        title: module.title,
        description: module.description ?? '',
        icon: module.icon,
        submodules: [...module.submodules]
            .sort(byOrder)
            .map(sub => ({
                id: sub.id,
                slug: sub.slug,
                title: sub.title,
                description: sub.description ?? '',
                icon: sub.icon,
                lessons: withLessonSlugs([...sub.lessons].sort(byOrder).filter(lesson => lesson.type === 'LESSON')),
            }))
            .filter(sub => sub.lessons.length > 0),
    }));
}

/**
 * Conteúdo público (sem login) das páginas pré-renderizadas. O que é carregado no servidor vai no
 * TransferState para que a hidratação no navegador reutilize exatamente o mesmo conteúdo.
 */
@Injectable({
    providedIn: 'root',
})
export class PublicCatalogService {
    private readonly source = inject(PUBLIC_CATALOG_SOURCE);
    private readonly transferState = inject(TransferState);
    private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
    private curriculumRequest: Promise<PublicModule[]> | null = null;

    getCurriculum(): Promise<PublicModule[]> {
        return this.transfer('public-curriculum', () => this.loadCurriculum());
    }

    /** Módulos da vitrine da home, incluindo os ainda em revisão (exibidos como "Em breve"). */
    getShowcaseModules(): Promise<ShowcaseModule[]> {
        return this.transfer('public-showcase', async () => {
            const rows = await this.source.showcase();
            return rows
                .map(module => ({
                    id: module.id,
                    slug: module.slug,
                    title: module.title,
                    description: module.description ?? '',
                    icon: module.icon,
                    inRevision: module.in_revision,
                }))
                .sort((a, b) => Number(a.inRevision) - Number(b.inRevision) || byTitle(a, b));
        });
    }

    getModule(moduleSlug: string): Promise<PublicModule | null> {
        return this.transfer(`public-module:${moduleSlug}`, () => this.findModule(moduleSlug));
    }

    getLessonPage(moduleSlug: string, submoduleSlug: string, lessonSlug: string): Promise<PublicLessonPage | null> {
        return this.transfer(`public-lesson:${moduleSlug}/${submoduleSlug}/${lessonSlug}`, async () => {
            const module = await this.findModule(moduleSlug);
            const submodule = module?.submodules.find(sub => sub.slug === submoduleSlug);
            const index = submodule?.lessons.findIndex(lesson => lesson.slug === lessonSlug) ?? -1;
            if (!module || !submodule || index < 0) {
                return null;
            }

            const lesson = submodule.lessons[index];
            const sections = await this.source.sections(lesson.id);
            const toLink = (target: PublicLessonSummary | undefined): PublicLessonLink | null =>
                target ? { title: target.title, path: publicLessonPath(module.slug, submodule.slug, target.slug) } : null;

            return {
                module: { slug: module.slug, title: module.title },
                submodule: { slug: submodule.slug, title: submodule.title },
                lesson,
                sections,
                previous: toLink(submodule.lessons[index - 1]),
                next: toLink(submodule.lessons[index + 1]),
            };
        });
    }

    private async transfer<T>(key: string, loader: () => Promise<T>): Promise<T> {
        const stateKey = makeStateKey<T>(key);
        if (!this.isServer && this.transferState.hasKey(stateKey)) {
            const cached = this.transferState.get(stateKey, null as T);
            this.transferState.remove(stateKey);
            return cached;
        }

        const value = await loader();
        if (this.isServer) {
            this.transferState.set(stateKey, value);
        }
        return value;
    }

    private loadCurriculum(): Promise<PublicModule[]> {
        this.curriculumRequest ??= this.source.curriculum().then(toPublicModules).catch(error => {
            this.curriculumRequest = null;
            throw error;
        });
        return this.curriculumRequest;
    }

    private async findModule(moduleSlug: string): Promise<PublicModule | null> {
        const curriculum = await this.loadCurriculum();
        return curriculum.find(module => module.slug === moduleSlug) ?? null;
    }
}
