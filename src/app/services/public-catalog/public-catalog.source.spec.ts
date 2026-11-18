import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../supabase';
import { createQueryStub, StubResult } from '../../../testing/query-stub';
import {
    CURRICULUM_SELECT,
    PUBLIC_CATALOG_SOURCE,
    PublicCatalogSource,
    SHOWCASE_SELECT,
    toPublicSection,
} from './public-catalog.source';
import { SectionContentType } from '../../../models/section-content/section-content';

describe('public catalog source', () => {
    describe('toPublicSection', () => {
        it('maps the snake_case row to the public section shape', () => {
            expect(
                toPublicSection({
                    lesson_id: 'l1',
                    id: 's1',
                    type: SectionContentType.MARKDOWN,
                    content: 'texto',
                    file: 'a.png',
                    file_description: 'legenda',
                }),
            ).toEqual({ id: 's1', type: SectionContentType.MARKDOWN, content: 'texto', file: 'a.png', fileDescription: 'legenda' });
        });
    });

    describe('Supabase source', () => {
        let source: PublicCatalogSource;
        let fromSpy: jasmine.Spy;
        let rpcSpy: jasmine.Spy;

        function respondWith(result: StubResult) {
            const stub = createQueryStub(result);
            fromSpy.and.returnValue(stub.query);
            return stub;
        }

        beforeEach(() => {
            fromSpy = jasmine.createSpy('from');
            rpcSpy = jasmine.createSpy('rpc');
            TestBed.configureTestingModule({
                providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy, rpc: rpcSpy } } }],
            });
            source = TestBed.inject(PUBLIC_CATALOG_SOURCE);
        });

        it('lists the showcase modules', async () => {
            const stub = respondWith({ data: [{ id: 'm1' }] });

            expect(await source.showcase()).toEqual([{ id: 'm1' }] as any);
            expect(fromSpy).toHaveBeenCalledWith('modules');
            expect(stub.spy('select')).toHaveBeenCalledWith(SHOWCASE_SELECT);
        });

        it('returns an empty showcase when there is no data and throws on error', async () => {
            respondWith({ data: null });
            expect(await source.showcase()).toEqual([]);

            respondWith({ error: { message: 'boom' } });
            await expectAsync(source.showcase()).toBeRejectedWithError('boom');
        });

        it('lists the curriculum of modules that are not in revision, ordered by submodule and lesson', async () => {
            const stub = respondWith({ data: [{ id: 'm1', submodules: [] }] });

            await source.curriculum();

            expect(stub.spy('select')).toHaveBeenCalledWith(CURRICULUM_SELECT);
            expect(stub.spy('eq')).toHaveBeenCalledWith('in_revision', false);
            expect(stub.spy('order').calls.allArgs()).toEqual([
                ['order', { foreignTable: 'submodules', ascending: true }],
                ['order', { foreignTable: 'submodules.lessons', ascending: true }],
            ]);
        });

        it('returns an empty curriculum when there is no data and throws on error', async () => {
            respondWith({ data: null });
            expect(await source.curriculum()).toEqual([]);

            respondWith({ error: { message: 'boom' } });
            await expectAsync(source.curriculum()).toBeRejectedWithError('boom');
        });

        it('returns the first preview row of a lesson', async () => {
            rpcSpy.and.resolveTo({ data: [{ lesson_id: 'l1', preview: 'Resumo' }], error: null });

            expect(await source.preview('l1')).toBe('Resumo');
            expect(rpcSpy).toHaveBeenCalledWith('get_lesson_previews', { p_lesson_id: 'l1' });
        });

        it('returns null when the lesson has no preview', async () => {
            rpcSpy.and.resolveTo({ data: [], error: null });
            expect(await source.preview('l1')).toBeNull();

            rpcSpy.and.resolveTo({ data: null, error: null });
            expect(await source.preview('l1')).toBeNull();
        });

        it('throws when the preview rpc fails', async () => {
            rpcSpy.and.resolveTo({ data: null, error: { message: 'boom' } });
            await expectAsync(source.preview('l1')).toBeRejectedWithError('boom');
        });

        it('maps the sections of a free lesson', async () => {
            rpcSpy.and.resolveTo({
                data: [{ lesson_id: 'l1', id: 's1', type: SectionContentType.MARKDOWN, content: 'x', file: null, file_description: null }],
                error: null,
            });

            expect(await source.freeSections('l1')).toEqual([
                { id: 's1', type: SectionContentType.MARKDOWN, content: 'x', file: null, fileDescription: null },
            ]);
            expect(rpcSpy).toHaveBeenCalledWith('get_free_lesson_sections', { p_lesson_id: 'l1' });
        });

        it('returns no sections when there is no data and throws on error', async () => {
            rpcSpy.and.resolveTo({ data: null, error: null });
            expect(await source.freeSections('l1')).toEqual([]);

            rpcSpy.and.resolveTo({ data: null, error: { message: 'boom' } });
            await expectAsync(source.freeSections('l1')).toBeRejectedWithError('boom');
        });
    });
});
