import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { UserQuizService } from './user-quiz';

const row = { id: 'uq', user_id: 'u', quiz_id: 'q', score: 7, spent_time: 9, completed: true, completed_at: '2026-01-02T00:00:00Z', created_at: '2026-01-01T00:00:00Z', quiz: { lesson_id: 'l', questions: [{ count: 10 }] } };

describe('UserQuizService queries', () => {
    let service: UserQuizService;
    const use = (session: unknown, ...results: any[]) => {
        const stub = createClientStub(...results);
        (stub.client as any).auth = { getSession: () => Promise.resolve({ data: { session } }) };
        (service as any).supabase = stub.client;
        return stub;
    };
    const fails = { error: { message: 'boom' } };

    beforeEach(() => {
        service = TestBed.inject(UserQuizService);
    });

    it('creates an attempt and maps it', async () => {
        const stub = use(null, { data: row });
        const attempt = await service.createAttempt('u', 'q');
        expect(stub.spy(0, 'insert')).toHaveBeenCalledWith({ user_id: 'u', quiz_id: 'q' });
        expect(attempt).toEqual(jasmine.objectContaining({ id: 'uq', userId: 'u', quizId: 'q', lessonId: 'l', score: 7, totalQuestions: 10, completedAt: new Date('2026-01-02T00:00:00Z') }));
        use(null, fails);
        await expectAsync(service.createAttempt('u', 'q')).toBeRejectedWithError('boom');
    });

    it('finishes an attempt as completed', async () => {
        const stub = use(null, { data: { ...row, quiz: null, completed_at: null } });
        const attempt = await service.finishAttempt('uq', 7, 9);
        expect(stub.spy(0, 'update').calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ score: 7, spent_time: 9, completed: true }));
        expect(attempt.totalQuestions).toBe(0);
        expect(attempt.completedAt).toBeNull();
        use(null, fails);
        await expectAsync(service.finishAttempt('uq', 1, 1)).toBeRejectedWithError('boom');
    });

    it('lists the attempts of a module for the logged user', async () => {
        const stub = use({ user: { id: 'me' } }, { data: [row] });
        expect((await service.getUserQuizzesByModule('s')).length).toBe(1);
        expect(stub.spy(0, 'eq')).toHaveBeenCalledWith('user_id', 'me');
        use({ user: { id: 'me' } }, { data: null });
        expect(await service.getUserQuizzesByModule('s')).toEqual([]);
        use(null, {});
        await expectAsync(service.getUserQuizzesByModule('s')).toBeRejectedWithError('No active session found');
        use({ user: { id: 'me' } }, fails);
        await expectAsync(service.getUserQuizzesByModule('s')).toBeRejectedWithError('boom');
    });

    it('lists the attempts of a user', async () => {
        use(null, { data: [row] });
        expect((await service.getUserQuizzesForUser('u')).length).toBe(1);
        use(null, { data: null });
        expect(await service.getUserQuizzesForUser('u')).toEqual([]);
        use(null, fails);
        await expectAsync(service.getUserQuizzesForUser('u')).toBeRejectedWithError('boom');
    });
});
