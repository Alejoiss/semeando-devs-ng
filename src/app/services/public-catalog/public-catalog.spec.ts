import { TestBed } from '@angular/core/testing';
import { PublicCatalogService } from './public-catalog';
import { CurriculumRow, PUBLIC_CATALOG_SOURCE, PublicCatalogSource } from './public-catalog.source';
import { SectionContentType } from '../../../models/section-content/section-content';

describe('PublicCatalogService', () => {
    let service: PublicCatalogService;
    let source: jasmine.SpyObj<PublicCatalogSource>;

    const curriculum: CurriculumRow[] = [{
        id: 'm1', slug: 'css', title: 'CSS', description: null, icon: 'palette',
        submodules: [
            {
                id: 's2', slug: 'vazio', title: 'Sem aulas', description: null, icon: null, order: 2,
                lessons: [{ id: 'c1', title: 'Desafio', description: null, type: 'CHALLENGE', order: 1 }],
            },
            {
                id: 's1', slug: 'introducao', title: 'Introdução', description: null, icon: null, order: 1,
                lessons: [
                    { id: 'l3', title: 'Introdução', description: null, type: 'LESSON', order: 3 },
                    { id: 'l1', title: 'O que é CSS?', description: 'Primeira aula', type: 'LESSON', order: 1 },
                    { id: 'q1', title: 'Revisão', description: null, type: 'REVISION', order: 2 },
                    { id: 'l2', title: 'Introdução', description: null, type: 'LESSON', order: 2 },
                ],
            },
        ],
    }];

    beforeEach(() => {
        source = jasmine.createSpyObj<PublicCatalogSource>('PublicCatalogSource', ['showcase', 'curriculum', 'sections']);
        source.curriculum.and.resolveTo(curriculum);
        source.sections.and.resolveTo([
            { id: 'sec1', type: SectionContentType.MARKDOWN, content: '# Título', file: null, fileDescription: null },
        ]);

        TestBed.configureTestingModule({
            providers: [{ provide: PUBLIC_CATALOG_SOURCE, useValue: source }],
        });
        service = TestBed.inject(PublicCatalogService);
    });

    it('keeps only theory lessons, in order, and drops submodules without them', async () => {
        const [module] = await service.getCurriculum();

        expect(module.submodules.map(sub => sub.slug)).toEqual(['introducao']);
        expect(module.submodules[0].lessons.map(lesson => lesson.id)).toEqual(['l1', 'l2', 'l3']);
    });

    it('generates unique lesson slugs within a submodule', async () => {
        const [module] = await service.getCurriculum();

        expect(module.submodules[0].lessons.map(lesson => lesson.slug)).toEqual(['o-que-e-css', 'introducao', 'introducao-2']);
    });

    it('builds the lesson page with its sections and neighbours', async () => {
        const page = await service.getLessonPage('css', 'introducao', 'introducao');

        expect(page?.lesson.id).toBe('l2');
        expect(source.sections).toHaveBeenCalledWith('l2');
        expect(page?.sections.length).toBe(1);
        expect(page?.previous?.path).toEqual(['/cursos', 'css', 'introducao', 'o-que-e-css']);
        expect(page?.next?.path).toEqual(['/cursos', 'css', 'introducao', 'introducao-2']);
    });

    it('returns null for unknown lessons and modules', async () => {
        expect(await service.getLessonPage('css', 'introducao', 'nao-existe')).toBeNull();
        expect(await service.getModule('nao-existe')).toBeNull();
    });

    it('loads the curriculum only once', async () => {
        await service.getModule('css');
        await service.getLessonPage('css', 'introducao', 'o-que-e-css');

        expect(source.curriculum).toHaveBeenCalledTimes(1);
    });
});
