import { Lesson } from "../lesson/lesson";
import { User } from "../user/user";

export interface UserLesson {
    id: string;
    user: User;
    lesson: Lesson;
    completed: boolean;
    completedAt: Date;
    savedCode?: string;
    submittedCode?: string;
    aiFeedback?: string;
}
