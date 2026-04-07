import { Quiz } from "../quiz/quiz";

export interface Question {
    id: string;
    question: string;
    questionMarkdown?: string;
    image?: string;
    quiz: Quiz;
}
