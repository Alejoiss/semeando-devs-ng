import { Answer } from "../answer/answer";
import { Question } from "../question/question";
import { User } from "../user/user";

export interface UserQuestion {
    id: string;
    userId: string;
    user?: User;
    questionId: string;
    question?: Question;
    answerId: string | null;
    answer?: Answer;
    isCorrect: boolean;
    answeredAt: Date | null;
}
