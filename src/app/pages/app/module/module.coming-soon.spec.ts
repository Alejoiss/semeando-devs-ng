import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ModulePage } from './module';
import { ModuleService } from '../../../services/module';
import { UserModuleService } from '../../../services/user-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { CourseService } from '../../../services/course';
import { AchievementsService } from '../../../services/achievements';
import { SectionContentService } from '../../../services/section-content';
import { UserService } from '../../../services/user';

describe('ModulePage with modules that are coming soon', () => {
    let fixture: ComponentFixture<ModulePage>;

    const mod = (id: string, order: number, published: boolean | undefined) => ({
        id, slug: `slug-${id}`, title: `Módulo ${id}`, description: `Desc ${id}`, icon: null, order, published,
    });

    async function render(modules: object[], userModules: object[] = []) {
        await TestBed.configureTestingModule({
            imports: [ModulePage],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'curso' } } } },
                { provide: ModuleService, useValue: { getModulesByCourseSlug: () => Promise.resolve(modules) } },
                { provide: UserModuleService, useValue: { getUserModulesForUser: () => Promise.resolve(userModules) } },
                { provide: LessonService, useValue: { getLessonsByCourseSlug: () => Promise.resolve([{ id: 'l1', moduleId: 'a', order: 1 }]) } },
                { provide: UserLessonService, useValue: { getUserLessonsForUser: () => Promise.resolve([]) } },
                { provide: CourseService, useValue: { getCourseBySlug: () => Promise.resolve({ id: 'c1', title: 'Curso', slug: 'curso', inRevision: false }) } },
                { provide: AchievementsService, useValue: { getAchievementByCourseId: () => Promise.resolve(null) } },
                { provide: SectionContentService, useValue: { getSectionContentsByCourseId: () => Promise.resolve([]) } },
                { provide: UserService, useValue: { currentUser: () => ({ id: 'u1', isPro: false }), loadUserProfile: () => Promise.resolve() } },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ModulePage);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    const el = () => fixture.nativeElement as HTMLElement;
    const comingSoon = () => Array.from(el().querySelectorAll('[data-testid="coming-soon-module"]'));

    it('shows unpublished modules as "Em breve" with no start button', async () => {
        await render([mod('a', 1, true), mod('b', 2, false)]);

        expect(comingSoon().length).toBe(1);
        expect(comingSoon()[0].textContent).toContain('Módulo b');
        expect(comingSoon()[0].textContent).toContain('Em breve');
        expect(comingSoon()[0].querySelector('button, a')).toBeNull();
        expect(el().textContent).toContain('Iniciar');
    });

    it('announces how many modules are coming soon', async () => {
        await render([mod('a', 1, true), mod('b', 2, false), mod('c', 3, false)]);

        const banner = el().querySelector('[data-testid="coming-soon-banner"]')!;
        expect(banner.getAttribute('role')).toBe('status');
        expect(banner.textContent).toContain('2 módulos deste curso serão liberados em breve');
    });

    it('uses the singular for a single module', async () => {
        await render([mod('a', 1, true), mod('b', 2, false)]);

        expect(el().querySelector('[data-testid="coming-soon-banner"]')!.textContent).toContain('1 módulo deste curso será liberado em breve');
    });

    it('shows no banner when every module is published', async () => {
        await render([mod('a', 1, true), mod('b', 2, undefined)]);

        expect(comingSoon().length).toBe(0);
        expect(el().querySelector('[data-testid="coming-soon-banner"]')).toBeNull();
    });

    it('does not let a module that is coming soon block the next published one', async () => {
        await render([mod('a', 1, true), mod('b', 2, false), mod('c', 3, true)], [{ sub_module_id: 'a', completed: true }]);

        const states = (fixture.componentInstance as any).modulesWithState().map((m: any) => m.progressState);
        expect(states).toEqual(['completed', 'coming-soon', 'not-started']);
    });
});
