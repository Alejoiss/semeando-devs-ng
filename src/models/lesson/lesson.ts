export enum LessonType {
    LESSON = 'LESSON',
    CHALLENGE = 'CHALLENGE',
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    type: LessonType;
    order: number;
    subModuleId: string;
}
