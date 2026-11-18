import { snapshotCatalogSource } from './public-catalog.snapshot-source';

describe('snapshotCatalogSource', () => {
    it('serves the showcase and the curriculum from the generated snapshot', async () => {
        expect(Array.isArray(await snapshotCatalogSource.showcase())).toBeTrue();
        expect(Array.isArray(await snapshotCatalogSource.curriculum())).toBeTrue();
    });

    it('returns null for a lesson without preview', async () => {
        expect(await snapshotCatalogSource.preview('lesson-that-does-not-exist')).toBeNull();
    });

    it('returns no sections for a lesson that is not free', async () => {
        expect(await snapshotCatalogSource.freeSections('lesson-that-does-not-exist')).toEqual([]);
    });
});
