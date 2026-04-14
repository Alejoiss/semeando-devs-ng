import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Lesson } from './lesson';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { Lesson as LessonModel, LessonType } from '../../../../models/lesson/lesson';
import { UserLesson } from '../../../../models/user-lesson/user-lesson';

const MOCK_LESSONS: LessonModel[] = [
    { id: 'l1', title: 'Intro', description: 'Desc 1', type: LessonType.LESSON, order: 1, subModuleId: 'sm1' },
    { id: 'l2', title: 'Desafio', description: 'Desc 2', type: LessonType.CHALLENGE, order: 2, subModuleId: 'sm1' },
    { id: 'l3', title: 'Revisão', description: 'Desc 3', type: LessonType.REVISION, order: 3, subModuleId: 'sm1' },
];

const MOCK_USER_LESSONS: Partial<UserLesson>[] = [
    { id: 'ul1', lesson: MOCK_LESSONS[0] as any, completed: true, completedAt: new Date() },
    { id: 'ul2', lesson: MOCK_LESSONS[1] as any, completed: false, completedAt: new Date() },
];

describe('Lesson Page', () => {
    let component: Lesson;
    let fixture: ComponentFixture<Lesson>;
    let lessonServiceSpy: jasmine.SpyObj<LessonService>;
    let userLessonServiceSpy: jasmine.SpyObj<UserLessonService>;

    const activatedRouteStub = {
        snapshot: {
            paramMap: {
                get: (key: string) => {
                    const map: Record<string, string> = {
                        slug: 'html',
                        slugSubmodule: 'html-basico',
                        lessonId: 'l2',
                    };
                    return map[key] ?? null;
                },
            },
        },
    };

    beforeEach(async () => {
        lessonServiceSpy = jasmine.createSpyObj('LessonService', ['getLessonsBySubModuleSlug']);
        userLessonServiceSpy = jasmine.createSpyObj('UserLessonService', ['getUserLessons']);

        lessonServiceSpy.getLessonsBySubModuleSlug.and.returnValue(Promise.resolve(MOCK_LESSONS));
        userLessonServiceSpy.getUserLessons.and.returnValue(Promise.resolve(MOCK_USER_LESSONS as UserLesson[]));

        await TestBed.configureTestingModule({
            imports: [Lesson],
            providers: [
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                { provide: LessonService, useValue: lessonServiceSpy },
                { provide: UserLessonService, useValue: userLessonServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Lesson);
        component = fixture.componentInstance;
    });

    // Task 4.8 — REQ-6.1
    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    // Task 4.8 — REQ-6.2: reads route params on init
    it('should read slugSubmodule and lessonId from route on init', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.slugSubmodule()).toBe('html-basico');
        expect(component.lessonId()).toBe('l2');
    });

    // Task 4.8 — REQ-6.3: calls services with the correct slug
    it('should call getLessonsBySubModuleSlug with the slugSubmodule param', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(lessonServiceSpy.getLessonsBySubModuleSlug).toHaveBeenCalledWith('html-basico');
    });

    // Task 4.8 — REQ-6.4: activeLesson matches the lessonId route param
    it('should set activeLesson to the lesson matching lessonId', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.activeLesson()?.id).toBe('l2');
        expect(component.activeLesson()?.title).toBe('Desafio');
    });

    // Task 4.8 — REQ-6.4: error signal when service throws
    it('should set error signal when a service throws', async () => {
        lessonServiceSpy.getLessonsBySubModuleSlug.and.returnValue(Promise.reject(new Error('Sem conexão')));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.error()).toBe('Sem conexão');
        expect(component.isLoading()).toBeFalse();
    });

    // Task 4.8 — REQ-6.5: loading state is true before data resolves
    it('should start in loading state', () => {
        expect(component.isLoading()).toBeTrue();
    });

    // Task 4.9 — REQ-7.1, REQ-7.2: sidebar shows all submodule lessons
    it('should expose all lessons via lessonsWithState for the sidebar', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.lessonsWithState().length).toBe(3);
    });

    // Task 4.9 — REQ-7.3, REQ-7.4: correct progress states in sidebar
    it('should compute correct progress states for sidebar', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        const states = component.lessonsWithState();
        expect(states[0].progressState).toBe('completed');
        expect(states[1].progressState).toBe('in-progress');
        expect(states[2].progressState).toBe('not-started');
    });

    // Task 4.9 — REQ-7.5: active lesson id is tracked for highlight
    it('should expose lessonId signal so the active lesson can be highlighted', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        const activeLessonInList = component.lessonsWithState().find(
            item => item.lesson.id === component.lessonId()
        );
        expect(activeLessonInList).toBeDefined();
        expect(activeLessonInList?.lesson.title).toBe('Desafio');
    });
});
