import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { SectionContentService } from './section-content';

describe('SectionContentService queries', () => {
    let service: SectionContentService;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };
    const fails = { error: { message: 'boom' } };
    const content = [{ id: 'c', type: 'MARKDOWN', content: 'x', file: null, fileDescription: 'd', order: 1 }] as any;

    beforeEach(() => {
        service = TestBed.inject(SectionContentService);
    });

    it('reads contents by lesson and by module', async () => {
        use({ data: [{ id: 'c' }] });
        expect((await service.getSectionContentsByLessonId('l')).length).toBe(1);
        expect((await service.getSectionContentsByModuleId('m')).length).toBe(1);
        use({ data: null });
        expect(await service.getSectionContentsByLessonId('l')).toEqual([]);
        expect(await service.getSectionContentsByModuleId('m')).toEqual([]);
        use(fails);
        await expectAsync(service.getSectionContentsByLessonId('l')).toBeRejectedWithError('boom');
        await expectAsync(service.getSectionContentsByModuleId('m')).toBeRejectedWithError('boom');
    });

    it('upserts contents with snake_case columns, skipping empty lists', async () => {
        const stub = use({});
        await service.upsertSectionContents('l', []);
        await service.upsertSectionContentsForModule('m', []);
        expect(stub.client.from).not.toHaveBeenCalled();
        await service.upsertSectionContents('l', content);
        expect(stub.spy(0, 'upsert')).toHaveBeenCalledWith([{ id: 'c', lesson_id: 'l', type: 'MARKDOWN', content: 'x', file: null, file_description: 'd', order: 1 }]);
        await service.upsertSectionContentsForModule('m', content);
        expect(stub.spy(1, 'upsert').calls.mostRecent().args[0][0].module_id).toBe('m');
        use(fails);
        await expectAsync(service.upsertSectionContents('l', content)).toBeRejectedWithError('boom');
        await expectAsync(service.upsertSectionContentsForModule('m', content)).toBeRejectedWithError('boom');
    });

    it('deletes contents by id, skipping empty lists', async () => {
        const stub = use({});
        await service.deleteSectionContents([]);
        expect(stub.client.from).not.toHaveBeenCalled();
        await service.deleteSectionContents(['a']);
        expect(stub.spy(0, 'in')).toHaveBeenCalledWith('id', ['a']);
        use(fails);
        await expectAsync(service.deleteSectionContents(['a'])).toBeRejectedWithError('boom');
    });

    describe('uploadLessonImage', () => {
        const withStorage = (error: unknown) => {
            const upload = jasmine.createSpy('upload').and.resolveTo({ error });
            (service as any).supabase = { storage: { from: () => ({ upload, getPublicUrl: () => ({ data: { publicUrl: 'http://img' } }) }) } };
            return upload;
        };

        it('rejects files over 5MB, uploads valid ones and surfaces upload errors', async () => {
            const upload = withStorage(null);
            await expectAsync(service.uploadLessonImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.png'))).toBeRejectedWithError('A imagem não pode ter mais de 5MB.');
            expect(upload).not.toHaveBeenCalled();
            expect(await service.uploadLessonImage(new File(['x'], 'a.png'))).toBe('http://img');
            withStorage({ message: 'boom' });
            await expectAsync(service.uploadLessonImage(new File(['x'], 'a.png'))).toBeRejectedWithError('boom');
        });
    });

    describe('evaluateLessonContent', () => {
        const withClient = (session: unknown, result: unknown) => {
            const invoke = jasmine.createSpy('invoke').and.resolveTo(result);
            (service as any).supabase = { auth: { getSession: () => Promise.resolve({ data: { session } }) }, functions: { invoke } };
            return invoke;
        };

        it('requires a session, sends the bearer token and returns the feedback', async () => {
            withClient(null, {});
            await expectAsync(service.evaluateLessonContent('l', 't', 'd', [])).toBeRejectedWithError('Sessão ativa não encontrada');
            const invoke = withClient({ access_token: 'tok' }, { data: { aiFeedback: 'ok' }, error: null });
            expect(await service.evaluateLessonContent('l', 't', 'd', ['m'])).toEqual({ aiFeedback: 'ok' });
            expect(invoke.calls.mostRecent().args[1].headers.Authorization).toBe('Bearer tok');
        });

        it('throws the function error with a fallback', async () => {
            withClient({ access_token: 't' }, { data: null, error: { message: 'bad' } });
            await expectAsync(service.evaluateLessonContent('l', 't', 'd', [])).toBeRejectedWithError('bad');
            withClient({ access_token: 't' }, { data: null, error: {} });
            await expectAsync(service.evaluateLessonContent('l', 't', 'd', [])).toBeRejectedWithError('Erro ao avaliar o conteúdo da lição');
        });
    });
});
