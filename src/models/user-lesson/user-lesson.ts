import { Lesson } from "../lesson/lesson";
import { User } from "../user/user";

export interface UserLesson {
    id: string;
    user: User;
    lesson: Lesson;
    completed: boolean;
    completedAt: Date;
}
