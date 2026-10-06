import { PublicCatalogSource, CurriculumRow, PublicSection, ShowcaseRow } from './public-catalog.source';
import snapshot from './public-catalog.snapshot.json';

interface PublicCatalogSnapshot {
    showcase: ShowcaseRow[];
    curriculum: CurriculumRow[];
    sections: Record<string, PublicSection[]>;
}

const data = snapshot as unknown as PublicCatalogSnapshot;

export const snapshotCatalogSource: PublicCatalogSource = {
    showcase: async () => data.showcase,
    curriculum: async () => data.curriculum,
    sections: async lessonId => data.sections[lessonId] ?? [],
};
