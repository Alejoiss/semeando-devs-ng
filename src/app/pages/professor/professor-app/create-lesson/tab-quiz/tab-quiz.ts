import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { QuizService } from '../../../../../services/quiz';
import { Quiz } from '../../../../../../models/quiz/quiz';
import { Question } from '../../../../../../models/question/question';
import { SectionContentType } from '../../../../../../models/section-content/section-content';
import { Answer } from '../../../../../../models/answer/answer';
import { QuestionService } from '../../../../../services/question';
import { AnswerService } from '../../../../../services/answer';
import { CodeEditorModule, CodeModel } from '@ngstack/code-editor';
import { MarkdownModule } from 'ngx-markdown';
import { CommonModule } from '@angular/common';

interface QuestionFormState {
    id: string | null;
    statement: string;
    answers: { id: string | null; text: string; justification: string; isCorrect: boolean }[];
    sectionContent: any;
    isSaving: boolean;
    showSuccess: boolean;
    errorMessage: string | null;
}

@Component({
  selector: 'app-tab-quiz',
  standalone: true,
  imports: [ReactiveFormsModule, CodeEditorModule, MarkdownModule, CommonModule],
  templateUrl: './tab-quiz.html',
  styleUrl: './tab-quiz.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabQuiz {
    lessonId = input<string | null>(null);

    private quizService = inject(QuizService);
    private questionService = inject(QuestionService);
    private answerService = inject(AnswerService);
    
    quiz = signal<Quiz | null>(null);
    questions = signal<QuestionFormState[]>([]);
    isLoading = signal(true);
    globalError = signal<string | null>(null);

    codeModels: Record<number, CodeModel> = {};

    constructor() {
        effect(async () => {
            const id = this.lessonId();
            if (id) {
                await this.loadQuiz(id);
            }
        });
    }

    async loadQuiz(lessonId: string) {
        this.isLoading.set(true);
        this.globalError.set(null);
        try {
            const quiz = await this.quizService.getOrCreateQuiz(lessonId);
            this.quiz.set(quiz);

            const dbQuestions = await this.questionService.getQuestionsByQuizId(quiz.id);
            
            // Build the state array
            const formState: QuestionFormState[] = [];
            
            for (let i = 0; i < 10; i++) {
                const dbQ = dbQuestions[i];
                if (dbQ) {
                    const answers = await this.answerService.getAnswersByQuestionId(dbQ.id);
                    // Ensure there are 4 answers
                    const paddedAnswers = [...answers];
                    while (paddedAnswers.length < 4) {
                        paddedAnswers.push({ id: null as any, questionId: dbQ.id, text: '', isCorrect: false, reason: '' });
                    }
                    const sc = dbQ.sectionContents?.[0];
                    formState.push({
                        id: dbQ.id,
                        statement: sc?.content || '',
                        answers: paddedAnswers.slice(0, 4).map(a => ({
                            id: a.id,
                            text: a.text,
                            justification: a.reason,
                            isCorrect: a.isCorrect
                        })),
                        sectionContent: sc,
                        isSaving: false,
                        showSuccess: false,
                        errorMessage: null
                    });
                } else {
                    formState.push({
                        id: null,
                        statement: '',
                        answers: [
                            { id: null, text: '', justification: '', isCorrect: false },
                            { id: null, text: '', justification: '', isCorrect: false },
                            { id: null, text: '', justification: '', isCorrect: false },
                            { id: null, text: '', justification: '', isCorrect: false }
                        ],
                        sectionContent: null,
                        isSaving: false,
                        showSuccess: false,
                        errorMessage: null
                    });
                }
            }
            this.questions.set(formState);
        } catch (error: any) {
            this.globalError.set(error.message || 'Erro ao carregar o quiz.');
        } finally {
            this.isLoading.set(false);
        }
    }

    getCodeModel(index: number, content: string): CodeModel {
        if (!this.codeModels[index]) {
            this.codeModels[index] = {
                language: 'markdown',
                uri: `quiz-question-${index}.md`,
                value: content || ''
            };
        }
        return this.codeModels[index];
    }

    updateStatement(index: number, content: string) {
        const qList = [...this.questions()];
        qList[index].statement = content;
        this.questions.set(qList);
    }

    updateAnswerText(qIndex: number, aIndex: number, text: string) {
        const qList = [...this.questions()];
        qList[qIndex].answers[aIndex].text = text;
        this.questions.set(qList);
    }

    updateAnswerJustification(qIndex: number, aIndex: number, justification: string) {
        const qList = [...this.questions()];
        qList[qIndex].answers[aIndex].justification = justification;
        this.questions.set(qList);
    }

    setCorrectAnswer(qIndex: number, aIndex: number) {
        const qList = [...this.questions()];
        qList[qIndex].answers.forEach((a, i) => a.isCorrect = (i === aIndex));
        this.questions.set(qList);
    }

    async saveQuestion(index: number) {
        const q = this.questions()[index];
        const qz = this.quiz();

        if (!qz) return;

        // Validation
        const hasCorrect = q.answers.some(a => a.isCorrect);
        const hasEmptyText = q.answers.some(a => !a.text.trim()) || !q.statement.trim();

        if (!hasCorrect || hasEmptyText) {
            this.updateQuestionState(index, { errorMessage: 'Preencha o enunciado, todas as alternativas e selecione a correta.' });
            return;
        }

        this.updateQuestionState(index, { isSaving: true, errorMessage: null, showSuccess: false });

        try {
            const savedQ = await this.quizService.saveQuestion(qz.id, q);
            this.updateQuestionState(index, {
                id: savedQ.id,
                statement: savedQ.statement,
                answers: savedQ.answers,
                sectionContent: savedQ.sectionContent,
                showSuccess: true
            });
            setTimeout(() => this.updateQuestionState(index, { showSuccess: false }), 3000);
        } catch (error: any) {
            this.updateQuestionState(index, { errorMessage: error.message || 'Erro ao salvar a pergunta.' });
        } finally {
            this.updateQuestionState(index, { isSaving: false });
        }
    }

    private updateQuestionState(index: number, updates: Partial<QuestionFormState>) {
        const qList = [...this.questions()];
        qList[index] = { ...qList[index], ...updates };
        this.questions.set(qList);
    }
}
