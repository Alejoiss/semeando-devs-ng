import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { LessonType } from '../../models/lesson/lesson';
import { LessonService } from './lesson';

const row = {
    id: 'l1', title: 'T', description: 'D', type: 'LESSON', order: 2, sub_module_id: 'sm1',
    xp: 10, language: 'js', initial_code: 'x', created_by: 'u1', is_validated: true,
};

describe('LessonService queries', () => {
    let service: LessonService;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };

    beforeEach(() => {
        service = TestBed.inject(LessonService);
    });

    it('lists lessons by module slug and rethrows failures', async () => {
        use({ data: [row] });
        expect((await service.getLessonsByModuleSlug('s')).length).toBe(1);
        use({ data: null });
        expect(await service.getLessonsByModuleSlug('s')).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getLessonsByModuleSlug('s')).toBeRejectedWithError('boom');
    });

    it('maps lessons by module id to the model', async () => {
        use({ data: [row] });
        const [lesson] = await service.getLessonsByModuleId('sm1');
        expect(lesson).toEqual(jasmine.objectContaining({ moduleId: 'sm1', initialCode: 'x', createdBy: 'u1', isValidated: true }));
        use({ error: { message: 'boom' } });
        await expectAsync(service.getLessonsByModuleId('sm1')).toBeRejectedWithError('boom');
    });

    it('updates the order of every lesson and fails if any update fails', async () => {
        const stub = use({});
        await service.updateLessonOrder([{ id: 'a', order: 1 }, { id: 'b', order: 2 }]);
        expect(stub.client.from).toHaveBeenCalledTimes(2);
        use({ error: { message: 'boom' } });
        await expectAsync(service.updateLessonOrder([{ id: 'a', order: 1 }])).toBeRejectedWithError('boom');
    });

    it('deletes a lesson by id', async () => {
        const stub = use({});
        await service.deleteLesson('l1');
        expect(stub.spy(0, 'eq')).toHaveBeenCalledWith('id', 'l1');
        use({ error: { message: 'boom' } });
        await expectAsync(service.deleteLesson('l1')).toBeRejectedWithError('boom');
    });

    it('gets all lessons', async () => {
        use({ data: [row] });
        expect((await service.getAllLessons()).length).toBe(1);
        use({ data: null });
        expect(await service.getAllLessons()).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getAllLessons()).toBeRejectedWithError('boom');
    });

    it('gets a lesson by id, treating not-found as null', async () => {
        use({ data: row });
        expect((await service.getLessonById('l1'))?.moduleId).toBe('sm1');
        use({ data: null, error: { code: 'PGRST116', message: 'none' } });
        expect(await service.getLessonById('l1')).toBeNull();
        use({ data: null, error: { code: 'X', message: 'boom' } });
        await expectAsync(service.getLessonById('l1')).toBeRejectedWithError('boom');
    });

    it('creates a lesson, sending is_validated only when provided', async () => {
        const stub = use({ data: row });
        const created = await service.createLesson({ title: 'T', moduleId: 'sm1' });
        expect(created.id).toBe('l1');
        expect(stub.spy(0, 'insert').calls.mostRecent().args[0]).not.toEqual(jasmine.objectContaining({ is_validated: jasmine.anything() }));
        const withFlag = use({ data: row });
        await service.createLesson({ title: 'T', isValidated: false });
        expect(withFlag.spy(0, 'insert').calls.mostRecent().args[0].is_validated).toBeFalse();
        use({ error: { message: 'boom' } });
        await expectAsync(service.createLesson({})).toBeRejectedWithError('boom');
    });

    it('updates only the provided fields', async () => {
        const stub = use({ data: row });
        await service.updateLesson('l1', { title: 'N', xp: 5, language: 'ts', initialCode: 'c', order: 1, moduleId: 's', type: LessonType.LESSON, description: 'd' });
        expect(stub.spy(0, 'update').calls.mostRecent().args[0]).toEqual({
            title: 'N', description: 'd', type: 'LESSON', order: 1, sub_module_id: 's', xp: 5, language: 'ts', initial_code: 'c',
        });
        const partial = use({ data: row });
        await service.updateLesson('l1', { title: 'N' });
        expect(partial.spy(0, 'update').calls.mostRecent().args[0]).toEqual({ title: 'N' });
        use({ error: { message: 'boom' } });
        await expectAsync(service.updateLesson('l1', {})).toBeRejectedWithError('boom');
    });

    it('counts lessons by module', async () => {
        use({ count: 4 });
        expect(await service.getLessonCountByModuleId('sm1')).toBe(4);
        use({ count: null });
        expect(await service.getLessonCountByModuleId('sm1')).toBe(0);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getLessonCountByModuleId('sm1')).toBeRejectedWithError('boom');
    });

    it('invalidates a lesson', async () => {
        const stub = use({});
        await service.invalidateLesson('l1');
        expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ is_validated: null });
        use({ error: { message: 'boom' } });
        await expectAsync(service.invalidateLesson('l1')).toBeRejectedWithError('boom');
    });

    describe('validateLesson', () => {
        const questions = Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }));
        const goodAnswers = [{ is_correct: true }, { is_correct: false }, { is_correct: false }, { is_correct: false }];

        it('passes a complete LESSON', async () => {
            const stub = use({ count: 1 }, { count: 1 }, { data: [{ id: 'quiz' }] }, { data: questions }, ...questions.map(() => ({ data: goodAnswers })), {});
            expect(await service.validateLesson('l1', LessonType.LESSON)).toBeTrue();
            expect(stub.spy(stubCount(stub) - 1, 'update')).toHaveBeenCalledWith({ is_validated: true });
        });

        it('rejects a LESSON without content, extra material, a single quiz, 10 questions, or valid answers', async () => {
            const cases: any[][] = [
                [{ count: 0 }],
                [{ count: 1 }, { count: 0 }],
                [{ count: 1 }, { count: 1 }, { data: [] }],
                [{ count: 1 }, { count: 1 }, { data: [{ id: 'a' }, { id: 'b' }] }],
                [{ count: 1 }, { count: 1 }, { data: [{ id: 'a' }] }, { data: questions.slice(0, 9) }],
                [{ count: 1 }, { count: 1 }, { data: [{ id: 'a' }] }, { data: questions }, { data: goodAnswers.slice(0, 3) }],
                [{ count: 1 }, { count: 1 }, { data: [{ id: 'a' }] }, { data: questions }, { data: goodAnswers.map(a => ({ ...a, is_correct: true })) }],
            ];
            for (const results of cases) {
                use(...results, {});
                expect(await service.validateLesson('l1', LessonType.LESSON)).toBeFalse();
            }
        });

        it('validates a CHALLENGE by content, language and initial code', async () => {
            use({ count: 1 }, { data: { language: 'js', initial_code: 'x' } }, {});
            expect(await service.validateLesson('l1', LessonType.CHALLENGE)).toBeTrue();
            use({ count: 1 }, { data: { language: ' ', initial_code: 'x' } }, {});
            expect(await service.validateLesson('l1', LessonType.CHALLENGE)).toBeFalse();
            use({ count: 0 }, {});
            expect(await service.validateLesson('l1', LessonType.CHALLENGE)).toBeFalse();
            use({ count: 1 }, { data: null }, {});
            expect(await service.validateLesson('l1', LessonType.CHALLENGE)).toBeFalse();
        });

        it('validates a REVISION, creating the quiz when missing', async () => {
            use({ data: [{ id: 'q' }] }, {});
            expect(await service.validateLesson('l1', LessonType.REVISION)).toBeTrue();
            use({ data: [] }, {}, { data: [{ id: 'q' }] }, {});
            expect(await service.validateLesson('l1', LessonType.REVISION)).toBeTrue();
            use({ data: [{ id: 'a' }, { id: 'b' }] }, {});
            expect(await service.validateLesson('l1', LessonType.REVISION)).toBeFalse();
            use({ error: { message: 'x' } }, {});
            expect(await service.validateLesson('l1', LessonType.REVISION)).toBeFalse();
            use({ data: [] }, { error: { message: 'x' } }, {});
            expect(await service.validateLesson('l1', LessonType.REVISION)).toBeFalse();
        });

        it('gives up creating the REVISION quiz after 5 attempts', async () => {
            use({ data: [] });
            expect(await service.validateLesson('l1', LessonType.REVISION)).toBeFalse();
        });

        it('throws when saving the result fails', async () => {
            use({ error: { message: 'boom' } });
            await expectAsync(service.validateLesson('l1', 'OTHER' as LessonType)).toBeRejectedWithError('boom');
        });
    });
});

function stubCount(stub: { stubs: unknown[] }) {
    return stub.stubs.length;
}
