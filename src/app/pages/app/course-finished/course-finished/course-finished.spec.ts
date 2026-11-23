import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CourseFinished } from './course-finished';
import { CourseService } from '../../../../services/course';
import { AchievementsService } from '../../../../services/achievements';
import { UserCourseService } from '../../../../services/user-course';
import { Course } from '../../../../../models/course/course';
import { Achievements } from '../../../../../models/achievements/achievements';

const mockCourse: Course = {
    id: 'mod-1',
    title: 'HTML Essencial',
    description: 'Curso de HTML',
    avatar: 'avatar.png',
    icon: 'icon.png',
    slug: 'html-essencial',
    inRevision: false,
};

const mockAchievement = new Achievements({
    id: 'ach-1',
    name: 'Aprendiz de Tags',
    icon: 'tags.png',
    identification: 'APRENDIZ_DE_TAGS',
    requirement: 'Conclua o curso de HTML',
    module_id: 'mod-1',
    xp_amount: 500,
    created_at: new Date().toISOString(),
});

describe('CourseFinished', () => {
    let component: CourseFinished;
    let fixture: ComponentFixture<CourseFinished>;
    let courseServiceSpy: jasmine.SpyObj<CourseService>;
    let achievementsServiceSpy: jasmine.SpyObj<AchievementsService>;
    let userCourseServiceSpy: jasmine.SpyObj<UserCourseService>;

    beforeEach(async () => {
        courseServiceSpy = jasmine.createSpyObj('CourseService', ['getCourseBySlug']);
        achievementsServiceSpy = jasmine.createSpyObj('AchievementsService', ['getAchievements']);
        userCourseServiceSpy = jasmine.createSpyObj('UserCourseService', ['isCourseCompleted']);
        userCourseServiceSpy.isCourseCompleted.and.resolveTo(true);

        await TestBed.configureTestingModule({
            imports: [CourseFinished, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => 'html-essencial' } } },
                },
                { provide: CourseService, useValue: courseServiceSpy },
                { provide: AchievementsService, useValue: achievementsServiceSpy },
                { provide: UserCourseService, useValue: userCourseServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CourseFinished);
        component = fixture.componentInstance;
    });

    it('shows loading state before data is fetched', () => {
        courseServiceSpy.getCourseBySlug.and.returnValue(new Promise(() => {}));
        achievementsServiceSpy.getAchievements.and.returnValue(new Promise(() => {}));

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('[class*="animate-pulse"]')).toBeTruthy();
        expect(el.querySelector('h1')).toBeNull();
    });

    it('redirects to /app when the course is not completed', async () => {
        courseServiceSpy.getCourseBySlug.and.resolveTo(mockCourse);
        achievementsServiceSpy.getAchievements.and.resolveTo([mockAchievement]);
        userCourseServiceSpy.isCourseCompleted.and.resolveTo(false);
        const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(userCourseServiceSpy.isCourseCompleted).toHaveBeenCalledWith('mod-1');
        expect(navigateSpy).toHaveBeenCalledWith(['/app']);
        expect(fixture.nativeElement.textContent).not.toContain('Parabéns');
    });

    it('shows the error state when course is not found', async () => {
        courseServiceSpy.getCourseBySlug.and.resolveTo(null);
        achievementsServiceSpy.getAchievements.and.resolveTo([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('Curso não encontrado');
    });

    it('displays congratulations heading with course name', async () => {
        courseServiceSpy.getCourseBySlug.and.resolveTo(mockCourse);
        achievementsServiceSpy.getAchievements.and.resolveTo([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('Parabéns! Você concluiu o curso');
        expect(el.textContent).toContain(mockCourse.title);
    });

    it('shows achievement card with name, icon, and XP when courseId matches', async () => {
        courseServiceSpy.getCourseBySlug.and.resolveTo(mockCourse);
        achievementsServiceSpy.getAchievements.and.resolveTo([mockAchievement]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain(mockAchievement.name);
        expect(el.textContent).toContain(String(mockAchievement.xpAmount));
        const img = el.querySelector('img[alt="' + mockAchievement.name + '"]') as HTMLImageElement;
        expect(img).toBeTruthy();
        expect(img.src).toContain(mockAchievement.icon);
    });

    it('hides achievement section when no achievement matches the courseId', async () => {
        const otherAchievement = new Achievements({
            id: 'ach-2',
            name: 'Outra Conquista',
            icon: 'other.png',
            identification: 'OUTRO',
            requirement: 'Req',
            module_id: 'mod-999',
            xp_amount: 100,
            created_at: new Date().toISOString(),
        });

        courseServiceSpy.getCourseBySlug.and.resolveTo(mockCourse);
        achievementsServiceSpy.getAchievements.and.resolveTo([otherAchievement]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).not.toContain('Conquista Desbloqueada');
        expect(el.textContent).not.toContain(otherAchievement.name);
    });

    it('displays correct Seeds amount computed from xpAmount', async () => {
        courseServiceSpy.getCourseBySlug.and.resolveTo(mockCourse);
        achievementsServiceSpy.getAchievements.and.resolveTo([mockAchievement]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const expectedSeeds = Math.ceil(mockAchievement.xpAmount * 0.1);
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain(String(expectedSeeds));
        const seedIcon = el.querySelector('img[alt="Seeds"]') as HTMLImageElement;
        expect(seedIcon).toBeTruthy();
    });

    it('renders navigation button to courses list with correct routerLink', async () => {
        courseServiceSpy.getCourseBySlug.and.resolveTo(mockCourse);
        achievementsServiceSpy.getAchievements.and.resolveTo([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('#btn-courses-list') as HTMLAnchorElement;
        expect(btn).toBeTruthy();
        expect(btn.getAttribute('href')).toBe('/app');
    });

    it('renders navigation button to achievements with correct routerLink', async () => {
        courseServiceSpy.getCourseBySlug.and.resolveTo(mockCourse);
        achievementsServiceSpy.getAchievements.and.resolveTo([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('#btn-achievements') as HTMLAnchorElement;
        expect(btn).toBeTruthy();
        expect(btn.getAttribute('href')).toBe('/app/conquistas');
    });
});
