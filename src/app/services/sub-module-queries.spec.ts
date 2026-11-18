import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { SubModuleService } from './sub-module';

describe('SubModuleService queries', () => {
    let service: SubModuleService;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };
    const fails = { error: { message: 'boom' } };

    beforeEach(() => {
        service = TestBed.inject(SubModuleService);
    });

    it('lists submodules by module slug and id', async () => {
        use({ data: [{ id: 's' }] });
        expect(await service.getSubModulesByModuleSlug('m')).toEqual([{ id: 's' }] as any);
        expect(await service.getSubModulesByModuleId('m')).toEqual([{ id: 's' }] as any);
        use(fails);
        await expectAsync(service.getSubModulesByModuleSlug('m')).toBeRejectedWithError('boom');
        await expectAsync(service.getSubModulesByModuleId('m')).toBeRejectedWithError('boom');
    });

    it('counts submodules', async () => {
        use({ count: 3 });
        expect(await service.getSubModuleCountByModuleId('m')).toBe(3);
        use({ count: null });
        expect(await service.getSubModuleCountByModuleId('m')).toBe(0);
        use(fails);
        await expectAsync(service.getSubModuleCountByModuleId('m')).toBeRejectedWithError('boom');
    });

    it('updates the order of every submodule', async () => {
        const stub = use({});
        await service.updateSubModuleOrder([{ id: 'a', order: 1 }, { id: 'b', order: 2 }]);
        expect(stub.client.from).toHaveBeenCalledTimes(2);
        use(fails);
        await expectAsync(service.updateSubModuleOrder([{ id: 'a', order: 1 }])).toBeRejectedWithError('boom');
    });

    it('creates a submodule with order 0 by default', async () => {
        const stub = use({ data: { id: 's' } });
        await service.createSubModule({ title: 'T', description: 'D', slug: 's', module_id: 'm' });
        expect(stub.spy(0, 'insert').calls.mostRecent().args[0].order).toBe(0);
        const ordered = use({ data: { id: 's' } });
        await service.createSubModule({ title: 'T', description: 'D', slug: 's', module_id: 'm', order: 4 });
        expect(ordered.spy(0, 'insert').calls.mostRecent().args[0].order).toBe(4);
        use(fails);
        await expectAsync(service.createSubModule({ title: '', description: '', slug: '', module_id: '' })).toBeRejectedWithError('boom');
    });

    it('updates a submodule', async () => {
        const stub = use({ data: { id: 's' } });
        await service.updateSubModule('s', { title: 'N' });
        expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ title: 'N' });
        use(fails);
        await expectAsync(service.updateSubModule('s', {})).toBeRejectedWithError('boom');
    });

    it('gets a submodule by id, null on any failure', async () => {
        use({ data: { id: 's' } });
        expect(await service.getSubModuleById('s')).toEqual({ id: 's' } as any);
        use(fails);
        expect(await service.getSubModuleById('s')).toBeNull();
        (service as any).supabase = { from: () => { throw new Error('down'); } };
        expect(await service.getSubModuleById('s')).toBeNull();
    });

    it('deletes a submodule', async () => {
        const stub = use({});
        await service.deleteSubModule('s');
        expect(stub.spy(0, 'eq')).toHaveBeenCalledWith('id', 's');
        use(fails);
        await expectAsync(service.deleteSubModule('s')).toBeRejectedWithError('boom');
    });

    describe('uploadSubModuleAvatar', () => {
        const withStorage = (error: unknown) => {
            const upload = jasmine.createSpy('upload').and.resolveTo({ error });
            (service as any).supabase = { storage: { from: () => ({ upload, getPublicUrl: () => ({ data: { publicUrl: 'http://img' } }) }) } };
            return upload;
        };

        it('rejects files over 2MB, uploads valid ones and surfaces upload errors', async () => {
            const upload = withStorage(null);
            await expectAsync(service.uploadSubModuleAvatar(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.png'))).toBeRejectedWithError('A imagem não pode ter mais de 2MB.');
            expect(upload).not.toHaveBeenCalled();
            expect(await service.uploadSubModuleAvatar(new File(['x'], 'a.png'))).toBe('http://img');
            withStorage({ message: 'boom' });
            await expectAsync(service.uploadSubModuleAvatar(new File(['x'], 'a.png'))).toBeRejectedWithError('boom');
        });
    });
});
