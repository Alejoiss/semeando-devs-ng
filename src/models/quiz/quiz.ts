import { Lesson } from "../../app/pages/app/lesson/lesson";

export interface Quiz {
    id: string;
    lesson: Lesson;
    spentTime: number;
}
