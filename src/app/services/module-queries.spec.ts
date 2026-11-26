import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { ModuleService } from './module';

describe('ModuleService queries', () => {
    let service: ModuleService;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };
    const fails = { error: { message: 'boom' } };

    beforeEach(() => {
        service = TestBed.inject(ModuleService);
    });

    it('lists modules by course slug and id', async () => {
        use({ data: [{ id: 's' }] });
        expect(await service.getModulesByCourseSlug('m')).toEqual([{ id: 's' }] as any);
        expect(await service.getModulesByCourseId('m')).toEqual([{ id: 's' }] as any);
        use(fails);
        await expectAsync(service.getModulesByCourseSlug('m')).toBeRejectedWithError('boom');
        await expectAsync(service.getModulesByCourseId('m')).toBeRejectedWithError('boom');
    });

    it('summarizes every module with its course and publication state', async () => {
        use({ data: [{ id: 's1', module_id: 'c1', published: true }, { id: 's2', module_id: 'c1', published: false }, { id: 's3', module_id: 'c2', published: null }] });
        expect(await service.getModuleSummaries()).toEqual([
            { id: 's1', courseId: 'c1', published: true },
            { id: 's2', courseId: 'c1', published: false },
            { id: 's3', courseId: 'c2', published: false },
        ]);
        use({ data: null });
        expect(await service.getModuleSummaries()).toEqual([]);
        use(fails);
        await expectAsync(service.getModuleSummaries()).toBeRejectedWithError('boom');
    });

    it('counts modules', async () => {
        use({ count: 3 });
        expect(await service.getModuleCountByCourseId('m')).toBe(3);
        use({ count: null });
        expect(await service.getModuleCountByCourseId('m')).toBe(0);
        use(fails);
        await expectAsync(service.getModuleCountByCourseId('m')).toBeRejectedWithError('boom');
    });

    it('updates the order of every module', async () => {
        const stub = use({});
        await service.updateModuleOrder([{ id: 'a', order: 1 }, { id: 'b', order: 2 }]);
        expect(stub.client.from).toHaveBeenCalledTimes(2);
        use(fails);
        await expectAsync(service.updateModuleOrder([{ id: 'a', order: 1 }])).toBeRejectedWithError('boom');
    });

    it('creates a module with order 0 by default', async () => {
        const stub = use({ data: { id: 's' } });
        await service.createModule({ title: 'T', description: 'D', slug: 's', module_id: 'm' });
        expect(stub.spy(0, 'insert').calls.mostRecent().args[0].order).toBe(0);
        const ordered = use({ data: { id: 's' } });
        await service.createModule({ title: 'T', description: 'D', slug: 's', module_id: 'm', order: 4 });
        expect(ordered.spy(0, 'insert').calls.mostRecent().args[0].order).toBe(4);
        use(fails);
        await expectAsync(service.createModule({ title: '', description: '', slug: '', module_id: '' })).toBeRejectedWithError('boom');
    });

    it('updates a module', async () => {
        const stub = use({ data: { id: 's' } });
        await service.updateModule('s', { title: 'N' });
        expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ title: 'N' });
        use(fails);
        await expectAsync(service.updateModule('s', {})).toBeRejectedWithError('boom');
    });

    it('publishes and unpublishes a module', async () => {
        const stub = use({ data: { id: 's', published: true } });
        expect(await service.setModulePublished('s', true)).toEqual({ id: 's', published: true } as any);
        expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ published: true });
        expect(stub.spy(0, 'eq')).toHaveBeenCalledWith('id', 's');
        const off = use({ data: { id: 's', published: false } });
        await service.setModulePublished('s', false);
        expect(off.spy(0, 'update')).toHaveBeenCalledWith({ published: false });
        use(fails);
        await expectAsync(service.setModulePublished('s', true)).toBeRejectedWithError('boom');
    });

    it('gets a module by id, null on any failure', async () => {
        use({ data: { id: 's' } });
        expect(await service.getModuleById('s')).toEqual({ id: 's' } as any);
        use(fails);
        expect(await service.getModuleById('s')).toBeNull();
        (service as any).supabase = { from: () => { throw new Error('down'); } };
        expect(await service.getModuleById('s')).toBeNull();
    });

    it('deletes a module', async () => {
        const stub = use({});
        await service.deleteModule('s');
        expect(stub.spy(0, 'eq')).toHaveBeenCalledWith('id', 's');
        use(fails);
        await expectAsync(service.deleteModule('s')).toBeRejectedWithError('boom');
    });

    describe('uploadModuleAvatar', () => {
        const withStorage = (error: unknown) => {
            const upload = jasmine.createSpy('upload').and.resolveTo({ error });
            (service as any).supabase = { storage: { from: () => ({ upload, getPublicUrl: () => ({ data: { publicUrl: 'http://img' } }) }) } };
            return upload;
        };

        it('rejects files over 2MB, uploads valid ones and surfaces upload errors', async () => {
            const upload = withStorage(null);
            await expectAsync(service.uploadModuleAvatar(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.png'))).toBeRejectedWithError('A imagem não pode ter mais de 2MB.');
            expect(upload).not.toHaveBeenCalled();
            expect(await service.uploadModuleAvatar(new File(['x'], 'a.png'))).toBe('http://img');
            withStorage({ message: 'boom' });
            await expectAsync(service.uploadModuleAvatar(new File(['x'], 'a.png'))).toBeRejectedWithError('boom');
        });
    });
});
