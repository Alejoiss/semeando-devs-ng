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
    /** Primeira aula do módulo: aberta por completo, sem login. */
    isFree: boolean;
}

export interface PublicModule {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    lessons: PublicLessonSummary[];
}

export interface PublicCourse {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    avatar: string | null;
    modules: PublicModule[];
}

export interface ShowcaseCourse {
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
    course: Pick<PublicCourse, 'slug' | 'title'>;
    module: Pick<PublicModule, 'slug' | 'title'>;
    lesson: PublicLessonSummary;
    content: PublicLessonContent;
    previous: PublicLessonLink | null;
    next: PublicLessonLink | null;
}

export function publicLessonPath(courseSlug: string, moduleSlug: string, lessonSlug: string): string[] {
    return ['/cursos', courseSlug, moduleSlug, lessonSlug];
}

// O desempate por id segue a mesma regra da função get_lesson_previews/get_free_lesson_sections no banco
const byOrder = (a: { order: number; id: string }, b: { order: number; id: string }) =>
    a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'pt-BR');

/** Gera slugs estáveis e únicos por módulo, já que as aulas não possuem slug próprio no banco. */
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

function toPublicCourses(rows: CurriculumRow[]): PublicCourse[] {
    return [...rows].sort(byTitle).map(course => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description ?? '',
        icon: course.icon,
        avatar: course.avatar,
        modules: [...course.submodules]
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
    })).filter(course => course.modules.length > 0);
}

/**
 * Catálogo público (sem login) das páginas pré-renderizadas: cursos, módulos e títulos das aulas. O que é carregado no servidor vai no
 * TransferState para que a hidratação no navegador reutilize exatamente o mesmo conteúdo.
 */
@Injectable({
    providedIn: 'root',
})
export class PublicCatalogService {
    private readonly source = inject(PUBLIC_CATALOG_SOURCE);
    private readonly transferState = inject(TransferState);
    private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
    private curriculumRequest: Promise<PublicCourse[]> | null = null;
    // A página da aula é resolvida duas vezes por navegação (conteúdo e anúncios); a mesma promessa atende as duas
    private readonly lessonPageRequests = new Map<string, Promise<PublicLessonPage | null>>();

    getCurriculum(): Promise<PublicCourse[]> {
        return this.transfer('public-curriculum', () => this.loadCurriculum());
    }

    /** Cursos da vitrine da home, incluindo os ainda em revisão (exibidos como "Em breve"). */
    getShowcaseCourses(): Promise<ShowcaseCourse[]> {
        return this.transfer('public-showcase', async () => {
            const rows = await this.source.showcase();
            return rows
                .map(course => ({
                    id: course.id,
                    slug: course.slug,
                    title: course.title,
                    description: course.description ?? '',
                    icon: course.icon,
                    avatar: course.avatar,
                    inRevision: course.in_revision,
                }))
                .sort((a, b) => Number(a.inRevision) - Number(b.inRevision) || byTitle(a, b));
        });
    }

    getCourse(courseSlug: string): Promise<PublicCourse | null> {
        return this.transfer(`public-course:${courseSlug}`, () => this.findCourse(courseSlug));
    }

    getLessonPage(courseSlug: string, moduleSlug: string, lessonSlug: string): Promise<PublicLessonPage | null> {
        const key = `public-lesson:${courseSlug}/${moduleSlug}/${lessonSlug}`;
        let request = this.lessonPageRequests.get(key);
        if (!request) {
            request = this.loadLessonPage(key, courseSlug, moduleSlug, lessonSlug);
            request.catch(() => this.lessonPageRequests.delete(key));
            this.lessonPageRequests.set(key, request);
        }
        return request;
    }

    private loadLessonPage(key: string, courseSlug: string, moduleSlug: string, lessonSlug: string): Promise<PublicLessonPage | null> {
        return this.transfer(key, async () => {
            const course = await this.findCourse(courseSlug);
            const module = course?.modules.find(sub => sub.slug === moduleSlug);
            const index = module?.lessons.findIndex(lesson => lesson.slug === lessonSlug) ?? -1;
            if (!course || !module || index < 0) {
                return null;
            }

            const lesson = module.lessons[index];
            const content = await this.loadLessonContent(lesson);
            if (!content) {
                return null;
            }

            const toLink = (target: PublicLessonSummary | undefined): PublicLessonLink | null =>
                target ? { title: target.title, path: publicLessonPath(course.slug, module.slug, target.slug) } : null;

            return {
                course: { slug: course.slug, title: course.title },
                module: { slug: module.slug, title: module.title },
                lesson,
                content,
                previous: toLink(module.lessons[index - 1]),
                next: toLink(module.lessons[index + 1]),
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

    private loadCurriculum(): Promise<PublicCourse[]> {
        this.curriculumRequest ??= this.source.curriculum().then(toPublicCourses).catch(error => {
            this.curriculumRequest = null;
            throw error;
        });
        return this.curriculumRequest;
    }

    private async findCourse(courseSlug: string): Promise<PublicCourse | null> {
        const curriculum = await this.loadCurriculum();
        return curriculum.find(course => course.slug === courseSlug) ?? null;
    }
}
