import { TestBed } from '@angular/core/testing';
import { PublicCatalogService } from './public-catalog';
import { CurriculumRow, PUBLIC_CATALOG_SOURCE, PublicCatalogSource } from './public-catalog.source';
import { SectionContentType } from '../../../models/section-content/section-content';

describe('PublicCatalogService', () => {
    let service: PublicCatalogService;
    let source: jasmine.SpyObj<PublicCatalogSource>;

    const curriculum: CurriculumRow[] = [{
        id: 'm1', slug: 'css', title: 'CSS', description: null, icon: null, avatar: 'css.png',
        submodules: [
            {
                id: 's2', slug: 'vazio', title: 'Sem aulas', description: null, icon: null, order: 2,
                lessons: [{ id: 'c1', title: 'Desafio', description: null, type: 'CHALLENGE', order: 1 }],
            },
            {
                id: 's1', slug: 'introducao', title: 'Introdução', description: null, icon: null, order: 1,
                lessons: [
                    { id: 'l3', title: 'Sintaxe', description: null, type: 'LESSON', order: 4 },
                    { id: 'l1', title: 'O que é CSS?', description: 'Primeira aula', type: 'LESSON', order: 1 },
                    { id: 'q1', title: 'Revisão', description: null, type: 'REVISION', order: 2 },
                    { id: 'l2', title: 'Sintaxe', description: null, type: 'LESSON', order: 3 },
                ],
            },
        ],
    }];

    beforeEach(() => {
        source = jasmine.createSpyObj<PublicCatalogSource>('PublicCatalogSource', ['showcase', 'curriculum', 'preview', 'freeSections']);
        source.curriculum.and.resolveTo(curriculum);
        source.preview.and.callFake(async id => (id === 'l3' ? null : `Prévia de ${id}`));
        source.freeSections.and.callFake(async id => (id === 'l1'
            ? [{ id: 'sec1', type: SectionContentType.MARKDOWN, content: 'Aula completa', file: null, fileDescription: null }]
            : []));

        TestBed.configureTestingModule({
            providers: [{ provide: PUBLIC_CATALOG_SOURCE, useValue: source }],
        });
        service = TestBed.inject(PublicCatalogService);
    });

    it('keeps only theory lessons, in order, and drops modules without them', async () => {
        const [course] = await service.getCurriculum();

        expect(course.avatar).toBe('css.png');
        expect(course.modules.map(sub => sub.slug)).toEqual(['introducao']);
        expect(course.modules[0].lessons.map(lesson => lesson.id)).toEqual(['l1', 'l2', 'l3']);
    });

    it('hides courses that have no published module yet', async () => {
        source.curriculum.and.resolveTo([
            ...curriculum,
            {
                id: 'm2', slug: 'java', title: 'Java', description: null, icon: null, avatar: null,
                submodules: [{ id: 's9', slug: 'em-breve', title: 'Em breve', description: null, icon: null, order: 1, lessons: [] }],
            },
            { id: 'm3', slug: 'go', title: 'Go', description: null, icon: null, avatar: null, submodules: [] },
        ]);

        const courses = await service.getCurriculum();

        expect(courses.map(course => course.slug)).toEqual(['css']);
        expect(await service.getCourse('java')).toBeNull();
    });

    it('generates unique lesson slugs within a module', async () => {
        const [course] = await service.getCurriculum();

        expect(course.modules[0].lessons.map(lesson => lesson.slug)).toEqual(['o-que-e-css', 'sintaxe', 'sintaxe-2']);
    });

    it('marks only the first theory lesson of each module as free', async () => {
        const [course] = await service.getCurriculum();

        expect(course.modules[0].lessons.map(lesson => lesson.isFree)).toEqual([true, false, false]);
    });

    it('serves the full content of free lessons', async () => {
        const page = await service.getLessonPage('css', 'introducao', 'o-que-e-css');

        expect(page?.content).toEqual({
            kind: 'full',
            sections: [{ id: 'sec1', type: SectionContentType.MARKDOWN, content: 'Aula completa', file: null, fileDescription: null }],
        });
        expect(source.preview).not.toHaveBeenCalled();
    });

    it('builds the other lesson pages with only the preview and their neighbours', async () => {
        const page = await service.getLessonPage('css', 'introducao', 'sintaxe');

        expect(source.freeSections).not.toHaveBeenCalled();
        expect(source.preview).toHaveBeenCalledWith('l2');
        expect(page?.content).toEqual({ kind: 'preview', markdown: 'Prévia de l2' });
        expect(page?.previous?.path).toEqual(['/cursos', 'css', 'introducao', 'o-que-e-css']);
        expect(page?.next?.path).toEqual(['/cursos', 'css', 'introducao', 'sintaxe-2']);
    });

    it('returns null for lessons without a preview or that do not exist', async () => {
        expect(await service.getLessonPage('css', 'introducao', 'sintaxe-2')).toBeNull();
        expect(await service.getLessonPage('css', 'introducao', 'nao-existe')).toBeNull();
    });

    it('returns null for unknown courses', async () => {
        expect(await service.getCourse('nao-existe')).toBeNull();
    });

    it('shares the same request when a lesson page is resolved twice', async () => {
        const [first, second] = await Promise.all([
            service.getLessonPage('css', 'introducao', 'sintaxe'),
            service.getLessonPage('css', 'introducao', 'sintaxe'),
        ]);

        expect(first).toBe(second);
        expect(source.preview).toHaveBeenCalledTimes(1);
    });

    it('loads the curriculum only once', async () => {
        await service.getCourse('css');
        await service.getCurriculum();

        expect(source.curriculum).toHaveBeenCalledTimes(1);
    });
});
