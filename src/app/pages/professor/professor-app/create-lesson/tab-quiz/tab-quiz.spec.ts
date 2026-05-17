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

  beforeEach(async () => {
    mockQuizService = {
      getOrCreateQuiz: jasmine.createSpy('getOrCreateQuiz').and.returnValue(Promise.resolve({ id: 'q1', lessonId: 'l1' })),
      saveQuestion: jasmine.createSpy('saveQuestion').and.returnValue(Promise.resolve())
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should ensure quiz record exists or is created on load (REQ-1.1, REQ-1.2)', async () => {
    await component.loadQuiz('l1');
    expect(mockQuizService.getOrCreateQuiz).toHaveBeenCalledWith('l1');
    expect(component.quiz()?.id).toBe('q1');
  });

  it('should display exactly 10 question slots (REQ-2.1, REQ-2.2)', async () => {
    await component.loadQuiz('l1');
    expect(component.questions().length).toBe(10);
  });

  it('should store markdown statement correctly (REQ-3.1, REQ-3.2)', async () => {
    await component.loadQuiz('l1');
    component.updateStatement(0, '## Question 1');
    expect(component.questions()[0].statement).toBe('## Question 1');
  });

  it('should configure 4 alternatives correctly (REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4)', async () => {
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

  it('should respect validation in question save flow (REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4)', async () => {
    await component.loadQuiz('l1');
    
    // Invalid state (empty statement and answers)
    await component.saveQuestion(0);
    expect(mockQuizService.saveQuestion).not.toHaveBeenCalled();
    expect(component.questions()[0].errorMessage).toBe('Preencha o enunciado, todas as alternativas e selecione a correta.');

    // Valid state
    component.updateStatement(0, 'Test statement');
    for (let i=0; i<4; i++) {
        component.updateAnswerText(0, i, `Option ${i}`);
    }
    component.setCorrectAnswer(0, 0);
    
    await component.saveQuestion(0);
    expect(mockQuizService.saveQuestion).toHaveBeenCalled();
    expect(component.questions()[0].showSuccess).toBeTrue();
  });
});
