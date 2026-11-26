import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TrackService } from '../../../services/track';
import { Courses } from './courses';
import { CourseService } from '../../../services/course';
import { UserCourseService } from '../../../services/user-course';
import { LessonService } from '../../../services/lesson';
import { ModuleService } from '../../../services/module';
import { UserLessonService } from '../../../services/user-lesson';
import { RankingWeeklyService } from '../../../services/ranking-weekly';
import { UserService } from '../../../services/user';

registerLocaleData(localePt);

describe('Courses page and module publication', () => {
    const course = (id: string) => ({ id, slug: `slug-${id}`, title: `Curso ${id}`, description: `Desc ${id}`, icon: null, avatar: null, inRevision: false });

    async function render(summaries: { id: string; courseId: string; published: boolean }[] | 'fails', userLessons: object[] = []) {
        const moduleService = jasmine.createSpyObj('ModuleService', ['getModuleSummaries']);
        if (summaries === 'fails') moduleService.getModuleSummaries.and.rejectWith(new Error('down'));
        else moduleService.getModuleSummaries.and.resolveTo(summaries);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: LOCALE_ID, useValue: 'pt-BR' },
                { provide: UserService, useValue: { currentUser: signal({ id: 'u1', isPro: false }), loadUserProfile: () => Promise.resolve() } },
                { provide: CourseService, useValue: { getCoursesForDisplay: () => Promise.resolve([course('a'), course('b'), course('c')]) } },
                { provide: UserCourseService, useValue: { getUserCoursesForUser: () => Promise.resolve([{ module_id: 'a', completed: false }]), startCourse: () => Promise.resolve() } },
                {
                    provide: LessonService,
                    useValue: {
                        getLessonsLightweight: () => Promise.resolve([
                            { id: 'l1', moduleId: 'a1', courseId: 'a' },
                            { id: 'l2', moduleId: 'a1', courseId: 'a' },
                        ]),
                    },
                },
                { provide: UserLessonService, useValue: { getUserLessonsForUser: () => Promise.resolve(userLessons) } },
                { provide: RankingWeeklyService, useValue: { getRanking: () => Promise.resolve({ ranking: [], currentUser: { position: null, xp: 0 } }) } },
                { provide: TrackService, useValue: { getPublishedTracks: () => Promise.resolve([]) } },
                { provide: ModuleService, useValue: moduleService },
                { provide: ActivatedRoute, useValue: { snapshot: { fragment: null } } },
            ],
        });
        const fixture = TestBed.createComponent(Courses);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement.textContent as string;
    }

    it('lists a course only when it has at least one published module', async () => {
        const text = await render([
            { id: 'a1', courseId: 'a', published: true },
            { id: 'b1', courseId: 'b', published: false },
            { id: 'b2', courseId: 'b', published: false },
            { id: 'c1', courseId: 'c', published: false },
            { id: 'c2', courseId: 'c', published: true },
        ]);

        expect(text).toContain('Curso a');
        expect(text).not.toContain('Curso b');
        expect(text).toContain('Curso c');
    });

    it('keeps the list working when the module summaries cannot be loaded', async () => {
        const text = await render('fails');

        expect(text).toContain('Curso a');
        expect(text).not.toContain('Erro ao carregar cursos');
    });

    it('calculates the progress over every module, the unpublished ones counting as zero', async () => {
        const text = await render(
            [
                { id: 'a1', courseId: 'a', published: true },
                { id: 'a2', courseId: 'a', published: false },
            ],
            [{ lesson_id: 'l1', completed: true }, { lesson_id: 'l2', completed: true }],
        );

        expect(text).toContain('50%');
    });
});
