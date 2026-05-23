import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabQuiz } from './tab-quiz';
import { QuizService } from '../../../../../services/quiz';
import { QuestionService } from '../../../../../services/question';
import { AnswerService } from '../../../../../services/answer';
import { signal } from '@angular/core';

describe('TabQuiz', () => {
    let component: TabQuiz;
    let fixture: ComponentFixture<TabQuiz>;
    let mockQuizService: any;
    let mockQuestionService: any;
    let mockAnswerService: any;

    const makeSavedQ = (i: number) => ({
        id: `saved-q${i}`,
        statement: `Question ${i}`,
        answers: [
            { id: `a${i}0`, text: 'A', justification: 'RA', isCorrect: true },
            { id: `a${i}1`, text: 'B', justification: 'RB', isCorrect: false },
            { id: `a${i}2`, text: 'C', justification: 'RC', isCorrect: false },
            { id: `a${i}3`, text: 'D', justification: 'RD', isCorrect: false },
        ],
        sectionContent: { id: `sc${i}`, content: `Question ${i}` }
    });

    const makeValidJson = (count: number) =>
        JSON.stringify(
            Array.from({ length: count }, (_, i) => ({
                question: `Question ${i + 1}`,
                answers: [
                    { text: 'A', isCorrect: true, reason: 'RA' },
                    { text: 'B', isCorrect: false, reason: 'RB' },
                    { text: 'C', isCorrect: false, reason: 'RC' },
                    { text: 'D', isCorrect: false, reason: 'RD' },
                ]
            }))
        );

    beforeEach(async () => {
        mockQuizService = {
            getOrCreateQuiz: jasmine.createSpy('getOrCreateQuiz').and.returnValue(Promise.resolve({ id: 'q1', lessonId: 'l1' })),
            saveQuestion: jasmine.createSpy('saveQuestion').and.returnValue(Promise.resolve(makeSavedQ(0)))
        };
        mockQuestionService = {
            getQuestionsByQuizId: jasmine.createSpy('getQuestionsByQuizId').and.returnValue(Promise.resolve([]))
        };
        mockAnswerService = {
            getAnswersByQuestionId: jasmine.createSpy('getAnswersByQuestionId').and.returnValue(Promise.resolve([]))
        };

        await TestBed.configureTestingModule({
            imports: [TabQuiz],
            providers: [
                { provide: QuizService, useValue: mockQuizService },
                { provide: QuestionService, useValue: mockQuestionService },
                { provide: AnswerService, useValue: mockAnswerService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TabQuiz);
        component = fixture.componentInstance;
        component.lessonId = signal('l1') as any;
    });

    // —— Existing tests ——

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should ensure quiz record exists or is created on load', async () => {
        await component.loadQuiz('l1');
        expect(mockQuizService.getOrCreateQuiz).toHaveBeenCalledWith('l1');
        expect(component.quiz()?.id).toBe('q1');
    });

    it('should display exactly 10 question slots', async () => {
        await component.loadQuiz('l1');
        expect(component.questions().length).toBe(10);
    });

    it('should store markdown statement correctly', async () => {
        await component.loadQuiz('l1');
        component.updateStatement(0, '## Question 1');
        expect(component.questions()[0].statement).toBe('## Question 1');
    });

    it('should configure 4 alternatives correctly', async () => {
        await component.loadQuiz('l1');
        expect(component.questions()[0].answers.length).toBe(4);

        component.updateAnswerText(0, 0, 'Option A');
        component.updateAnswerJustification(0, 0, 'Reason A');
        component.setCorrectAnswer(0, 0);

        const firstAnswer = component.questions()[0].answers[0];
        expect(firstAnswer.text).toBe('Option A');
        expect(firstAnswer.justification).toBe('Reason A');
        expect(firstAnswer.isCorrect).toBeTrue();
    });

    it('should respect validation in question save flow', async () => {
        await component.loadQuiz('l1');

        await component.saveQuestion(0);
        expect(mockQuizService.saveQuestion).not.toHaveBeenCalled();
        expect(component.questions()[0].errorMessage).toBe('Preencha o enunciado, todas as alternativas e selecione a correta.');

        component.updateStatement(0, 'Test statement');
        for (let i = 0; i < 4; i++) {
            component.updateAnswerText(0, i, `Option ${i}`);
        }
        component.setCorrectAnswer(0, 0);

        await component.saveQuestion(0);
        expect(mockQuizService.saveQuestion).toHaveBeenCalled();
        expect(component.questions()[0].showSuccess).toBeTrue();
    });

    // —— Phase 3: Import JSON acceptance criteria tests ——

    // 3.1 — import button visibility and modal open
    describe('import button and modal visibility', () => {
        it('shows import modal when openImportModal is called', () => {
            expect(component.isImportModalOpen()).toBeFalse();
            component.openImportModal();
            expect(component.isImportModalOpen()).toBeTrue();
        });

        it('hides import modal when closeImportModal is called', () => {
            component.openImportModal();
            component.closeImportModal();
            expect(component.isImportModalOpen()).toBeFalse();
        });
    });

    // 3.3 — cancel closes modal without changing quiz state
    describe('cancel modal', () => {
        it('closes modal and resets import state without affecting questions', async () => {
            await component.loadQuiz('l1');
            const questionsBefore = component.questions();

            component.openImportModal();
            component.updateImportJson('[{"question":"X","answers":[]}]');
            component.closeImportModal();

            expect(component.isImportModalOpen()).toBeFalse();
            expect(component.importError()).toBeNull();
            expect(component.importJsonContent()).toBe('');
            expect(component.questions()).toEqual(questionsBefore);
        });
    });

    // 3.4 — invalid JSON parse error
    describe('importFromJson validation', () => {
        beforeEach(async () => {
            await component.loadQuiz('l1');
            component.openImportModal();
        });

        it('shows parse error for invalid JSON syntax', async () => {
            component.updateImportJson('{not valid json]');
            await component.importFromJson();

            expect(component.importError()).toContain('JSON inválido');
            expect(component.isImportModalOpen()).toBeTrue();
        });

        // 3.5 — non-array JSON
        it('shows type error when parsed JSON is not an array', async () => {
            component.updateImportJson('{"question": "X"}');
            await component.importFromJson();

            expect(component.importError()).toContain('array');
            expect(component.isImportModalOpen()).toBeTrue();
        });

        // 3.6 — structural validation per question
        it('shows structural error when question field is missing', async () => {
            component.updateImportJson(JSON.stringify([
                { answers: [{ text: 'A', isCorrect: true, reason: 'R' }, { text: 'B', isCorrect: false, reason: 'R' }, { text: 'C', isCorrect: false, reason: 'R' }, { text: 'D', isCorrect: false, reason: 'R' }] }
            ]));
            await component.importFromJson();

            expect(component.importError()).toContain('Questão 1');
            expect(component.isImportModalOpen()).toBeTrue();
        });

        it('shows structural error when answers array does not have exactly 4 items', async () => {
            component.updateImportJson(JSON.stringify([
                { question: 'Q1', answers: [{ text: 'A', isCorrect: true, reason: 'R' }] }
            ]));
            await component.importFromJson();

            expect(component.importError()).toContain('Questão 1');
            expect(component.isImportModalOpen()).toBeTrue();
        });

        // 3.7 — answer field validation
        it('shows answer field error when text is missing', async () => {
            component.updateImportJson(JSON.stringify([
                {
                    question: 'Q1',
                    answers: [
                        { isCorrect: true, reason: 'R' },
                        { text: 'B', isCorrect: false, reason: 'R' },
                        { text: 'C', isCorrect: false, reason: 'R' },
                        { text: 'D', isCorrect: false, reason: 'R' }
                    ]
                }
            ]));
            await component.importFromJson();

            expect(component.importError()).toContain('Alternativa 1');
            expect(component.importError()).toContain('text');
        });

        it('shows answer field error when isCorrect is missing', async () => {
            component.updateImportJson(JSON.stringify([
                {
                    question: 'Q1',
                    answers: [
                        { text: 'A', reason: 'R' },
                        { text: 'B', isCorrect: false, reason: 'R' },
                        { text: 'C', isCorrect: false, reason: 'R' },
                        { text: 'D', isCorrect: false, reason: 'R' }
                    ]
                }
            ]));
            await component.importFromJson();

            expect(component.importError()).toContain('isCorrect');
        });

        it('shows answer field error when reason is missing', async () => {
            component.updateImportJson(JSON.stringify([
                {
                    question: 'Q1',
                    answers: [
                        { text: 'A', isCorrect: true },
                        { text: 'B', isCorrect: false, reason: 'R' },
                        { text: 'C', isCorrect: false, reason: 'R' },
                        { text: 'D', isCorrect: false, reason: 'R' }
                    ]
                }
            ]));
            await component.importFromJson();

            expect(component.importError()).toContain('reason');
        });
    });

    // 3.8 — more than 10 questions capped to 10
    describe('question count capping', () => {
        beforeEach(async () => {
            await component.loadQuiz('l1');
            component.openImportModal();
        });

        it('imports only the first 10 questions when more than 10 are provided', async () => {
            mockQuizService.saveQuestion.and.callFake((quizId: string, q: any) =>
                Promise.resolve(makeSavedQ(0))
            );
            component.updateImportJson(makeValidJson(12));
            await component.importFromJson();

            expect(mockQuizService.saveQuestion).toHaveBeenCalledTimes(10);
        });

        // 3.9 — fewer than 10 fills only provided slots
        it('imports only the provided questions and leaves remaining slots empty', async () => {
            mockQuizService.saveQuestion.and.callFake((quizId: string, q: any) =>
                Promise.resolve(makeSavedQ(0))
            );
            component.updateImportJson(makeValidJson(3));
            await component.importFromJson();

            expect(mockQuizService.saveQuestion).toHaveBeenCalledTimes(3);
            const questions = component.questions();
            expect(questions.length).toBe(10);
            // The 3 imported + 7 empty
            for (let i = 3; i < 10; i++) {
                expect(questions[i].id).toBeNull();
                expect(questions[i].statement).toBe('');
            }
        });
    });

    // 3.10 — loading state during persistence
    describe('loading state', () => {
        it('sets isImporting to true while saving and false after', async () => {
            await component.loadQuiz('l1');
            component.openImportModal();

            let capturedImporting = false;
            mockQuizService.saveQuestion.and.callFake(() => {
                capturedImporting = component.isImporting();
                return Promise.resolve(makeSavedQ(0));
            });

            component.updateImportJson(makeValidJson(1));
            await component.importFromJson();

            expect(capturedImporting).toBeTrue();
            expect(component.isImporting()).toBeFalse();
        });
    });

    // 3.11 — persistence error keeps modal open
    describe('persistence error handling', () => {
        it('shows per-question error and keeps modal open when saveQuestion throws', async () => {
            await component.loadQuiz('l1');
            component.openImportModal();

            let callCount = 0;
            mockQuizService.saveQuestion.and.callFake(() => {
                callCount++;
                if (callCount === 2) return Promise.reject(new Error('DB error'));
                return Promise.resolve(makeSavedQ(callCount));
            });

            component.updateImportJson(makeValidJson(3));
            await component.importFromJson();

            expect(component.importError()).toContain('questão 2');
            expect(component.isImportModalOpen()).toBeTrue();
        });
    });

    // 3.12 — successful import closes modal
    describe('successful import', () => {
        beforeEach(async () => {
            await component.loadQuiz('l1');
            component.openImportModal();

            mockQuizService.saveQuestion.and.callFake((_quizId: string, q: any) => {
                const idx = mockQuizService.saveQuestion.calls.count() - 1;
                return Promise.resolve(makeSavedQ(idx));
            });
        });

        it('closes the modal after all questions are successfully persisted', async () => {
            component.updateImportJson(makeValidJson(2));
            await component.importFromJson();

            expect(component.isImportModalOpen()).toBeFalse();
        });

        // 3.13 — quiz editor reflects imported content
        it('updates questions signal with imported statements, answers, and correct flags', async () => {
            component.updateImportJson(makeValidJson(2));
            await component.importFromJson();

            const questions = component.questions();
            expect(questions[0].id).toBe('saved-q0');
            expect(questions[0].statement).toBe('Question 0');
            expect(questions[0].answers[0].isCorrect).toBeTrue();
            expect(questions[1].id).toBe('saved-q1');
        });

        // 3.14 — codeModels reset after import
        it('resets codeModels so Monaco editors rebuild with imported content', async () => {
            // Pre-populate codeModels to simulate existing editors
            component['codeModels'] = { 0: { language: 'markdown', uri: 'old.md', value: 'old' } };

            component.updateImportJson(makeValidJson(1));
            await component.importFromJson();

            expect(Object.keys(component['codeModels']).length).toBe(0);

            // Calling getCodeModel now should create a fresh model with the saved statement
            const model = component.getCodeModel(0, 'Question 0');
            expect(model.value).toBe('Question 0');
        });
    });
});
