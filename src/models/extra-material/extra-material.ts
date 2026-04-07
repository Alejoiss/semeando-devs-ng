import { Lesson } from "../../app/pages/app/lesson/lesson";

export enum ExtraMaterialType {
    URL = 'URL',
    FILE = 'FILE',
}

export interface ExtraMaterial {
    id: string;
    title: string;
    type: ExtraMaterialType;
    url: string;
    file: string;
    lesson: Lesson;
}
