import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { UserLessonService } from './user-lesson';

const lessonRow = { id: 'l', title: 'T', description: 'D', type: 'LESSON', order: 1, sub_module_id: 's', xp: 3, language: 'js', initial_code: 'c', created_by: 'u' };
const row = { id: 'ul', completed: true, completed_at: '2026-01-02T00:00:00Z', saved_code: 'sc', submitted_code: 'sub', ai_feedback: 'fb', lesson: lessonRow };

describe('UserLessonService queries', () => {
    let service: UserLessonService;
    const use = (user: unknown, ...results: any[]) => {
        const stub = createClientStub(...results);
        (stub.client as any).auth = {
            getUser: () => Promise.resolve({ data: { user }, error: user ? null : { message: 'x' } }),
            getSession: () => Promise.resolve({ data: { session: user ? { access_token: 'tok' } : null }, error: null }),
        };
        (service as any).supabase = stub.client;
        return stub;
    };
    const me = { id: 'me' };

    beforeEach(() => {
        service = TestBed.inject(UserLessonService);
    });

    it('lists the lessons of the current user mapped to the model', async () => {
        use(me, { data: [row, { ...row, completed_at: null, lesson: null }] });
        const [first, second] = await service.getUserLessons();
        expect(first.completedAt).toEqual(new Date('2026-01-02T00:00:00Z'));
        expect(first.savedCode).toBe('sc');
        expect(first.lesson).toEqual(jasmine.objectContaining({ moduleId: 's', initialCode: 'c', createdBy: 'u' }));
        expect(second.completedAt).toBeNull();
        expect(second.lesson).toBeUndefined();
    });

    it('requires authentication and surfaces query errors', async () => {
        use(null, {});
        await expectAsync(service.getUserLessons()).toBeRejectedWithError('User not authenticated');
        await expectAsync(service.startLesson('l')).toBeRejectedWithError('User not authenticated');
        await expectAsync(service.getUserLesson('l')).toBeRejectedWithError('User not authenticated');
        await expectAsync(service.updateDraftCode('l', 'c')).toBeRejectedWithError('User not authenticated');
        use(me, { error: { message: 'boom' } });
        await expectAsync(service.getUserLessons()).toBeRejectedWithError('boom');
        await expectAsync(service.startLesson('l')).toBeRejectedWithError('boom');
        await expectAsync(service.updateDraftCode('l', 'c')).toBeRejectedWithError('boom');
    });

    it('lists the lessons of another user in the light shape', async () => {
        use(me, { data: [{ id: 'a', completed: true, lesson: { id: 'l', sub_module_id: 's' } }, { id: 'b', completed: false, lesson: null }] });
        expect(await service.getUserLessonsForUser('u')).toEqual([
            { id: 'a', completed: true, lesson: { id: 'l', moduleId: 's' } },
            { id: 'b', completed: false, lesson: undefined },
        ]);
        use(me, { data: null });
        expect(await service.getUserLessonsForUser('u')).toEqual([]);
        use(me, { error: { message: 'boom' } });
        await expectAsync(service.getUserLessonsForUser('u')).toBeRejectedWithError('boom');
    });

    it('starts a lesson as not completed', async () => {
        const stub = use(me, {});
        await service.startLesson('l');
        expect(stub.spy(0, 'insert')).toHaveBeenCalledWith({ user_id: 'me', lesson_id: 'l', completed: false, completed_at: null });
    });

    it('gets one user lesson, null when absent', async () => {
        use(me, { data: row });
        expect((await service.getUserLesson('l'))?.id).toBe('ul');
        use(me, { data: null, error: { code: 'PGRST116', message: '' } });
        expect(await service.getUserLesson('l')).toBeNull();
        use(me, { data: null, error: { code: 'X', message: 'boom' } });
        await expectAsync(service.getUserLesson('l')).toBeRejectedWithError('boom');
    });

    it('saves the draft code', async () => {
        const stub = use(me, {});
        await service.updateDraftCode('l', 'code');
        expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ saved_code: 'code' });
    });

    describe('evaluateChallenge', () => {
        it('requires a session', async () => {
            use(null, {});
            await expectAsync(service.evaluateChallenge('l', 'd', 'c')).toBeRejectedWithError('User not authenticated');
        });

        it('maps the edge function completion flags to the module/course vocabulary', async () => {
            use(me, {});
            spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify({ aiFeedback: 'ok', subModuleCompleted: true, moduleCompleted: false }), { status: 200 }));
            expect(await service.evaluateChallenge('l', 'd', 'c')).toEqual({ aiFeedback: 'ok', moduleCompleted: true, courseCompleted: false } as any);
        });

        it('posts to the edge function with the bearer token', async () => {
            use(me, {});
            const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify({ aiFeedback: 'ok' }), { status: 200 }));
            expect(await service.evaluateChallenge('l', 'd', 'c')).toEqual({ aiFeedback: 'ok' } as any);
            const [url, init] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
            expect(url).toContain('/functions/v1/evaluate-challenge');
            expect((init.headers as any).Authorization).toBe('Bearer tok');
            expect(JSON.parse(init.body as string)).toEqual({ lessonId: 'l', description: 'd', code: 'c' });
        });

        it('throws the server error with a fallback', async () => {
            use(me, {});
            const fetchSpy = spyOn(window, 'fetch');
            fetchSpy.and.resolveTo(new Response(JSON.stringify({ error: 'limit' }), { status: 429 }));
            await expectAsync(service.evaluateChallenge('l', 'd', 'c')).toBeRejectedWithError('limit');
            fetchSpy.and.resolveTo(new Response(JSON.stringify({}), { status: 500 }));
            await expectAsync(service.evaluateChallenge('l', 'd', 'c')).toBeRejectedWithError('Failed to evaluate challenge');
        });
    });
});
