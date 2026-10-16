import { PublicCatalogSource, CurriculumRow, ShowcaseRow } from './public-catalog.source';
import snapshot from './public-catalog.snapshot.json';

interface PublicCatalogSnapshot {
    showcase: ShowcaseRow[];
    curriculum: CurriculumRow[];
    previews: Record<string, string>;
}

const data = snapshot as unknown as PublicCatalogSnapshot;

export const snapshotCatalogSource: PublicCatalogSource = {
    showcase: async () => data.showcase,
    curriculum: async () => data.curriculum,
    preview: async lessonId => data.previews[lessonId] ?? null,
};
