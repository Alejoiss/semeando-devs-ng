import { TestBed } from '@angular/core/testing';
import { LessonService } from './lesson';

describe('LessonService', () => {
    let service: LessonService;
    let supabaseSpy: any;
    let fromSpy: any;
    let queryChain: any;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LessonService);

        // A mock query builder that can be chained and/or awaited as a Promise.
        queryChain = {
            then: (onfulfilled: any, onrejected: any) => {
                return Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected);
            }
        };
        queryChain.eq = jasmine.createSpy('eq').and.returnValue(queryChain);
        queryChain.order = jasmine.createSpy('order').and.returnValue(queryChain);

        fromSpy = {
            select: jasmine.createSpy('select').and.returnValue(queryChain)
        };
        supabaseSpy = {
            from: jasmine.createSpy('from').and.returnValue(fromSpy)
        };

        // Replace internal supabase client
        (service as any).supabase = supabaseSpy;
    });

    // Task 4.4 — REQ-4.3
    it('should be created as a singleton', () => {
        expect(service).toBeTruthy();
    });

    // Task 4.4 — REQ-4.3: provided in root
    it('should share the same instance across injections', () => {
        const service2 = TestBed.inject(LessonService);
        expect(service).toBe(service2);
    });

    // Task 4.4 — REQ-4.1: method exists and accepts a slug
    it('should expose getLessonsBySubModuleSlug as a function', () => {
        expect(typeof service.getLessonsBySubModuleSlug).toBe('function');
    });

    // Task 4.4 — REQ-4.1, REQ-4.2: internal Supabase client is configured
    it('should have a configured Supabase client', () => {
        expect(service['supabase']).toBeDefined();
    });

    describe('getLessonsByModuleSlug', () => {
        it('fetches lessons by module slug and maps them correctly', async () => {
            const mockLessons = [
                {
                    id: 'l1',
                    order: 1,
                    sub_module_id: 'sm1',
                    subModule: { id: 'sm1', module: { slug: 'module-slug' } }
                }
            ];
            spyOn(queryChain, 'then').and.callFake((onfulfilled: any) => {
                return Promise.resolve({ data: mockLessons, error: null }).then(onfulfilled);
            });

            const result = await service.getLessonsByModuleSlug('module-slug');
            expect(result).toEqual([
                {
                    id: 'l1',
                    order: 1,
                    subModuleId: 'sm1',
                    subModule: { id: 'sm1' }
                }
            ]);
            expect(supabaseSpy.from).toHaveBeenCalledWith('lessons');
            expect(fromSpy.select).toHaveBeenCalledWith('id, order, sub_module_id, subModule:submodules!inner(id, module:modules!inner(slug))');
            expect(queryChain.eq).toHaveBeenCalledWith('submodules.modules.slug', 'module-slug');
            expect(queryChain.order).toHaveBeenCalledWith('order', { ascending: true });
        });

        it('throws error if query fails', async () => {
            spyOn(queryChain, 'then').and.callFake((onfulfilled: any) => {
                return Promise.resolve({ data: null, error: { message: 'Query failed' } }).then(onfulfilled);
            });

            await expectAsync(service.getLessonsByModuleSlug('module-slug')).toBeRejectedWithError('Query failed');
        });
    });

    describe('getLessonsLightweight', () => {
        it('fetches lightweight lessons and maps subModule.module_id to moduleId', async () => {
            const mockLessons = [
                {
                    id: 'l1',
                    sub_module_id: 'sm1',
                    subModule: { module_id: 'm1' }
                }
            ];
            spyOn(queryChain, 'then').and.callFake((onfulfilled: any) => {
                return Promise.resolve({ data: mockLessons, error: null }).then(onfulfilled);
            });

            const result = await service.getLessonsLightweight();
            expect(result).toEqual([
                {
                    id: 'l1',
                    subModuleId: 'sm1',
                    moduleId: 'm1'
                }
            ]);
            expect(supabaseSpy.from).toHaveBeenCalledWith('lessons');
            expect(fromSpy.select).toHaveBeenCalledWith('id, sub_module_id, subModule:submodules!inner(module_id)');
        });

        it('throws error if query fails', async () => {
            spyOn(queryChain, 'then').and.callFake((onfulfilled: any) => {
                return Promise.resolve({ data: null, error: { message: 'Query failed' } }).then(onfulfilled);
            });

            await expectAsync(service.getLessonsLightweight()).toBeRejectedWithError('Query failed');
        });
    });
});
