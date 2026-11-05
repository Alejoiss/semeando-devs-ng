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
    /** Primeira aula do submódulo: aberta por completo, sem login. */
    isFree: boolean;
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
    avatar: string | null;
    submodules: PublicSubmodule[];
}

export interface ShowcaseModule {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    avatar: string | null;
    inRevision: boolean;
}

export interface PublicLessonLink {
    title: string;
    path: string[];
}

export type PublicLessonContent =
    | { kind: 'full'; sections: PublicSection[] }
    /** Trecho inicial da aula em markdown; o restante exige login. */
    | { kind: 'preview'; markdown: string };

export interface PublicLessonPage {
    module: Pick<PublicModule, 'slug' | 'title'>;
    submodule: Pick<PublicSubmodule, 'slug' | 'title'>;
    lesson: PublicLessonSummary;
    content: PublicLessonContent;
    previous: PublicLessonLink | null;
    next: PublicLessonLink | null;
}

export function publicLessonPath(moduleSlug: string, submoduleSlug: string, lessonSlug: string): string[] {
    return ['/cursos', moduleSlug, submoduleSlug, lessonSlug];
}

// O desempate por id segue a mesma regra da função get_lesson_previews/get_free_lesson_sections no banco
const byOrder = (a: { order: number; id: string }, b: { order: number; id: string }) =>
    a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'pt-BR');

/** Gera slugs estáveis e únicos por submódulo, já que as aulas não possuem slug próprio no banco. */
function withLessonSlugs(lessons: CurriculumRow['submodules'][number]['lessons']): PublicLessonSummary[] {
    const used = new Set<string>();
    return lessons.map((lesson, index) => {
        const base = slugify(lesson.title) || lesson.id;
        let slug = base;
        for (let i = 2; used.has(slug); i++) {
            slug = `${base}-${i}`;
        }
        used.add(slug);
        return { id: lesson.id, slug, title: lesson.title, description: lesson.description ?? '', isFree: index === 0 };
    });
}

function toPublicModules(rows: CurriculumRow[]): PublicModule[] {
    return [...rows].sort(byTitle).map(module => ({
        id: module.id,
        slug: module.slug,
        title: module.title,
        description: module.description ?? '',
        icon: module.icon,
        avatar: module.avatar,
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
 * Catálogo público (sem login) das páginas pré-renderizadas: módulos, submódulos e títulos das aulas. O que é carregado no servidor vai no
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
    // A página da aula é resolvida duas vezes por navegação (conteúdo e anúncios); a mesma promessa atende as duas
    private readonly lessonPageRequests = new Map<string, Promise<PublicLessonPage | null>>();

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
                    avatar: module.avatar,
                    inRevision: module.in_revision,
                }))
                .sort((a, b) => Number(a.inRevision) - Number(b.inRevision) || byTitle(a, b));
        });
    }

    getModule(moduleSlug: string): Promise<PublicModule | null> {
        return this.transfer(`public-module:${moduleSlug}`, () => this.findModule(moduleSlug));
    }

    getLessonPage(moduleSlug: string, submoduleSlug: string, lessonSlug: string): Promise<PublicLessonPage | null> {
        const key = `public-lesson:${moduleSlug}/${submoduleSlug}/${lessonSlug}`;
        let request = this.lessonPageRequests.get(key);
        if (!request) {
            request = this.loadLessonPage(key, moduleSlug, submoduleSlug, lessonSlug);
            request.catch(() => this.lessonPageRequests.delete(key));
            this.lessonPageRequests.set(key, request);
        }
        return request;
    }

    private loadLessonPage(key: string, moduleSlug: string, submoduleSlug: string, lessonSlug: string): Promise<PublicLessonPage | null> {
        return this.transfer(key, async () => {
            const module = await this.findModule(moduleSlug);
            const submodule = module?.submodules.find(sub => sub.slug === submoduleSlug);
            const index = submodule?.lessons.findIndex(lesson => lesson.slug === lessonSlug) ?? -1;
            if (!module || !submodule || index < 0) {
                return null;
            }

            const lesson = submodule.lessons[index];
            const content = await this.loadLessonContent(lesson);
            if (!content) {
                return null;
            }

            const toLink = (target: PublicLessonSummary | undefined): PublicLessonLink | null =>
                target ? { title: target.title, path: publicLessonPath(module.slug, submodule.slug, target.slug) } : null;

            return {
                module: { slug: module.slug, title: module.title },
                submodule: { slug: submodule.slug, title: submodule.title },
                lesson,
                content,
                previous: toLink(submodule.lessons[index - 1]),
                next: toLink(submodule.lessons[index + 1]),
            };
        });
    }

    private async loadLessonContent(lesson: PublicLessonSummary): Promise<PublicLessonContent | null> {
        if (lesson.isFree) {
            const sections = await this.source.freeSections(lesson.id);
            if (sections.length > 0) {
                return { kind: 'full', sections };
            }
        }
        const markdown = await this.source.preview(lesson.id);
        return markdown ? { kind: 'preview', markdown } : null;
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
