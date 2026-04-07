import { Lesson } from "../../app/pages/app/lesson/lesson";

export interface Quiz {
    id: string;
    xp: number;
    lesson: Lesson;
    spentTime: number;
}
