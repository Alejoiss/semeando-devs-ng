import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { AnswerService } from './answer';

describe('AnswerService queries', () => {
    let service: AnswerService;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };
    const fails = { error: { message: 'boom' } };

    beforeEach(() => {
        service = TestBed.inject(AnswerService);
    });

    it('gets the safe answers without the correct flag', async () => {
        const stub = use({ data: [{ id: 'a', question_id: 'q', text: 'T', is_correct: true }] });
        expect(await service.getAnswersByQuestionId('q')).toEqual([{ id: 'a', questionId: 'q', text: 'T' } as any]);
        expect(stub.client.rpc).toHaveBeenCalledWith('get_quiz_answers_safe', { p_question_id: 'q' });
        use({ data: null });
        expect(await service.getAnswersByQuestionId('q')).toEqual([]);
        use(fails);
        await expectAsync(service.getAnswersByQuestionId('q')).toBeRejectedWithError('boom');
    });

    it('gets the answers for the editor with correctness and reason', async () => {
        use({ data: [{ id: 'a', question_id: 'q', text: 'T', is_correct: true, reason: 'R', created_at: '2026-01-01T00:00:00Z' }] });
        expect((await service.getAnswersByQuestionIdForEditor('q'))[0]).toEqual(jasmine.objectContaining({ isCorrect: true, reason: 'R', createdAt: new Date('2026-01-01T00:00:00Z') }));
        use({ data: null });
        expect(await service.getAnswersByQuestionIdForEditor('q')).toEqual([]);
        use(fails);
        await expectAsync(service.getAnswersByQuestionIdForEditor('q')).toBeRejectedWithError('boom');
    });

    it('verifies an answer, defaulting to incorrect', async () => {
        use({ data: [{ is_correct: true, reason: 'R' }] });
        expect(await service.verifyAnswer('a')).toEqual({ isCorrect: true, reason: 'R' });
        use({ data: null });
        expect(await service.verifyAnswer('a')).toEqual({ isCorrect: false, reason: '' });
        use(fails);
        await expectAsync(service.verifyAnswer('a')).toBeRejectedWithError('boom');
    });

    it('gets a question hint', async () => {
        use({ data: 'dica' });
        expect(await service.getQuestionHint('q')).toBe('dica');
        use({ data: null });
        expect(await service.getQuestionHint('q')).toBe('');
        use(fails);
        await expectAsync(service.getQuestionHint('q')).toBeRejectedWithError('boom');
    });
});
