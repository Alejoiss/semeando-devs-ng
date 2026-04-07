import { Answer } from "../answer/answer";
import { User } from "../user/user";

export interface UserQuestion {
    id: string;
    user: User;
    answer: Answer;
    isCorrect: boolean;
    answeredAt: Date;
}
