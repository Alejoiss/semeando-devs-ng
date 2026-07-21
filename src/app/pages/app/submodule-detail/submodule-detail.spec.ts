import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SubmoduleDetail, LessonWithState } from './submodule-detail';
import { SubModuleService } from '../../../services/sub-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { Lesson, LessonType } from '../../../../models/lesson/lesson';
import { UserLesson } from '../../../../models/user-lesson/user-lesson';
import { signal } from '@angular/core';
import { UserService } from '../../../services/user';
import { DailyLimitService } from '../../../services/daily-limit/daily-limit';
import { UserQuizService } from '../../../services/user-quiz';

const MOCK_LESSONS: Lesson[] = [
    { id: 'l1', title: 'Intro', description: 'Desc 1', type: LessonType.LESSON, order: 1, subModuleId: 'sm1', xp: 100 },
    { id: 'l2', title: 'Desafio', description: 'Desc 2', type: LessonType.CHALLENGE, order: 2, subModuleId: 'sm1', xp: 100 },
    { id: 'l3', title: 'Revisão', description: 'Desc 3', type: LessonType.REVISION, order: 3, subModuleId: 'sm1', xp: 100 },
];

const MOCK_USER_LESSONS: Partial<UserLesson>[] = [
    { id: 'ul1', lesson: MOCK_LESSONS[0] as any, completed: true, completedAt: new Date() },
    { id: 'ul2', lesson: MOCK_LESSONS[1] as any, completed: false, completedAt: new Date() },
];

describe('SubmoduleDetail', () => {
    let component: SubmoduleDetail;
    let fixture: ComponentFixture<SubmoduleDetail>;
    let lessonServiceSpy: jasmine.SpyObj<LessonService>;
    let userLessonServiceSpy: jasmine.SpyObj<UserLessonService>;
    let subModuleServiceSpy: jasmine.SpyObj<SubModuleService>;
    let userQuizServiceSpy: jasmine.SpyObj<UserQuizService>;
    let userServiceSpy: any;
    let dailyLimitServiceSpy: any;

    const activatedRouteStub = {
        snapshot: {
            paramMap: {
                get: (key: string) => {
                    const map: Record<string, string> = { slug: 'html', slugSubmodule: 'html-basico' };
                    return map[key] ?? null;
                },
            },
        },
    };

    beforeEach(async () => {
        lessonServiceSpy = jasmine.createSpyObj('LessonService', ['getLessonsBySubModuleSlug']);
        userLessonServiceSpy = jasmine.createSpyObj('UserLessonService', ['getUserLessons']);
        subModuleServiceSpy = jasmine.createSpyObj('SubModuleService', ['getSubModulesByModuleSlug']);
        userQuizServiceSpy = jasmine.createSpyObj('UserQuizService', ['getUserQuizzesBySubModule']);

        lessonServiceSpy.getLessonsBySubModuleSlug.and.returnValue(Promise.resolve(MOCK_LESSONS));
        userLessonServiceSpy.getUserLessons.and.returnValue(Promise.resolve(MOCK_USER_LESSONS as UserLesson[]));
        subModuleServiceSpy.getSubModulesByModuleSlug.and.returnValue(Promise.resolve([{ id: 'sm1', slug: 'html-basico', title: 'HTML Básico', description: 'Desc' } as any]));
        userQuizServiceSpy.getUserQuizzesBySubModule.and.returnValue(Promise.resolve([]));

        const mockUserSignal = signal<any>({ id: 'u1', isPro: false });
        userServiceSpy = jasmine.createSpyObj('UserService', ['loadUserProfile']);
        userServiceSpy.currentUser = mockUserSignal;

        dailyLimitServiceSpy = jasmine.createSpyObj('DailyLimitService', ['loadDailyCount', 'isLessonAccessible']);
        dailyLimitServiceSpy.isDailyLimitReached = signal(false);
        dailyLimitServiceSpy.dailyCompletedCount = signal(0);

        await TestBed.configureTestingModule({
            imports: [SubmoduleDetail],
            providers: [
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                { provide: LessonService, useValue: lessonServiceSpy },
                { provide: UserLessonService, useValue: userLessonServiceSpy },
                { provide: SubModuleService, useValue: subModuleServiceSpy },
                { provide: UserQuizService, useValue: userQuizServiceSpy },
                { provide: UserService, useValue: userServiceSpy },
                { provide: DailyLimitService, useValue: dailyLimitServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SubmoduleDetail);
        component = fixture.componentInstance;
    });

    // Task 4.6 — REQ-8.1
    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    // Task 4.6 — REQ-8.2: loading state is true before data resolves
    it('should start in loading state', () => {
        expect(component.isLoading()).toBeTrue();
    });

    // Task 4.6 — REQ-8.3, REQ-8.4: loads data and clears loading on success
    it('should load submodule and lessons on init', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.isLoading()).toBeFalse();
        expect(component.error()).toBeNull();
        expect(component.lessons().length).toBe(3);
        expect(component.submodule()?.title).toBe('HTML Básico');
    });

    // Task 4.6 — REQ-8.4: error signal is set when a service throws
    it('should set error signal when a service throws', async () => {
        lessonServiceSpy.getLessonsBySubModuleSlug.and.returnValue(Promise.reject(new Error('Falha na rede')));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.isLoading()).toBeFalse();
        expect(component.error()).toBe('Falha na rede');
    });

    // Task 4.7 — REQ-8.5: lessons ordered by ascending order field
    it('should return lessons in ascending order', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        const orders = component.lessons().map(l => l.order);
        expect(orders).toEqual([1, 2, 3]);
    });

    // Task 4.7 — REQ-8.6, REQ-8.7, REQ-8.8: progress states derived correctly
    it('should compute correct progress states from user lessons', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        const states = component.lessonsWithState();
        expect(states[0].progressState).toBe('completed');
        expect(states[1].progressState).toBe('in-progress');
        expect(states[2].progressState).toBe('blocked');
    });

    // Task 4.7 — REQ-8.9: completedCount computed signal
    it('should count completed lessons correctly', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.completedCount()).toBe(1);
    });

    // Task 4.7 — REQ-8.10: completionPercentage computed signal
    it('should compute completion percentage correctly', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.completionPercentage()).toBe(33); // 1/3 rounded
    });
});
