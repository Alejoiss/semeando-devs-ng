import { Lesson } from "../lesson/lesson";

export interface Quiz {
    id: string;
    lessonId: string;
    lesson?: Lesson;
    spentTime: number;
    createdAt?: Date;
}
