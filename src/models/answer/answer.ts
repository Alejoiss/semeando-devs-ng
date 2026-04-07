import { Question } from "../question/question";

export interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
    question: Question;
}
