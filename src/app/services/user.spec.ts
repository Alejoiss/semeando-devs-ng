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

        // Mock supabase.from chain
        const mockSingle = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: { 
                is_pro: false, 
                role: 'student', 
                newsletter_active: false,
                terms_accepted: true,
                terms_accepted_at: new Date().toISOString(),
                teacher_terms_accepted: false,
                teacher_terms_accepted_at: null
            }, 
            error: null 
        }));
        const mockReturns = jasmine.createSpy('returns').and.returnValue({ single: mockSingle });
        const mockEq = jasmine.createSpy('eq').and.returnValue({ returns: mockReturns });
        const mockSelect = jasmine.createSpy('select').and.returnValue({ eq: mockEq });
        const mockFrom = jasmine.createSpy('from').and.returnValue({ select: mockSelect });

        // Replace the internal supabase client with our mock for testing
        (service as any).supabase = {
            auth: supabaseAuthSpy,
            from: mockFrom
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
            supabaseAuthSpy.signInWithPassword.and.returnValue(Promise.resolve({ data: null, error: { message: 'Invalid login credentials' } }));
            await expectAsync(service.signIn({ email: 'test@test.com', password: 'wrong' })).toBeRejectedWithError('E-mail ou senha inválidos.');
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
            const acceptedTermsAt = new Date();
            await service.register({ 
                email: 'test@test.com', 
                password: 'password', 
                name: 'Test',
                newsletter_active: true,
                acceptedTerms: true,
                acceptedTermsAt
            });
            expect(supabaseAuthSpy.signUp).toHaveBeenCalledWith(jasmine.objectContaining({
                email: 'test@test.com',
                password: 'password',
                options: jasmine.objectContaining({
                    data: jasmine.objectContaining({
                        name: 'Test',
                        newsletter_active: true,
                        terms_accepted: true,
                        terms_accepted_at: acceptedTermsAt.toISOString()
                    })
                })
            }));
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
            expect(profile.acceptedTerms).toBeTrue();
            expect(profile.acceptedTermsAt).toBeInstanceOf(Date);
            expect(profile.teacherTermsAccepted).toBeFalse();
            expect(profile.teacherTermsAcceptedAt).toBeNull();
        });

        it('verify profile reading maps teacher terms correctly when accepted', async () => {
            const mockUser = {
                id: '123',
                email: 'test@test.com',
                created_at: new Date().toISOString(),
                user_metadata: { name: 'Test User' }
            };
            supabaseAuthSpy.getUser.and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null }));

            const acceptedAtStr = new Date().toISOString();
            const mockSingle = jasmine.createSpy('single').and.returnValue(Promise.resolve({
                data: { 
                    is_pro: false, 
                    role: 'student', 
                    newsletter_active: false,
                    terms_accepted: true,
                    terms_accepted_at: new Date().toISOString(),
                    teacher_terms_accepted: true,
                    teacher_terms_accepted_at: acceptedAtStr
                }, 
                error: null 
            }));
            const mockReturns = jasmine.createSpy('returns').and.returnValue({ single: mockSingle });
            const mockEq = jasmine.createSpy('eq').and.returnValue({ returns: mockReturns });
            const mockSelect = jasmine.createSpy('select').and.returnValue({ eq: mockEq });
            const mockFrom = jasmine.createSpy('from').and.returnValue({ select: mockSelect });

            (service as any).supabase.from = mockFrom;

            const profile = await service.getUserProfile();
            expect(profile.teacherTermsAccepted).toBeTrue();
            expect(profile.teacherTermsAcceptedAt).toEqual(new Date(acceptedAtStr));
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
            await expectAsync(service.updateUserProfile({ name: 'New Name' })).toBeRejectedWithError('Ocorreu um erro inesperado. Tente novamente.');
        });
    });

    describe('accept teacher terms (REQ-4)', () => {
        it('should update profile and update userSignal on success', async () => {
            // Set user signal in memory
            const initialUser: any = {
                id: 'user_123',
                email: 'test@test.com',
                name: 'Test Teacher',
                password: '',
                acceptedTerms: true,
                acceptedTermsAt: new Date(),
                teacherTermsAccepted: false,
                teacherTermsAcceptedAt: null,
                avatar: '',
                plan: null,
                isPro: false,
                role: 'teacher',
                proUntil: null,
                newsletter_active: false
            };
            (service as any).userSignal.set(initialUser);

            const mockUpdate = jasmine.createSpy('update').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
            });
            const mockFrom = jasmine.createSpy('from').and.returnValue({
                update: mockUpdate
            });

            (service as any).supabase.from = mockFrom;

            await service.acceptTeacherTerms();

            expect(mockFrom).toHaveBeenCalledWith('profiles');
            expect(mockUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
                teacher_terms_accepted: true
            }));

            const updatedUser = service.currentUser();
            expect(updatedUser).toBeTruthy();
            expect(updatedUser?.teacherTermsAccepted).toBeTrue();
            expect(updatedUser?.teacherTermsAcceptedAt).toBeInstanceOf(Date);
        });

        it('should throw error if user is not authenticated', async () => {
            (service as any).userSignal.set(null);
            await expectAsync(service.acceptTeacherTerms()).toBeRejectedWithError('Usuário não autenticado.');
        });

        it('should throw error if database update fails', async () => {
            const initialUser: any = {
                id: 'user_123',
                email: 'test@test.com',
                name: 'Test Teacher',
                password: '',
                acceptedTerms: true,
                acceptedTermsAt: new Date(),
                teacherTermsAccepted: false,
                teacherTermsAcceptedAt: null,
                avatar: '',
                plan: null,
                isPro: false,
                role: 'teacher',
                proUntil: null,
                newsletter_active: false
            };
            (service as any).userSignal.set(initialUser);

            const mockUpdate = jasmine.createSpy('update').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: { message: 'Database error' } }))
            });
            const mockFrom = jasmine.createSpy('from').and.returnValue({
                update: mockUpdate
            });

            (service as any).supabase.from = mockFrom;

            await expectAsync(service.acceptTeacherTerms()).toBeRejectedWithError('Não foi possível registrar o aceite dos termos. Tente novamente.');
        });
    });
});
