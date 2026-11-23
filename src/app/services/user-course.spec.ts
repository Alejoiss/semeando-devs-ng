import { TestBed } from '@angular/core/testing';
import { UserCourseService } from './user-course';

describe('UserCourseService', () => {
    let service: UserCourseService;
    let supabaseSpy: any;
    let authSpy: any;
    let fromSpy: any;
    let selectSpy: any;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserCourseService);

        authSpy = {
            getUser: jasmine.createSpy('getUser').and.returnValue(Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }))
        };

        selectSpy = {
            eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: [], error: null }))
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

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getUserCourses (REQ-4)', () => {
        it('returns user specific courses on success', async () => {
            const mockUserCourses = [
                { id: 'um1', user_id: 'user-123', module_id: 'm1', completed: false, course: { id: 'm1', title: 'M1' } }
            ];
            selectSpy.eq.and.returnValue(Promise.resolve({ data: mockUserCourses, error: null }));

            const result = await service.getUserCourses();
            expect(result).toEqual(mockUserCourses as any);
            expect(supabaseSpy.from).toHaveBeenCalledWith('user_modules');
            expect(fromSpy.select).toHaveBeenCalledWith('*, course:modules(*)');
            expect(selectSpy.eq).toHaveBeenCalledWith('user_id', 'user-123');
        });

        it('returns empty array if no records found', async () => {
            selectSpy.eq.and.returnValue(Promise.resolve({ data: null, error: null }));

            const result = await service.getUserCourses();
            expect(result).toEqual([]);
        });

        it('throws if user is not authenticated', async () => {
            authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: null }, error: null }));

            await expectAsync(service.getUserCourses()).toBeRejectedWithError('User not authenticated');
        });

        it('throws if auth check fails', async () => {
            authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: null }, error: { message: 'Auth error' } }));

            await expectAsync(service.getUserCourses()).toBeRejectedWithError('User not authenticated');
        });

        it('throws error if query fails', async () => {
            selectSpy.eq.and.returnValue(Promise.resolve({ data: null, error: { message: 'Query failed' } }));

            await expectAsync(service.getUserCourses()).toBeRejectedWithError('Query failed');
        });
    });

    describe('getUserCoursesForUser (REQ-4.2)', () => {
        it('returns user specific course completion states without auth check', async () => {
            const mockUserCourses = [
                { module_id: 'm1', completed: false }
            ];
            selectSpy.eq.and.returnValue(Promise.resolve({ data: mockUserCourses, error: null }));

            const result = await service.getUserCoursesForUser('user-123');
            expect(result).toEqual(mockUserCourses as any);
            expect(supabaseSpy.from).toHaveBeenCalledWith('user_modules');
            expect(fromSpy.select).toHaveBeenCalledWith('module_id, completed');
            expect(selectSpy.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(authSpy.getUser).not.toHaveBeenCalled();
        });

        it('throws error if query fails', async () => {
            selectSpy.eq.and.returnValue(Promise.resolve({ data: null, error: { message: 'Query failed' } }));

            await expectAsync(service.getUserCoursesForUser('user-123')).toBeRejectedWithError('Query failed');
        });
    });
});
