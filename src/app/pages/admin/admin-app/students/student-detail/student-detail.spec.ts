import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AdminStudentDetail } from './student-detail';
import { AdminStudentService } from '../../../../../services/admin-student';
import { CourseService } from '../../../../../services/course';
import { UserCourseService } from '../../../../../services/user-course';
import { UserLessonService } from '../../../../../services/user-lesson';
import { UserQuizService } from '../../../../../services/user-quiz';
import { AchievementsService } from '../../../../../services/achievements';
import { XpService } from '../../../../../services/xp';
import { SeedService } from '../../../../../services/seed';

describe('AdminStudentDetail', () => {
    let fixture: ComponentFixture<AdminStudentDetail>;
    let component: any;
    let params$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
    let students: jasmine.SpyObj<AdminStudentService>;
    let courses: jasmine.SpyObj<CourseService>;
    let userCourses: jasmine.SpyObj<UserCourseService>;
    let userLessons: jasmine.SpyObj<UserLessonService>;
    let userQuizzes: jasmine.SpyObj<UserQuizService>;
    let achievements: jasmine.SpyObj<AchievementsService>;
    let xp: jasmine.SpyObj<XpService>;
    let seeds: jasmine.SpyObj<SeedService>;

    const student = (over: object = {}) => ({
        id: 's1', name: 'Maria Silva', email: 'maria@x.dev', avatar: '', isPro: false,
        createdAt: new Date(2026, 2, 5, 12), newsletterActive: false, termsAccepted: true, proUntil: null, ...over,
    });

    const curriculum = () => [{
        id: 'm1', title: 'HTML', avatar: '', icon: 'code',
        modules: [{
            id: 'sub1', title: 'Tags',
            lessons: [
                { id: 'l1', title: 'Aula 1', type: 'LESSON' },
                { id: 'l2', title: 'Aula 2', type: 'LESSON' },
                { id: 'l3', title: 'Quiz', type: 'QUIZ' },
                { id: 'l4', title: 'Revisão', type: 'REVISION' },
            ],
        }, { id: 'sub2', title: 'Vazio', lessons: [] }],
    }, { id: 'm2', title: 'CSS', avatar: '', icon: 'brush', modules: [] }];

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const tab = (label: string) =>
        (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(b => b.textContent!.includes(label))!;

    async function settle() {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function setup(id: string | null = 's1') {
        params$ = new BehaviorSubject(convertToParamMap(id ? { 'id-aluno': id } : {}));
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { paramMap: params$ } },
                { provide: AdminStudentService, useValue: students },
                { provide: CourseService, useValue: courses },
                { provide: UserCourseService, useValue: userCourses },
                { provide: UserLessonService, useValue: userLessons },
                { provide: UserQuizService, useValue: userQuizzes },
                { provide: AchievementsService, useValue: achievements },
                { provide: XpService, useValue: xp },
                { provide: SeedService, useValue: seeds },
            ],
        });
        fixture = TestBed.createComponent(AdminStudentDetail);
        component = fixture.componentInstance;
        await settle();
        await settle();
    }

    beforeEach(() => {
        students = jasmine.createSpyObj('AdminStudentService', ['getStudentById']);
        courses = jasmine.createSpyObj('CourseService', ['getCurriculum']);
        userCourses = jasmine.createSpyObj('UserCourseService', ['getUserCoursesForUser']);
        userLessons = jasmine.createSpyObj('UserLessonService', ['getUserLessonsForUser']);
        userQuizzes = jasmine.createSpyObj('UserQuizService', ['getUserQuizzesForUser']);
        achievements = jasmine.createSpyObj('AchievementsService', ['getAchievements', 'getUserAchievementsForUser']);
        xp = jasmine.createSpyObj('XpService', ['getXpForUser']);
        seeds = jasmine.createSpyObj('SeedService', ['getSeedsForUser']);

        students.getStudentById.and.resolveTo(student() as any);
        courses.getCurriculum.and.resolveTo(curriculum() as any);
        userCourses.getUserCoursesForUser.and.resolveTo([{ module_id: 'm1', completed: false }] as any);
        userLessons.getUserLessonsForUser.and.resolveTo([
            { lesson_id: 'l1', completed: true, score: 80 },
            { lesson: { id: 'l2' }, completed: false },
        ] as any);
        userQuizzes.getUserQuizzesForUser.and.resolveTo([
            { lessonId: 'l3', score: 0, completedAt: null },
            { lessonId: 'l3', score: 4, completedAt: new Date(2026, 0, 1) },
            { lessonId: 'l3', score: 90, completedAt: new Date(2026, 0, 2) },
            { lessonId: 'l3', score: 0, completedAt: new Date(2026, 0, 3) },
        ] as any);
        achievements.getAchievements.and.resolveTo([
            { id: 'a1', name: 'Aprendiz de Tags', identification: 'APRENDIZ_DE_TAGS', requirement: 'x', icon: '' },
            { id: 'a2', name: 'Imparável', identification: 'IMPARAVEL', requirement: 'y', icon: '' },
        ] as any);
        achievements.getUserAchievementsForUser.and.resolveTo([{ achievementId: 'a1', createdAt: new Date(2026, 5, 10, 12) }] as any);
        xp.getXpForUser.and.resolveTo(1234);
        seeds.getSeedsForUser.and.resolveTo(56);
    });

    describe('loading the student', () => {
        it('loads by the id in the route', async () => {
            await setup();
            expect(students.getStudentById).toHaveBeenCalledWith('s1');
            expect(component.studentId()).toBe('s1');
        });

        it('does not load without an id', async () => {
            await setup(null);
            expect(students.getStudentById).not.toHaveBeenCalled();
        });

        it('reloads when the route id changes', async () => {
            await setup();
            params$.next(convertToParamMap({ 'id-aluno': 's2' }));
            await settle();
            expect(students.getStudentById).toHaveBeenCalledWith('s2');
        });

        it('shows the name, e-mail and registration date', async () => {
            await setup();
            expect(text()).toContain('Maria Silva');
            expect(text()).toContain('maria@x.dev');
            expect(text()).toMatch(/Cadastrado em 05 mar\.? 2026/);
        });

        it('falls back to "Sem nome"', async () => {
            students.getStudentById.and.resolveTo(student({ name: '' }) as any);
            await setup();
            expect(text()).toContain('Sem nome');
        });

        it('shows an error with retry', async () => {
            students.getStudentById.and.rejectWith(new Error('não encontrado'));
            await setup();

            expect(text()).toContain('não encontrado');
            expect(component.student()).toBeNull();

            students.getStudentById.and.resolveTo(student() as any);
            tab('Tentar').click();
            await settle();
            await settle();

            expect(text()).toContain('Maria Silva');
        });

        it('uses a default error message', async () => {
            students.getStudentById.and.rejectWith({});
            await setup();
            expect(component.error()).toBe('Não foi possível carregar os dados do aluno.');
        });
    });

    describe('general tab', () => {
        it('shows inactive subscription, accepted terms and no newsletter by default', async () => {
            await setup();

            expect(text()).toContain('Inativa');
            expect(text()).toContain('Aceitos');
            expect(text()).toContain('Não inscrito');
            expect(text()).not.toContain('PRO Válida');
        });

        it('shows PRO status and its expiration', async () => {
            students.getStudentById.and.resolveTo(student({ isPro: true, proUntil: new Date(2027, 0, 31, 12), newsletterActive: true, termsAccepted: false }) as any);
            await setup();

            expect(text()).toContain('Ativa');
            expect(text()).toContain('Válida até 31/01/2027');
            expect(text()).toContain('Inscrito');
            expect(text()).toContain('Pendente');
        });
    });

    describe('progress', () => {
        beforeEach(() => setup());

        it('loads curriculum and the student progress', () => {
            expect(courses.getCurriculum).toHaveBeenCalled();
            expect(userCourses.getUserCoursesForUser).toHaveBeenCalledWith('s1');
            expect(userLessons.getUserLessonsForUser).toHaveBeenCalledWith('s1');
            expect(userQuizzes.getUserQuizzesForUser).toHaveBeenCalledWith('s1');
        });

        it('computes course and module percentages counting only lessons, quizzes and challenges', () => {
            const [html, css] = component.curriculum();

            expect(html.modules[0].lessons.map((l: any) => l.id)).toEqual(['l1', 'l2', 'l3']);
            expect(html.modules[0].progressPercentage).toBe(33);
            expect(html.progressPercentage).toBe(33);
            expect(html.modules[1].progressPercentage).toBe(0);
            expect(css.progressPercentage).toBe(0);
        });

        it('marks started and completed courses', () => {
            const [html, css] = component.curriculum();
            expect([html.isStarted, html.isCompleted]).toEqual([true, false]);
            expect([css.isStarted, css.isCompleted]).toEqual([false, false]);
        });

        it('attaches completion, score and quiz result to each lesson, reading both user lesson shapes', () => {
            const lessons = component.curriculum()[0].modules[0].lessons;

            expect(lessons[0]).toEqual(jasmine.objectContaining({ isCompleted: true, score: 80, quiz: null }));
            expect(lessons[1]).toEqual(jasmine.objectContaining({ isCompleted: false, score: null }));
            expect(lessons[2].quiz).toEqual(jasmine.objectContaining({ lessonId: 'l3', score: 90 }));
        });

        it('starts collapsed and expands courses and modules on demand', async () => {
            const [html] = component.curriculum();
            expect(html.expanded).toBeFalse();

            await (async () => {
                tab('Progresso nos Cursos').click();
                await settle();
            })();
            expect(text()).toContain('HTML');
            expect(text()).not.toContain('Aula 1');

            component.toggleCourse(html);
            await settle();
            expect(html.expanded).toBeTrue();
            expect(text()).toContain('Tags');

            component.toggleModule(html.modules[0]);
            await settle();
            expect(text()).toContain('Aula 1');

            component.toggleCourse(html);
            expect(html.expanded).toBeFalse();
        });

        it('keeps the page working when progress fails to load', async () => {
            spyOn(console, 'error');
            courses.getCurriculum.and.rejectWith(new Error('x'));
            students.getStudentById.and.resolveTo(student() as any);

            await component.loadProgress('s1');

            expect(component.isProgressLoading()).toBeFalse();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('achievements', () => {
        beforeEach(() => setup());

        it('loads xp, seeds and achievements of the student', () => {
            expect(xp.getXpForUser).toHaveBeenCalledWith('s1');
            expect(seeds.getSeedsForUser).toHaveBeenCalledWith('s1');
            expect(achievements.getUserAchievementsForUser).toHaveBeenCalledWith('s1');
            expect(component.totalXp()).toBe(1234);
            expect(component.totalSeeds()).toBe(56);
        });

        it('counts only earned achievements that still exist', async () => {
            expect(component.earnedAchievementsCount()).toBe(1);

            component.userAchievements.set([
                { achievementId: 'a1', createdAt: new Date() },
                { achievementId: 'removed', createdAt: new Date() },
            ]);
            expect(component.earnedAchievementsCount()).toBe(1);
        });

        it('knows which achievements were earned and when', () => {
            expect(component.isEarned('a1')).toBeTrue();
            expect(component.isEarned('a2')).toBeFalse();
            expect(component.getEarnedDate('a1')).toMatch(/^10 (DE )?JUN\.? (DE )?2026$/);
            expect(component.getEarnedDate('a2')).toBeNull();
        });

        it('has a gradient per achievement with a default for unknown ones', () => {
            expect(component.getGradientClasses('IMPARAVEL')).toBe('from-secondary to-error');
            expect(component.getGradientClasses('DESCONHECIDA')).toBe('from-primary to-tertiary');
        });

        it('lists the achievements in the tab', async () => {
            tab('Conquistas').click();
            await settle();

            expect(text()).toContain('Aprendiz de Tags');
            expect(text()).toContain('Imparável');
        });

        it('keeps the page working when gamification fails to load', async () => {
            spyOn(console, 'error');
            xp.getXpForUser.and.rejectWith(new Error('x'));

            await component.loadGamification('s1');

            expect(component.isGamificationLoading()).toBeFalse();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('tabs', () => {
        beforeEach(() => setup());

        it('starts on the general tab and switches between them', async () => {
            expect(component.activeTab()).toBe('general');
            expect(text()).toContain('Informações Adicionais');

            tab('Progresso nos Cursos').click();
            await settle();
            expect(component.activeTab()).toBe('progress');
            expect(text()).not.toContain('Informações Adicionais');

            tab('Conquistas').click();
            await settle();
            expect(component.activeTab()).toBe('achievements');

            tab('Informações Gerais').click();
            await settle();
            expect(text()).toContain('Informações Adicionais');
        });
    });
});
