import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { ModuleService } from './module';

const row = { id: 'm1', title: 'T', in_revision: true };

describe('ModuleService queries', () => {
    let service: ModuleService;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };

    beforeEach(() => {
        service = TestBed.inject(ModuleService);
    });

    it('lists modules mapping in_revision', async () => {
        use({ data: [row] });
        expect((await service.getModules())[0].inRevision).toBeTrue();
        use({ data: null });
        expect(await service.getModules()).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getModules()).toBeRejectedWithError('boom');
    });

    it('lists modules for display', async () => {
        use({ data: [row] });
        expect((await service.getModulesForDisplay())[0].inRevision).toBeTrue();
        use({ data: null });
        expect(await service.getModulesForDisplay()).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getModulesForDisplay()).toBeRejectedWithError('boom');
    });

    it('gets a module by slug or id, returning null on any failure', async () => {
        use({ data: row });
        expect((await service.getModuleBySlug('s'))?.id).toBe('m1');
        use({ data: row });
        expect((await service.getModuleById('m1'))?.inRevision).toBeTrue();
        use({ error: { message: 'x' } });
        expect(await service.getModuleBySlug('s')).toBeNull();
        expect(await service.getModuleById('m1')).toBeNull();
        (service as any).supabase = { from: () => { throw new Error('down'); } };
        expect(await service.getModuleBySlug('s')).toBeNull();
        expect(await service.getModuleById('m1')).toBeNull();
    });

    it('gets the curriculum of published modules only', async () => {
        const stub = use({ data: [row] });
        expect(await service.getCurriculum()).toEqual([row]);
        expect(stub.spy(0, 'eq')).toHaveBeenCalledWith('in_revision', false);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getCurriculum()).toBeRejectedWithError('boom');
    });

    it('gets the modules of a teacher', async () => {
        use({ data: [{ module: row }] });
        expect((await service.getTeacherModules('t1'))[0].inRevision).toBeTrue();
        use({ data: null });
        expect(await service.getTeacherModules('t1')).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getTeacherModules('t1')).toBeRejectedWithError('boom');
    });

    it('creates a module in revision by default', async () => {
        const stub = use({ data: row });
        await service.createModule({ title: 'T', description: 'D', slug: 's', createdBy: 'u' });
        expect(stub.spy(0, 'insert').calls.mostRecent().args[0].in_revision).toBeTrue();
        const explicit = use({ data: row });
        await service.createModule({ title: 'T', description: 'D', slug: 's', createdBy: 'u', inRevision: false });
        expect(explicit.spy(0, 'insert').calls.mostRecent().args[0].in_revision).toBeFalse();
        use({ error: { message: 'boom' } });
        await expectAsync(service.createModule({ title: '', description: '', slug: '', createdBy: '' })).toBeRejectedWithError('boom');
    });

    describe('uploadModuleAvatar', () => {
        const file = (size: number) => new File([new Uint8Array(size)], 'a.png');
        const withStorage = (error: unknown) => {
            const upload = jasmine.createSpy('upload').and.resolveTo({ error });
            (service as any).supabase = {
                storage: { from: () => ({ upload, getPublicUrl: () => ({ data: { publicUrl: 'http://img' } }) }) },
            };
            return upload;
        };

        it('rejects files over 2MB without uploading', async () => {
            const upload = withStorage(null);
            await expectAsync(service.uploadModuleAvatar(file(2 * 1024 * 1024 + 1))).toBeRejectedWithError('A imagem não pode ter mais de 2MB.');
            expect(upload).not.toHaveBeenCalled();
        });

        it('uploads and returns the public url', async () => {
            withStorage(null);
            expect(await service.uploadModuleAvatar(file(10))).toBe('http://img');
        });

        it('throws when the upload fails', async () => {
            withStorage({ message: 'boom' });
            await expectAsync(service.uploadModuleAvatar(file(10))).toBeRejectedWithError('boom');
        });
    });

    it('assigns a teacher to a module', async () => {
        const stub = use({});
        await service.assignTeacherToModule('t', 'm');
        expect(stub.spy(0, 'insert')).toHaveBeenCalledWith({ teacher_id: 't', module_id: 'm' });
        use({ error: { message: 'boom' } });
        await expectAsync(service.assignTeacherToModule('t', 'm')).toBeRejectedWithError('boom');
    });

    it('updates only the provided module fields', async () => {
        const stub = use({ data: row });
        await service.updateModule('m1', { title: 'N', description: 'd', slug: 's', avatar: 'a', icon: 'i', inRevision: false });
        expect(stub.spy(0, 'update').calls.mostRecent().args[0]).toEqual({ title: 'N', description: 'd', slug: 's', avatar: 'a', icon: 'i', in_revision: false });
        const partial = use({ data: row });
        await service.updateModule('m1', { title: 'N' });
        expect(partial.spy(0, 'update').calls.mostRecent().args[0]).toEqual({ title: 'N' });
        use({ error: { message: 'boom' } });
        await expectAsync(service.updateModule('m1', {})).toBeRejectedWithError('boom');
    });

    describe('checkAllLessonsValidated', () => {
        it('is false when submodules cannot be read', async () => {
            use({ error: { message: 'x' } });
            expect(await service.checkAllLessonsValidated('m')).toBeFalse();
            use({ data: null });
            expect(await service.checkAllLessonsValidated('m')).toBeFalse();
        });

        it('is true for a module without submodules or without lessons', async () => {
            use({ data: [] });
            expect(await service.checkAllLessonsValidated('m')).toBeTrue();
            use({ data: [{ id: 's' }] }, { data: [] });
            expect(await service.checkAllLessonsValidated('m')).toBeTrue();
            use({ data: [{ id: 's' }] }, { data: null });
            expect(await service.checkAllLessonsValidated('m')).toBeTrue();
        });

        it('is false when lessons cannot be read', async () => {
            use({ data: [{ id: 's' }] }, { error: { message: 'x' } });
            expect(await service.checkAllLessonsValidated('m')).toBeFalse();
        });

        it('requires every non-revision lesson to be validated', async () => {
            use({ data: [{ id: 's' }] }, { data: [{ is_validated: true }, { is_validated: true }] });
            expect(await service.checkAllLessonsValidated('m')).toBeTrue();
            use({ data: [{ id: 's' }] }, { data: [{ is_validated: true }, { is_validated: null }] });
            expect(await service.checkAllLessonsValidated('m')).toBeFalse();
        });
    });

    it('updates module availability as the inverse of in_revision', async () => {
        const stub = use({});
        await service.updateModuleAvailability('m', true);
        expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ in_revision: false });
        use({ error: { message: 'boom' } });
        await expectAsync(service.updateModuleAvailability('m', true)).toBeRejectedWithError('boom');
    });
});
