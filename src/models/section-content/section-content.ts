export enum SectionContentType {
    TEXT = 'TEXT',
    MARKDOWN = 'MARKDOWN',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
}

export interface SectionContent {
    id: string;
    type: SectionContentType;
    content: string;
    file: string;
    fileDescription: string;
    order: number;
}
