import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { LessonService } from './lesson';
import { QuestionService } from './question';
import { QuizService } from './quiz';

const quizRow = { id: 'q1', lesson_id: 'l1', spent_time: 3, created_at: '2026-01-01T00:00:00Z' };

describe('QuizService queries', () => {
    let service: QuizService;
    let lessons: jasmine.SpyObj<LessonService>;
    let questions: jasmine.SpyObj<QuestionService>;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };

    beforeEach(() => {
        lessons = jasmine.createSpyObj('LessonService', ['getLessonById']);
        questions = jasmine.createSpyObj('QuestionService', ['getQuestionsByQuizId']);
        TestBed.configureTestingModule({
            providers: [{ provide: LessonService, useValue: lessons }, { provide: QuestionService, useValue: questions }],
        });
        service = TestBed.inject(QuizService);
    });

    it('gets a quiz by lesson, null when absent, throws on real errors', async () => {
        use({ data: quizRow });
        expect(await service.getQuizByLessonId('l1')).toEqual(jasmine.objectContaining({ id: 'q1', lessonId: 'l1', spentTime: 3 }));
        use({ data: null, error: { code: 'PGRST116', message: 'none' } });
        expect(await service.getQuizByLessonId('l1')).toBeNull();
        use({ data: null, error: { code: 'X', message: 'boom' } });
        await expectAsync(service.getQuizByLessonId('l1')).toBeRejectedWithError('boom');
    });

    it('reuses the existing quiz or creates one', async () => {
        const reuse = use({ data: quizRow });
        expect((await service.getOrCreateQuiz('l1')).id).toBe('q1');
        expect(reuse.client.from).toHaveBeenCalledTimes(1);

        const create = use({ data: null, error: { code: 'PGRST116', message: '' } }, { data: quizRow });
        expect((await service.getOrCreateQuiz('l1')).id).toBe('q1');
        expect(create.spy(1, 'insert')).toHaveBeenCalledWith({ lesson_id: 'l1' });

        use({ data: null, error: { code: 'PGRST116', message: '' } }, { error: { message: 'boom' } });
        await expectAsync(service.getOrCreateQuiz('l1')).toBeRejectedWithError('boom');
    });

    describe('saveQuestion', () => {
        const input = {
            id: 'qq', statement: 'S', sectionContent: { id: 'sc' },
            answers: [{ id: 'a1', text: 'A', isCorrect: true, justification: 'J' }, { text: 'B', reason: 'R' }],
        };

        it('upserts question, statement and answers and returns the saved shape', async () => {
            const stub = use({ data: { id: 'qq' } }, { data: { id: 'sc', content: 'S' } }, {});
            const saved = await service.saveQuestion('q1', input);
            expect(stub.spy(0, 'upsert')).toHaveBeenCalledWith({ id: 'qq', quiz_id: 'q1' });
            expect(saved.statement).toBe('S');
            expect(saved.answers[0]).toEqual({ id: 'a1', text: 'A', justification: 'J', isCorrect: true });
            expect(saved.answers[1].justification).toBe('R');
            expect(saved.answers[1].isCorrect).toBeFalse();
            expect(saved.answers[1].id).toBeTruthy();
        });

        it('creates the question without id and tolerates missing fields', async () => {
            const stub = use({ data: { id: 'new' } }, { data: { id: 's' } }, {});
            const saved = await service.saveQuestion('q1', { answers: [{}] });
            expect(stub.spy(0, 'upsert')).toHaveBeenCalledWith({ quiz_id: 'q1' });
            expect(saved.statement).toBe('');
            expect(saved.answers[0].text).toBe('');
        });

        it('stops at the first failing step', async () => {
            use({ error: { message: 'q' } });
            await expectAsync(service.saveQuestion('q1', input)).toBeRejectedWithError('q');
            use({ data: { id: 'qq' } }, { error: { message: 'sc' } });
            await expectAsync(service.saveQuestion('q1', input)).toBeRejectedWithError('sc');
            use({ data: { id: 'qq' } }, { data: { id: 'sc' } }, { error: { message: 'ans' } });
            await expectAsync(service.saveQuestion('q1', input)).toBeRejectedWithError('ans');
        });
    });

    describe('getRevisionQuestions', () => {
        it('is empty when the lesson does not exist', async () => {
            lessons.getLessonById.and.resolveTo(null);
            expect(await service.getRevisionQuestions('l', 's')).toEqual([]);
        });

        it('is empty when no earlier lessons or quizzes exist', async () => {
            lessons.getLessonById.and.resolveTo({ order: 1 } as any);
            use({ data: [{ id: 'x', order: 2 }] });
            expect(await service.getRevisionQuestions('l', 's')).toEqual([]);
            use({ data: null });
            expect(await service.getRevisionQuestions('l', 's')).toEqual([]);
            use({ data: [{ id: 'a', order: 0 }] }, { data: [] });
            expect(await service.getRevisionQuestions('l', 's')).toEqual([]);
            use({ data: [{ id: 'a', order: 0 }] }, { data: null });
            expect(await service.getRevisionQuestions('l', 's')).toEqual([]);
        });

        it('collects questions from earlier lessons, shuffled and capped at 10', async () => {
            lessons.getLessonById.and.resolveTo({ order: 5 } as any);
            use({ data: [{ id: 'a', order: 1 }, { id: 'b', order: 2 }, { id: 'c', order: 9 }] }, { data: [{ id: 'q1' }, { id: 'q2' }] });
            questions.getQuestionsByQuizId.and.callFake(async (id: string) => Array.from({ length: 8 }, (_, i) => ({ id: `${id}-${i}` }) as any));
            const result = await service.getRevisionQuestions('l', 's');
            expect(result.length).toBe(10);
            expect(new Set(result.map(q => q.id)).size).toBe(10);
        });

        it('throws when reading lessons or quizzes fails', async () => {
            lessons.getLessonById.and.resolveTo({ order: 5 } as any);
            use({ error: { message: 'l' } });
            await expectAsync(service.getRevisionQuestions('l', 's')).toBeRejectedWithError('l');
            use({ data: [{ id: 'a', order: 1 }] }, { error: { message: 'q' } });
            await expectAsync(service.getRevisionQuestions('l', 's')).toBeRejectedWithError('q');
        });
    });

    describe('completeQuiz', () => {
        const withClient = (session: unknown, result: unknown) => {
            const invoke = jasmine.createSpy('invoke').and.resolveTo(result);
            (service as any).supabase = {
                auth: { getSession: () => Promise.resolve({ data: { session } }) },
                functions: { invoke },
            };
            return invoke;
        };

        it('requires an active session', async () => {
            withClient(null, {});
            await expectAsync(service.completeQuiz(null, 'l', 1, 2, 3)).toBeRejectedWithError('No active session found');
        });

        it('maps the edge function completion flags to the module/course vocabulary', async () => {
            withClient({ access_token: 'tok' }, { data: { xp: 5, subModuleCompleted: true, moduleCompleted: false }, error: null });
            expect(await service.completeQuiz('a', 'l', 1, 2, 3)).toEqual({ xp: 5, moduleCompleted: true, courseCompleted: false });
        });

        it('invokes complete-quiz with the bearer token', async () => {
            const invoke = withClient({ access_token: 'tok' }, { data: { xp: 5 }, error: null });
            expect(await service.completeQuiz('a', 'l', 1, 2, 3)).toEqual({ xp: 5 });
            expect(invoke).toHaveBeenCalledWith('complete-quiz', {
                body: { attemptId: 'a', lessonId: 'l', correctCount: 1, totalCount: 2, spentTime: 3 },
                headers: { Authorization: 'Bearer tok' },
            });
        });

        it('throws the function error, with a fallback message', async () => {
            withClient({ access_token: 't' }, { data: null, error: { message: 'bad' } });
            await expectAsync(service.completeQuiz(null, 'l', 1, 2, 3)).toBeRejectedWithError('bad');
            withClient({ access_token: 't' }, { data: null, error: {} });
            await expectAsync(service.completeQuiz(null, 'l', 1, 2, 3)).toBeRejectedWithError('Error completing quiz');
        });
    });
});
