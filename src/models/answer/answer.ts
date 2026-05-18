import { Question } from "../question/question";

export interface Answer {
    id: string;
    questionId: string;
    question?: Question;
    text: string;
    isCorrect?: boolean;
    reason?: string;
    createdAt?: Date;
}
