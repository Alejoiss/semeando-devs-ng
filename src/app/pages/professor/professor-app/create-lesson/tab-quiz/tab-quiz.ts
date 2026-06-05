import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { QuizService } from '../../../../../services/quiz';
import { LessonService } from '../../../../../services/lesson';
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

// Task 1.1 — Internal import types (DES-3)
interface JsonImportAnswer {
    text: string;
    isCorrect: boolean;
    reason: string;
}

interface JsonImportQuestion {
    question: string;
    answers: JsonImportAnswer[];
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
    private lessonService = inject(LessonService);

    quiz = signal<Quiz | null>(null);
    questions = signal<QuestionFormState[]>([]);
    isLoading = signal(true);
    globalError = signal<string | null>(null);

    codeModels: Record<number, CodeModel> = {};

    // Task 1.2 — Import modal signals (DES-1, DES-4)
    isImportModalOpen = signal(false);
    isImporting = signal(false);
    importError = signal<string | null>(null);
    importJsonContent = signal('');

    // Task 1.3 — Monaco CodeModel for the JSON import editor (DES-2)
    importCodeModel: CodeModel = {
        language: 'json',
        uri: 'quiz-json-import.json',
        value: ''
    };

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

            const formState: QuestionFormState[] = [];

            for (let i = 0; i < 10; i++) {
                const dbQ = dbQuestions[i];
                if (dbQ) {
                    const answers = await this.answerService.getAnswersByQuestionIdForEditor(dbQ.id);
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
                            justification: a.reason ?? '',
                            isCorrect: !!a.isCorrect
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
            const id = this.lessonId();
            if (id) {
                await this.lessonService.invalidateLesson(id);
            }
            setTimeout(() => this.updateQuestionState(index, { showSuccess: false }), 3000);
        } catch (error: any) {
            this.updateQuestionState(index, { errorMessage: error.message || 'Erro ao salvar a pergunta.' });
        } finally {
            this.updateQuestionState(index, { isSaving: false });
        }
    }

    // Task 1.4 — Open / close modal methods (DES-1)
    openImportModal() {
        this.isImportModalOpen.set(true);
    }

    closeImportModal() {
        this.isImportModalOpen.set(false);
        this.importError.set(null);
        this.importJsonContent.set('');
        this.importCodeModel = {
            language: 'json',
            uri: 'quiz-json-import.json',
            value: ''
        };
    }

    // Task 1.5 — Update import JSON content from editor (DES-2)
    updateImportJson(content: string) {
        this.importJsonContent.set(content);
    }

    // Tasks 1.6 + 1.7 + 1.8 — Validate, persist, and reset state (DES-3, DES-4, DES-5)
    async importFromJson() {
        this.importError.set(null);
        const raw = this.importJsonContent();

        // Guard 1: valid JSON syntax
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            this.importError.set('JSON inválido. Verifique a sintaxe.');
            return;
        }

        // Guard 2: must be an array
        if (!Array.isArray(parsed)) {
            this.importError.set('O payload deve ser um array de questões.');
            return;
        }

        // Guard 3 & 4: validate each item and cap to 10
        const capped: JsonImportQuestion[] = (parsed as any[]).slice(0, 10);
        for (let i = 0; i < capped.length; i++) {
            const item = capped[i];
            if (!item.question || typeof item.question !== 'string' || item.question.trim() === '') {
                this.importError.set(`Questão ${i + 1}: campo "question" ausente ou vazio.`);
                return;
            }
            if (!Array.isArray(item.answers) || item.answers.length !== 4) {
                this.importError.set(`Questão ${i + 1}: "answers" deve ser um array com exatamente 4 itens.`);
                return;
            }
            for (let j = 0; j < item.answers.length; j++) {
                const ans = item.answers[j];
                if (ans.text === undefined || ans.text === null) {
                    this.importError.set(`Questão ${i + 1}, Alternativa ${j + 1}: campo "text" ausente.`);
                    return;
                }
                if (ans.isCorrect === undefined || ans.isCorrect === null) {
                    this.importError.set(`Questão ${i + 1}, Alternativa ${j + 1}: campo "isCorrect" ausente.`);
                    return;
                }
                if (ans.reason === undefined || ans.reason === null) {
                    this.importError.set(`Questão ${i + 1}, Alternativa ${j + 1}: campo "reason" ausente.`);
                    return;
                }
            }
        }

        const qz = this.quiz();
        if (!qz) return;

        // Persistence loop
        this.isImporting.set(true);
        const savedResults: QuestionFormState[] = [];

        try {
            try {
                await this.questionService.deleteQuestionsByQuizId(qz.id);
            } catch (err: any) {
                this.importError.set('Erro ao limpar as questões antigas. Tente novamente.');
                return;
            }

            for (let i = 0; i < capped.length; i++) {
                const item = capped[i];
                const questionData = {
                    id: null,
                    statement: item.question,
                    answers: item.answers.map(a => ({
                        id: null,
                        text: a.text,
                        justification: a.reason,
                        isCorrect: a.isCorrect
                    })),
                    sectionContent: null
                };

                try {
                    const saved = await this.quizService.saveQuestion(qz.id, questionData);
                    savedResults.push({
                        id: saved.id,
                        statement: saved.statement,
                        answers: saved.answers,
                        sectionContent: saved.sectionContent,
                        isSaving: false,
                        showSuccess: false,
                        errorMessage: null
                    });
                } catch (err: any) {
                    this.importError.set(`Erro ao salvar a questão ${i + 1}. Tente novamente.`);
                    return;
                }
            }

            // Task 1.8 — Post-import state reset (DES-5)
            const emptySlotCount = 10 - savedResults.length;
            const emptySlots: QuestionFormState[] = Array.from({ length: emptySlotCount }, () => ({
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
            }));

            this.codeModels = {};
            this.questions.set([...savedResults, ...emptySlots]);
            this.closeImportModal();
        } finally {
            this.isImporting.set(false);
        }
    }

    private updateQuestionState(index: number, updates: Partial<QuestionFormState>) {
        const qList = [...this.questions()];
        qList[index] = { ...qList[index], ...updates };
        this.questions.set(qList);
    }
}
