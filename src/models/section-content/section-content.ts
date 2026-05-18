import { Lesson } from "../lesson/lesson";
import { Question } from "../question/question";
import { Quiz } from "../quiz/quiz";
import { Module } from "../module/module";

export enum SectionContentType {
    TEXT = 'TEXT',
    MARKDOWN = 'MARKDOWN',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
}

export interface SectionContent {
    id: string;
    type: SectionContentType;
    content: string;
    file: string;
    fileDescription: string;
    order: number;
    lessonId?: string;
    lesson?: Lesson;
    questionId?: string;
    question?: Question;
    quiz?: Quiz;
    moduleId?: string;
    module?: Module;
}
