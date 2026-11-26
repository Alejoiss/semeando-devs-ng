import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { TrackService } from '../../../services/track';
import { Courses } from './courses';
import { CourseService } from '../../../services/course';
import { UserCourseService } from '../../../services/user-course';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { RankingWeeklyService } from '../../../services/ranking-weekly';
import { UserService } from '../../../services/user';

registerLocaleData(localePt);

describe('Courses page', () => {
    let fixture: ComponentFixture<Courses>;
    let currentUser: ReturnType<typeof signal<any>>;
    let courseService: jasmine.SpyObj<CourseService>;
    let userCourseService: jasmine.SpyObj<UserCourseService>;
    let lessonService: jasmine.SpyObj<LessonService>;
    let userLessonService: jasmine.SpyObj<UserLessonService>;
    let rankingService: jasmine.SpyObj<RankingWeeklyService>;
    let userService: { currentUser: typeof currentUser; loadUserProfile: jasmine.Spy };
    let navigate: jasmine.Spy;
    let trackService: jasmine.SpyObj<TrackService>;
    let fragment: string | null;

    const mod = (id: string, over: object = {}) => ({
        id, slug: `slug-${id}`, title: `Curso ${id}`, description: `Desc ${id}`, icon: null, avatar: null, inRevision: false, ...over,
    });

    const ranking = (n = 5, me: { position: number | null; xp: number } = { position: 7, xp: 1234 }) => ({
        ranking: Array.from({ length: n }, (_, i) => ({
            position: i + 1, userId: `u${i}`, name: `Aluno ${i + 1}`, avatar: null, xp: 1000 - i * 10, is_pro: false,
        })),
        currentUser: me,
    });

    function setup() {
        fixture = TestBed.createComponent(Courses);
        fixture.detectChanges();
    }

    async function settle() {
        await fixture.whenStable();
        fixture.detectChanges();
    }

    const text = () => fixture.nativeElement.textContent as string;
    const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const button = (label: string) => buttons().find(b => b.textContent!.includes(label));

    beforeEach(() => {
        currentUser = signal({ id: 'u1', isPro: false });
        userService = { currentUser, loadUserProfile: jasmine.createSpy('loadUserProfile').and.resolveTo() };
        courseService = jasmine.createSpyObj('CourseService', ['getCoursesForDisplay']);
        userCourseService = jasmine.createSpyObj('UserCourseService', ['getUserCoursesForUser', 'startCourse']);
        lessonService = jasmine.createSpyObj('LessonService', ['getLessonsLightweight']);
        userLessonService = jasmine.createSpyObj('UserLessonService', ['getUserLessonsForUser']);
        rankingService = jasmine.createSpyObj('RankingWeeklyService', ['getRanking']);
        trackService = jasmine.createSpyObj('TrackService', ['getPublishedTracks']);
        trackService.getPublishedTracks.and.resolveTo([]);
        fragment = null;

        courseService.getCoursesForDisplay.and.resolveTo([mod('a'), mod('b'), mod('c'), mod('rev', { inRevision: true })] as any);
        userCourseService.getUserCoursesForUser.and.resolveTo([
            { module_id: 'b', completed: false },
            { module_id: 'c', completed: true },
        ]);
        userCourseService.startCourse.and.resolveTo();
        lessonService.getLessonsLightweight.and.resolveTo([
            { id: 'l1', moduleId: 's', courseId: 'b' },
            { id: 'l2', moduleId: 's', courseId: 'b' },
            { id: 'l3', moduleId: 's', courseId: 'b' },
            { id: 'l4', moduleId: 's', courseId: 'b' },
        ]);
        userLessonService.getUserLessonsForUser.and.resolveTo([
            { lesson_id: 'l1', completed: true },
            { lesson: { id: 'l2' }, completed: true },
            { lesson_id: 'l3', completed: false },
        ]);
        rankingService.getRanking.and.resolveTo(ranking() as any);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: LOCALE_ID, useValue: 'pt-BR' },
                { provide: UserService, useValue: userService },
                { provide: CourseService, useValue: courseService },
                { provide: UserCourseService, useValue: userCourseService },
                { provide: LessonService, useValue: lessonService },
                { provide: UserLessonService, useValue: userLessonService },
                { provide: RankingWeeklyService, useValue: rankingService },
                { provide: TrackService, useValue: trackService },
                { provide: ActivatedRoute, useValue: { snapshot: { get fragment() { return fragment; } } } },
            ],
        });
        navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    });

    it('does not show the courses or an error while loading', () => {
        courseService.getCoursesForDisplay.and.returnValue(new Promise(() => undefined));
        setup();

        expect(text()).not.toContain('Curso a');
        expect(text()).not.toContain('Erro ao carregar cursos');
    });

    it('lists the courses except the ones in revision', async () => {
        setup();
        await settle();

        expect(text()).toContain('Curso a');
        expect(text()).toContain('Curso b');
        expect(text()).toContain('Curso c');
        expect(text()).not.toContain('Curso rev');
    });

    it('shows the right state and action for not started, in progress and completed courses', async () => {
        setup();
        await settle();

        expect(text()).toContain('Não iniciado');
        expect(text()).toContain('50% concluído');
        expect(text()).toContain('Concluído');
        expect(button('Iniciar')).toBeTruthy();
        expect(button('Continuar')).toBeTruthy();
        expect(button('Revisar')).toBeTruthy();
    });

    it('computes progress from completed lessons of the course, reading both lesson shapes', async () => {
        setup();
        await settle();

        const bars = Array.from(fixture.nativeElement.querySelectorAll('[style*="width"]')) as HTMLElement[];
        expect(bars.map(b => b.style.width)).toEqual(['0%', '50%', '100%']);
    });

    it('shows 0% for a started course with no lessons', async () => {
        lessonService.getLessonsLightweight.and.resolveTo([]);
        setup();
        await settle();

        expect(text()).toContain('0% concluído');
    });

    it('shows an empty message when there are no courses', async () => {
        courseService.getCoursesForDisplay.and.resolveTo([mod('rev', { inRevision: true })] as any);
        setup();
        await settle();

        expect(text()).toContain('Nenhum curso disponível no momento.');
    });

    it('shows only the top 3 of the ranking and the position of the user', async () => {
        setup();
        await settle();

        expect(text()).toContain('Aluno 1');
        expect(text()).toContain('Aluno 3');
        expect(text()).not.toContain('Aluno 4');
        expect(text()).toContain('7º');
        expect(text()).toContain('1.234');
    });

    it('hides the user position when they are not ranked yet', async () => {
        rankingService.getRanking.and.resolveTo(ranking(3, { position: null, xp: 0 }) as any);
        setup();
        await settle();

        expect(text()).not.toContain('Você');
    });

    describe('loading the user', () => {
        it('loads the profile first when there is no current user', async () => {
            currentUser.set(null);
            userService.loadUserProfile.and.callFake(async () => currentUser.set({ id: 'u9', isPro: false }));
            setup();
            await settle();

            expect(userService.loadUserProfile).toHaveBeenCalled();
            expect(userCourseService.getUserCoursesForUser).toHaveBeenCalledWith('u9');
        });

        it('does not reload the profile when the user is already known', async () => {
            setup();
            await settle();

            expect(userService.loadUserProfile).not.toHaveBeenCalled();
            expect(userCourseService.getUserCoursesForUser).toHaveBeenCalledWith('u1');
            expect(userLessonService.getUserLessonsForUser).toHaveBeenCalledWith('u1');
        });

        it('shows an error when nobody is logged in', async () => {
            currentUser.set(null);
            setup();
            await settle();

            expect(text()).toContain('Erro ao carregar cursos');
            expect(text()).toContain('Usuário não autenticado.');
            expect(courseService.getCoursesForDisplay).not.toHaveBeenCalled();
        });

        it('shows the error message when a request fails', async () => {
            courseService.getCoursesForDisplay.and.rejectWith(new Error('falhou'));
            setup();
            await settle();

            expect(text()).toContain('Erro ao carregar cursos');
            expect(text()).toContain('falhou');
        });

        it('shows a default error message for non-Error rejections', async () => {
            courseService.getCoursesForDisplay.and.rejectWith('x');
            setup();
            await settle();

            expect(text()).toContain('Erro ao carregar os cursos.');
        });
    });

    describe('tracks', () => {
        const track = (id: string, courseIds: string[], over: object = {}) => ({
            id, slug: id, title: `Trilha ${id}`, description: '', icon: null, order: 1, published: true,
            courses: courseIds.map(c => mod(c)), ...over,
        });
        const header = (title: string) =>
            buttons().find(b => b.textContent!.includes(title)) as HTMLButtonElement;

        it('keeps the courses inside collapsed tracks and expands on click', async () => {
            trackService.getPublishedTracks.and.resolveTo([track('t1', ['a']), track('t2', ['b'])] as any);
            setup();
            await settle();

            expect(header('Trilha t2').getAttribute('aria-expanded')).toBe('true');
            expect(header('Trilha t1').getAttribute('aria-expanded')).toBe('false');
            expect(text()).not.toContain('Curso a');

            header('Trilha t1').click();
            await settle();

            expect(header('Trilha t1').getAttribute('aria-expanded')).toBe('true');
            expect(text()).toContain('Curso a');
        });

        it('opens the first track when none is in progress', async () => {
            userCourseService.getUserCoursesForUser.and.resolveTo([]);
            trackService.getPublishedTracks.and.resolveTo([track('t1', ['a']), track('t2', ['b'])] as any);
            setup();
            await settle();

            expect(header('Trilha t1').getAttribute('aria-expanded')).toBe('true');
            expect(header('Trilha t2').getAttribute('aria-expanded')).toBe('false');
        });

        it('opens the track named in the URL fragment', async () => {
            fragment = 't1';
            trackService.getPublishedTracks.and.resolveTo([track('t1', ['a']), track('t2', ['b'])] as any);
            setup();
            await settle();

            expect(header('Trilha t1').getAttribute('aria-expanded')).toBe('true');
            expect(header('Trilha t2').getAttribute('aria-expanded')).toBe('false');
        });

        it('summarizes completed courses and ignores courses in revision', async () => {
            trackService.getPublishedTracks.and.resolveTo([track('t1', ['b', 'c', 'rev'])] as any);
            setup();
            await settle();

            expect(header('Trilha t1').textContent).toContain('1/2');
        });

        it('lists courses without a track under "Outros cursos" and hides empty tracks', async () => {
            trackService.getPublishedTracks.and.resolveTo([track('t1', ['a']), track('vazia', ['rev'])] as any);
            setup();
            await settle();

            expect(header('Trilha vazia')).toBeUndefined();
            expect(text()).toContain('Outros cursos');
            expect(text()).toContain('Curso b');
            expect(text()).toContain('Curso c');
        });

        it('falls back to the flat course list when tracks fail to load', async () => {
            trackService.getPublishedTracks.and.rejectWith(new Error('x'));
            setup();
            await settle();

            expect(text()).toContain('Curso a');
            expect(text()).not.toContain('Outros cursos');
        });

        it('starts a course from inside a track', async () => {
            trackService.getPublishedTracks.and.resolveTo([track('t1', ['a'])] as any);
            setup();
            await settle();

            button('Iniciar')!.click();
            await settle();

            expect(userCourseService.startCourse).toHaveBeenCalledWith('a');
        });
    });

    describe('starting a course', () => {
        it('starts it and navigates to its page', async () => {
            setup();
            await settle();

            button('Iniciar')!.click();
            await settle();

            expect(userCourseService.startCourse).toHaveBeenCalledWith('a');
            expect(navigate).toHaveBeenCalledWith(['/app/c', 'slug-a']);
        });

        it('does not navigate when starting fails', async () => {
            spyOn(console, 'error');
            userCourseService.startCourse.and.rejectWith(new Error('x'));
            setup();
            await settle();

            button('Iniciar')!.click();
            await settle();

            expect(navigate).not.toHaveBeenCalled();
        });
    });
});
