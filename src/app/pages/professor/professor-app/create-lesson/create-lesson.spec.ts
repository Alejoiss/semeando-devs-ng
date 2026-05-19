import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateLesson } from './create-lesson';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LessonService } from '../../../../services/lesson';
import { UserService } from '../../../../services/user';
import { SectionContentService } from '../../../../services/section-content';
import { QuizService } from '../../../../services/quiz';
import { QuestionService } from '../../../../services/question';
import { AnswerService } from '../../../../services/answer';
import { signal } from '@angular/core';

describe('CreateLesson', () => {
    let component: CreateLesson;
    let fixture: ComponentFixture<CreateLesson>;
    let mockLessonService: any;
    let mockUserService: any;
    let mockSectionContentService: any;
    let mockQuizService: any;
    let mockQuestionService: any;
    let mockAnswerService: any;
    let router: Router;

    let routeParamId: string | null = 'l1';

    const mockActivatedRoute = {
        snapshot: {
            paramMap: {
                get: (key: string) => {
                    if (key === 'id') return routeParamId;
                    if (key === 'idSubModule') return 'sub-1';
                    return null;
                }
            }
        }
    };

    beforeEach(() => {
        routeParamId = 'l1';

        mockUserService = {
            currentUser: signal({ id: 'user-1' })
        };

        mockLessonService = {
            getLessonById: jasmine.createSpy('getLessonById').and.returnValue(Promise.resolve({
                id: 'l1',
                title: 'Licao Teste',
                type: 'LESSON',
                subModuleId: 'sub-1'
            })),
            getLessonsBySubModuleId: jasmine.createSpy().and.returnValue(Promise.resolve([]))
        };

        mockSectionContentService = {
            getSectionContentsByLessonId: jasmine.createSpy().and.returnValue(Promise.resolve([]))
        };

        mockQuizService = {
            getOrCreateQuiz: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'q1' }))
        };

        mockQuestionService = {
            getQuestionsByQuizId: jasmine.createSpy().and.returnValue(Promise.resolve([]))
        };

        mockAnswerService = {
            getAnswersByQuestionIdForEditor: jasmine.createSpy().and.returnValue(Promise.resolve([]))
        };
    });

    async function initComponent() {
        await TestBed.configureTestingModule({
            imports: [CreateLesson, RouterModule.forRoot([])],
            providers: [
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: UserService, useValue: mockUserService },
                { provide: LessonService, useValue: mockLessonService },
                { provide: SectionContentService, useValue: mockSectionContentService },
                { provide: QuizService, useValue: mockQuizService },
                { provide: QuestionService, useValue: mockQuestionService },
                { provide: AnswerService, useValue: mockAnswerService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateLesson);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        spyOn(router, 'navigate');
        fixture.detectChanges();
    }

    it('should create and NOT redirect if lesson is type LESSON', async () => {
        await initComponent();
        await fixture.whenStable();

        expect(component).toBeTruthy();
        expect(mockLessonService.getLessonById).toHaveBeenCalledWith('l1');
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to submodule edit screen if lesson is type REVISION', async () => {
        mockLessonService.getLessonById.and.returnValue(Promise.resolve({
            id: 'l1',
            title: 'Revisão do Submódulo',
            type: 'REVISION',
            subModuleId: 'sub-1'
        }));

        await initComponent();
        await fixture.whenStable();

        expect(router.navigate).toHaveBeenCalledWith(['/professor/editar-submodulo', 'sub-1'], { replaceUrl: true });
    });
});
