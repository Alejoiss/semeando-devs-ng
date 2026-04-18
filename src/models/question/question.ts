import { Quiz } from "../quiz/quiz";
import { SectionContent } from "../section-content/section-content";

export interface Question {
    id: string;
    quizId: string;
    quiz?: Quiz;
    sectionContents?: SectionContent[] | null;
    createdAt?: Date;
}
