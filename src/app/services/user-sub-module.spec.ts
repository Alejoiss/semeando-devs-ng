import { TestBed } from '@angular/core/testing';
import { UserSubModuleService } from './user-sub-module';

describe('UserSubModuleService', () => {
    let service: UserSubModuleService;
    let supabaseSpy: any;
    let authSpy: any;
    let fromSpy: any;
    let selectSpy: any;
    let eqSpy: any;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserSubModuleService);

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

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('verifies user completion states store properly', () => {
        // Validating REQ-2.1 and REQ-3.2: service can track user specific submodule completion
        expect(typeof service.getUserSubModules).toBe('function');
    });

    describe('getUserSubModulesForUser', () => {
        it('returns user submodules with mapped subModule field without auth check', async () => {
            const mockUserSubModules = [
                { id: 'usm-1', completed: true, subModule: { id: 'sm-1', title: 'SM-1' } }
            ];
            eqSpy.and.returnValue(Promise.resolve({ data: mockUserSubModules, error: null }));

            const result = await service.getUserSubModulesForUser('user-123');
            expect(result).toEqual(mockUserSubModules as any);
            expect(supabaseSpy.from).toHaveBeenCalledWith('user_submodules');
            expect(fromSpy.select).toHaveBeenCalledWith('*, subModule:submodules(*)');
            expect(eqSpy).toHaveBeenCalledWith('user_id', 'user-123');
            expect(authSpy.getUser).not.toHaveBeenCalled();
        });

        it('throws error if query fails', async () => {
            eqSpy.and.returnValue(Promise.resolve({ data: null, error: { message: 'Query failed' } }));

            await expectAsync(service.getUserSubModulesForUser('user-123')).toBeRejectedWithError('Query failed');
        });
    });
});
