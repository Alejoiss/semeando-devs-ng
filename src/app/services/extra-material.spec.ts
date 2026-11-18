import { TestBed } from '@angular/core/testing';
import { ExtraMaterialService } from './extra-material';
import { SupabaseService } from './supabase';
import { createQueryStub, StubResult } from '../../testing/query-stub';

describe('ExtraMaterialService', () => {
    let service: ExtraMaterialService;
    let fromSpy: jasmine.Spy;

    function respondWith(result: StubResult) {
        const stub = createQueryStub(result);
        fromSpy.and.returnValue(stub.query);
        return stub;
    }

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy } } }],
        });
        service = TestBed.inject(ExtraMaterialService);
    });

    describe('getExtraMaterialsByLessonId', () => {
        it('lists the lesson materials oldest first', async () => {
            const stub = respondWith({ data: [{ id: 'm1' }] });

            expect(await service.getExtraMaterialsByLessonId('l1')).toEqual([{ id: 'm1' }] as any);
            expect(fromSpy).toHaveBeenCalledWith('extra_material');
            expect(stub.spy('eq')).toHaveBeenCalledWith('lesson_id', 'l1');
            expect(stub.spy('order')).toHaveBeenCalledWith('created_at', { ascending: true });
        });

        it('returns an empty list when there is no data', async () => {
            respondWith({ data: null });
            expect(await service.getExtraMaterialsByLessonId('l1')).toEqual([]);
        });

        it('throws the query error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.getExtraMaterialsByLessonId('l1')).toBeRejectedWithError('boom');
        });
    });

    describe('upsertExtraMaterials', () => {
        it('does nothing for an empty list', async () => {
            await service.upsertExtraMaterials('l1', []);
            expect(fromSpy).not.toHaveBeenCalled();
        });

        it('upserts with lesson id, default type URL, null file and generated ids', async () => {
            const stub = respondWith({});
            spyOn(crypto, 'randomUUID').and.returnValue('uuid-1' as `${string}-${string}-${string}-${string}-${string}`);

            await service.upsertExtraMaterials('l1', [
                { id: 'm1', title: 'Doc', type: 'FILE' as any, url: 'u', file: 'f.pdf' as any },
                { title: 'Link', url: 'https://x.dev' },
            ]);

            expect(stub.spy('upsert')).toHaveBeenCalledWith([
                { id: 'm1', lesson_id: 'l1', title: 'Doc', type: 'FILE', url: 'u', file: 'f.pdf' },
                { id: 'uuid-1', lesson_id: 'l1', title: 'Link', type: 'URL', url: 'https://x.dev', file: null },
            ]);
        });

        it('throws the upsert error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.upsertExtraMaterials('l1', [{ title: 't' }])).toBeRejectedWithError('boom');
        });
    });

    describe('deleteExtraMaterials', () => {
        it('does nothing for an empty list', async () => {
            await service.deleteExtraMaterials([]);
            expect(fromSpy).not.toHaveBeenCalled();
        });

        it('deletes by ids', async () => {
            const stub = respondWith({});
            await service.deleteExtraMaterials(['a', 'b']);
            expect(stub.spy('delete')).toHaveBeenCalled();
            expect(stub.spy('in')).toHaveBeenCalledWith('id', ['a', 'b']);
        });

        it('throws the delete error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.deleteExtraMaterials(['a'])).toBeRejectedWithError('boom');
        });
    });
});
