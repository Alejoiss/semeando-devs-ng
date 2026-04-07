import { Quiz } from "../quiz/quiz";
import { User } from "../user/user";

export interface UserQuiz {
    id: string;
    user: User;
    quiz: Quiz;
    startedAt: Date;
    completed: boolean;
    completedAt: Date;
    score: number;
}
