import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { CourseService } from './course';

const row = { id: 'm1', title: 'T', in_revision: true };

describe('CourseService queries', () => {
    let service: CourseService;
    const use = (...results: any[]) => {
        const stub = createClientStub(...results);
        (service as any).supabase = stub.client;
        return stub;
    };

    beforeEach(() => {
        service = TestBed.inject(CourseService);
    });

    it('lists courses mapping in_revision', async () => {
        use({ data: [row] });
        expect((await service.getCourses())[0].inRevision).toBeTrue();
        use({ data: null });
        expect(await service.getCourses()).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getCourses()).toBeRejectedWithError('boom');
    });

    it('lists courses for display', async () => {
        use({ data: [row] });
        expect((await service.getCoursesForDisplay())[0].inRevision).toBeTrue();
        use({ data: null });
        expect(await service.getCoursesForDisplay()).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getCoursesForDisplay()).toBeRejectedWithError('boom');
    });

    it('gets a course by slug or id, returning null on any failure', async () => {
        use({ data: row });
        expect((await service.getCourseBySlug('s'))?.id).toBe('m1');
        use({ data: row });
        expect((await service.getCourseById('m1'))?.inRevision).toBeTrue();
        use({ error: { message: 'x' } });
        expect(await service.getCourseBySlug('s')).toBeNull();
        expect(await service.getCourseById('m1')).toBeNull();
        (service as any).supabase = { from: () => { throw new Error('down'); } };
        expect(await service.getCourseBySlug('s')).toBeNull();
        expect(await service.getCourseById('m1')).toBeNull();
    });

    it('gets the curriculum of published courses only', async () => {
        const stub = use({ data: [{ ...row, submodules: [{ id: 's1', lessons: [] }] }, { ...row, id: 'm2', submodules: null }] });
        expect(await service.getCurriculum()).toEqual([
            { ...row, modules: [{ id: 's1', lessons: [] }] },
            { ...row, id: 'm2', modules: [] },
        ]);
        expect(stub.spy(0, 'eq')).toHaveBeenCalledWith('in_revision', false);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getCurriculum()).toBeRejectedWithError('boom');
    });

    it('gets the courses of a teacher', async () => {
        use({ data: [{ course: row }] });
        expect((await service.getTeacherCourses('t1'))[0].inRevision).toBeTrue();
        use({ data: null });
        expect(await service.getTeacherCourses('t1')).toEqual([]);
        use({ error: { message: 'boom' } });
        await expectAsync(service.getTeacherCourses('t1')).toBeRejectedWithError('boom');
    });

    it('creates a course in revision by default', async () => {
        const stub = use({ data: row });
        await service.createCourse({ title: 'T', description: 'D', slug: 's', createdBy: 'u' });
        expect(stub.spy(0, 'insert').calls.mostRecent().args[0].in_revision).toBeTrue();
        const explicit = use({ data: row });
        await service.createCourse({ title: 'T', description: 'D', slug: 's', createdBy: 'u', inRevision: false });
        expect(explicit.spy(0, 'insert').calls.mostRecent().args[0].in_revision).toBeFalse();
        use({ error: { message: 'boom' } });
        await expectAsync(service.createCourse({ title: '', description: '', slug: '', createdBy: '' })).toBeRejectedWithError('boom');
    });

    describe('uploadCourseAvatar', () => {
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
            await expectAsync(service.uploadCourseAvatar(file(2 * 1024 * 1024 + 1))).toBeRejectedWithError('A imagem não pode ter mais de 2MB.');
            expect(upload).not.toHaveBeenCalled();
        });

        it('uploads and returns the public url', async () => {
            withStorage(null);
            expect(await service.uploadCourseAvatar(file(10))).toBe('http://img');
        });

        it('throws when the upload fails', async () => {
            withStorage({ message: 'boom' });
            await expectAsync(service.uploadCourseAvatar(file(10))).toBeRejectedWithError('boom');
        });
    });

    it('assigns a teacher to a course', async () => {
        const stub = use({});
        await service.assignTeacherToCourse('t', 'm');
        expect(stub.spy(0, 'insert')).toHaveBeenCalledWith({ teacher_id: 't', module_id: 'm' });
        use({ error: { message: 'boom' } });
        await expectAsync(service.assignTeacherToCourse('t', 'm')).toBeRejectedWithError('boom');
    });

    it('updates only the provided course fields', async () => {
        const stub = use({ data: row });
        await service.updateCourse('m1', { title: 'N', description: 'd', slug: 's', avatar: 'a', icon: 'i', inRevision: false });
        expect(stub.spy(0, 'update').calls.mostRecent().args[0]).toEqual({ title: 'N', description: 'd', slug: 's', avatar: 'a', icon: 'i', in_revision: false });
        const partial = use({ data: row });
        await service.updateCourse('m1', { title: 'N' });
        expect(partial.spy(0, 'update').calls.mostRecent().args[0]).toEqual({ title: 'N' });
        use({ error: { message: 'boom' } });
        await expectAsync(service.updateCourse('m1', {})).toBeRejectedWithError('boom');
    });

    describe('checkAllLessonsValidated', () => {
        it('is false when modules cannot be read', async () => {
            use({ error: { message: 'x' } });
            expect(await service.checkAllLessonsValidated('m')).toBeFalse();
            use({ data: null });
            expect(await service.checkAllLessonsValidated('m')).toBeFalse();
        });

        it('is true for a course without modules or without lessons', async () => {
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

    it('updates course availability as the inverse of in_revision', async () => {
        const stub = use({});
        await service.updateCourseAvailability('m', true);
        expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ in_revision: false });
        use({ error: { message: 'boom' } });
        await expectAsync(service.updateCourseAvailability('m', true)).toBeRejectedWithError('boom');
    });
});
