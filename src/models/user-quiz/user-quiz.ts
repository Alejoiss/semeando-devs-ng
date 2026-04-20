import { Quiz } from "../quiz/quiz";
import { User } from "../user/user";

export interface UserQuiz {
    id: string;
    userId: string;
    user?: User;
    quizId: string;
    quiz?: Quiz;
    lessonId?: string;
    score: number;
    spentTime: number;
    completed: boolean;
    completedAt: Date | null;
    totalQuestions?: number;
    createdAt?: Date;
}
