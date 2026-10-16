import { TestBed } from '@angular/core/testing';
import { PublicCatalogService } from './public-catalog';
import { CurriculumRow, PUBLIC_CATALOG_SOURCE, PublicCatalogSource } from './public-catalog.source';

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
        source = jasmine.createSpyObj<PublicCatalogSource>('PublicCatalogSource', ['showcase', 'curriculum', 'preview']);
        source.curriculum.and.resolveTo(curriculum);
        source.preview.and.callFake(async id => (id === 'l3' ? null : `Prévia de ${id}`));

        TestBed.configureTestingModule({
            providers: [{ provide: PUBLIC_CATALOG_SOURCE, useValue: source }],
        });
        service = TestBed.inject(PublicCatalogService);
    });

    it('keeps only theory lessons, in order, and drops submodules without them', async () => {
        const [module] = await service.getCurriculum();

        expect(module.avatar).toBe('css.png');
        expect(module.submodules.map(sub => sub.slug)).toEqual(['introducao']);
        expect(module.submodules[0].lessons.map(lesson => lesson.id)).toEqual(['l1', 'l2', 'l3']);
    });

    it('generates unique lesson slugs within a submodule', async () => {
        const [module] = await service.getCurriculum();

        expect(module.submodules[0].lessons.map(lesson => lesson.slug)).toEqual(['o-que-e-css', 'sintaxe', 'sintaxe-2']);
    });

    it('builds the lesson page with only the preview and its neighbours', async () => {
        const page = await service.getLessonPage('css', 'introducao', 'sintaxe');

        expect(source.preview).toHaveBeenCalledWith('l2');
        expect(page?.preview).toBe('Prévia de l2');
        expect(page?.previous?.path).toEqual(['/cursos', 'css', 'introducao', 'o-que-e-css']);
        expect(page?.next?.path).toEqual(['/cursos', 'css', 'introducao', 'sintaxe-2']);
    });

    it('returns null for lessons without a preview or that do not exist', async () => {
        expect(await service.getLessonPage('css', 'introducao', 'sintaxe-2')).toBeNull();
        expect(await service.getLessonPage('css', 'introducao', 'nao-existe')).toBeNull();
    });

    it('returns null for unknown modules', async () => {
        expect(await service.getModule('nao-existe')).toBeNull();
    });

    it('loads the curriculum only once', async () => {
        await service.getModule('css');
        await service.getCurriculum();

        expect(source.curriculum).toHaveBeenCalledTimes(1);
    });
});
