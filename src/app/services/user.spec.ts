import { TestBed } from '@angular/core/testing';
import { UserService } from './user';

describe('UserService', () => {
    let service: UserService;
    let supabaseAuthSpy: any;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserService);

        supabaseAuthSpy = {
            signUp: jasmine.createSpy('signUp'),
            signInWithPassword: jasmine.createSpy('signInWithPassword'),
            getSession: jasmine.createSpy('getSession'),
            getUser: jasmine.createSpy('getUser'),
            updateUser: jasmine.createSpy('updateUser')
        };

        // Replace the internal supabase client with our mock for testing
        (service as any).supabase = {
            auth: supabaseAuthSpy
        };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('sign in (DES-1)', () => {
        it('verify user sign in', async () => {
            supabaseAuthSpy.signInWithPassword.and.returnValue(Promise.resolve({ data: {}, error: null }));
            await service.signIn({ email: 'test@test.com', password: 'password' });
            expect(supabaseAuthSpy.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'password'
            });
        });

        it('rejects if email or password is missing', async () => {
            await expectAsync(service.signIn({ email: 'test@test.com' })).toBeRejectedWithError('Email and password are required');
        });

        it('denies sign in if it fails', async () => {
            supabaseAuthSpy.signInWithPassword.and.returnValue(Promise.resolve({ data: null, error: { message: 'Invalid login' } }));
            await expectAsync(service.signIn({ email: 'test@test.com', password: 'wrong' })).toBeRejectedWithError('Invalid login');
        });
    });

    describe('get session (DES-1)', () => {
        it('returns session if active', async () => {
            const mockSession = { user: { id: '123' } };
            supabaseAuthSpy.getSession.and.returnValue(Promise.resolve({ data: { session: mockSession }, error: null }));
            const session = await service.getSession();
            expect(session).toEqual(mockSession as any);
        });

        it('returns null if error or no session', async () => {
            supabaseAuthSpy.getSession.and.returnValue(Promise.resolve({ data: { session: null }, error: { message: 'Error' } }));
            const session = await service.getSession();
            expect(session).toBeNull();
        });
    });

    describe('registration (REQ-1.1)', () => {
        it('verify user registration', async () => {
            supabaseAuthSpy.signUp.and.returnValue(Promise.resolve({ data: {}, error: null }));
            await service.register({ email: 'test@test.com', password: 'password', name: 'Test' });
            expect(supabaseAuthSpy.signUp).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'password',
                options: { data: { name: 'Test' } }
            });
        });

        it('rejects if email or password is missing', async () => {
            await expectAsync(service.register({ email: 'test@test.com' })).toBeRejectedWithError('Email and password are required');
        });
    });

    describe('profile reading (REQ-2)', () => {
        it('verify profile reading for authenticated user', async () => {
            const mockUser = {
                id: '123',
                email: 'test@test.com',
                created_at: new Date().toISOString(),
                user_metadata: { name: 'Test User' }
            };
            supabaseAuthSpy.getUser.and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null }));

            const profile = await service.getUserProfile();
            expect(profile.id).toBe('123');
            expect(profile.name).toBe('Test User');
        });

        it('denies reading if unauthenticated', async () => {
            supabaseAuthSpy.getUser.and.returnValue(Promise.resolve({ data: { user: null }, error: { message: 'Not auth' } }));
            await expectAsync(service.getUserProfile()).toBeRejectedWithError('Not auth');
        });
    });

    describe('profile updates (REQ-3)', () => {
        it('verify profile updates for authenticated user', async () => {
            supabaseAuthSpy.updateUser.and.returnValue(Promise.resolve({ data: {}, error: null }));
            await service.updateUserProfile({ name: 'New Name' });
            expect(supabaseAuthSpy.updateUser).toHaveBeenCalledWith({ data: { name: 'New Name' } });
        });

        it('denies updating if it fails (unauthenticated/error)', async () => {
            supabaseAuthSpy.updateUser.and.returnValue(Promise.resolve({ data: null, error: { message: 'Update failed' } }));
            await expectAsync(service.updateUserProfile({ name: 'New Name' })).toBeRejectedWithError('Update failed');
        });
    });
});
