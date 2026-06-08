import { TestBed } from '@angular/core/testing';
import { UserLessonService } from './user-lesson';

describe('UserLessonService', () => {
    let service: UserLessonService;
    let supabaseSpy: any;
    let authSpy: any;
    let fromSpy: any;
    let selectSpy: any;
    let eqSpy: any;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserLessonService);

        authSpy = {
            getUser: jasmine.createSpy('getUser').and.returnValue(Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }))
        };

        eqSpy = jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: [], error: null }));

        selectSpy = {
            eq: eqSpy
        };

        fromSpy = {
            select: jasmine.createSpy('select').and.returnValue(selectSpy)
        };

        supabaseSpy = {
            auth: authSpy,
            from: jasmine.createSpy('from').and.returnValue(fromSpy)
        };

        // Replace internal supabase client
        (service as any).supabase = supabaseSpy;
    });

    // Task 4.5 — REQ-5.4
    it('should be created as a singleton', () => {
        expect(service).toBeTruthy();
    });

    // Task 4.5 — REQ-5.4: provided in root
    it('should share the same instance across injections', () => {
        const service2 = TestBed.inject(UserLessonService);
        expect(service).toBe(service2);
    });

    // Task 4.5 — REQ-5.1, REQ-5.2: method exists
    it('should expose getUserLessons as a function', () => {
        expect(typeof service.getUserLessons).toBe('function');
    });

    // Task 4.5 — REQ-5.1, REQ-5.3: internal Supabase client is configured
    it('should have a configured Supabase client', () => {
        expect(service['supabase']).toBeDefined();
    });

    describe('getUserLessonsForUser', () => {
        it('returns user lessons with mapped lesson fields without auth check', async () => {
            const mockUserLessons = [
                {
                    id: 'ul-1',
                    completed: true,
                    lesson: { id: 'l-1', sub_module_id: 'sm-1' }
                }
            ];
            eqSpy.and.returnValue(Promise.resolve({ data: mockUserLessons, error: null }));

            const result = await service.getUserLessonsForUser('user-123');
            expect(result).toEqual([
                {
                    id: 'ul-1',
                    completed: true,
                    lesson: { id: 'l-1', subModuleId: 'sm-1' }
                }
            ]);
            expect(supabaseSpy.from).toHaveBeenCalledWith('user_lessons');
            expect(fromSpy.select).toHaveBeenCalledWith('id, completed, lesson:lessons(id, sub_module_id)');
            expect(eqSpy).toHaveBeenCalledWith('user_id', 'user-123');
            expect(authSpy.getUser).not.toHaveBeenCalled();
        });

        it('throws error if query fails', async () => {
            eqSpy.and.returnValue(Promise.resolve({ data: null, error: { message: 'Query failed' } }));

            await expectAsync(service.getUserLessonsForUser('user-123')).toBeRejectedWithError('Query failed');
        });
    });
});
