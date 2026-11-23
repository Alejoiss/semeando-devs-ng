export enum LessonType {
    LESSON = 'LESSON',
    CHALLENGE = 'CHALLENGE',
    REVISION = 'REVISION',
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    type: LessonType;
    order: number;
    moduleId: string;
    xp: number;
    language?: string;
    initialCode?: string;
    createdBy?: string;
    isValidated?: boolean | null;
}
