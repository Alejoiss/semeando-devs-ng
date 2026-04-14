import { TestBed } from '@angular/core/testing';
import { UserModuleService } from './user-module';

describe('UserModuleService', () => {
    let service: UserModuleService;
    let supabaseSpy: any;
    let authSpy: any;
    let fromSpy: any;
    let selectSpy: any;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserModuleService);

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

    describe('getUserModules (REQ-4)', () => {
        it('returns user specific modules on success', async () => {
            const mockUserModules = [
                { id: 'um1', user_id: 'user-123', module_id: 'm1', completed: false, module: { id: 'm1', title: 'M1' } }
            ];
            selectSpy.eq.and.returnValue(Promise.resolve({ data: mockUserModules, error: null }));

            const result = await service.getUserModules();
            expect(result).toEqual(mockUserModules as any);
            expect(supabaseSpy.from).toHaveBeenCalledWith('user_modules');
            expect(fromSpy.select).toHaveBeenCalledWith('*, module:modules(*)');
            expect(selectSpy.eq).toHaveBeenCalledWith('user_id', 'user-123');
        });

        it('returns empty array if no records found', async () => {
            selectSpy.eq.and.returnValue(Promise.resolve({ data: null, error: null }));

            const result = await service.getUserModules();
            expect(result).toEqual([]);
        });

        it('throws if user is not authenticated', async () => {
            authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: null }, error: null }));

            await expectAsync(service.getUserModules()).toBeRejectedWithError('User not authenticated');
        });

        it('throws if auth check fails', async () => {
            authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: null }, error: { message: 'Auth error' } }));

            await expectAsync(service.getUserModules()).toBeRejectedWithError('User not authenticated');
        });

        it('throws error if query fails', async () => {
            selectSpy.eq.and.returnValue(Promise.resolve({ data: null, error: { message: 'Query failed' } }));

            await expectAsync(service.getUserModules()).toBeRejectedWithError('Query failed');
        });
    });
});
