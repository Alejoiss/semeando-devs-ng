import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Modules } from './modules';
import { ModuleService } from '../../../services/module';
import { UserModuleService } from '../../../services/user-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { RankingWeeklyService } from '../../../services/ranking-weekly';
import { UserService } from '../../../services/user';

registerLocaleData(localePt);

describe('Modules page', () => {
    let fixture: ComponentFixture<Modules>;
    let currentUser: ReturnType<typeof signal<any>>;
    let moduleService: jasmine.SpyObj<ModuleService>;
    let userModuleService: jasmine.SpyObj<UserModuleService>;
    let lessonService: jasmine.SpyObj<LessonService>;
    let userLessonService: jasmine.SpyObj<UserLessonService>;
    let rankingService: jasmine.SpyObj<RankingWeeklyService>;
    let userService: { currentUser: typeof currentUser; loadUserProfile: jasmine.Spy };
    let navigate: jasmine.Spy;

    const mod = (id: string, over: object = {}) => ({
        id, slug: `slug-${id}`, title: `Módulo ${id}`, description: `Desc ${id}`, icon: null, avatar: null, inRevision: false, ...over,
    });

    const ranking = (n = 5, me: { position: number | null; xp: number } = { position: 7, xp: 1234 }) => ({
        ranking: Array.from({ length: n }, (_, i) => ({
            position: i + 1, userId: `u${i}`, name: `Aluno ${i + 1}`, avatar: null, xp: 1000 - i * 10, is_pro: false,
        })),
        currentUser: me,
    });

    function setup() {
        fixture = TestBed.createComponent(Modules);
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
        moduleService = jasmine.createSpyObj('ModuleService', ['getModulesForDisplay']);
        userModuleService = jasmine.createSpyObj('UserModuleService', ['getUserModulesForUser', 'startModule']);
        lessonService = jasmine.createSpyObj('LessonService', ['getLessonsLightweight']);
        userLessonService = jasmine.createSpyObj('UserLessonService', ['getUserLessonsForUser']);
        rankingService = jasmine.createSpyObj('RankingWeeklyService', ['getRanking']);

        moduleService.getModulesForDisplay.and.resolveTo([mod('a'), mod('b'), mod('c'), mod('rev', { inRevision: true })] as any);
        userModuleService.getUserModulesForUser.and.resolveTo([
            { module_id: 'b', completed: false },
            { module_id: 'c', completed: true },
        ]);
        userModuleService.startModule.and.resolveTo();
        lessonService.getLessonsLightweight.and.resolveTo([
            { id: 'l1', subModuleId: 's', moduleId: 'b' },
            { id: 'l2', subModuleId: 's', moduleId: 'b' },
            { id: 'l3', subModuleId: 's', moduleId: 'b' },
            { id: 'l4', subModuleId: 's', moduleId: 'b' },
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
                { provide: ModuleService, useValue: moduleService },
                { provide: UserModuleService, useValue: userModuleService },
                { provide: LessonService, useValue: lessonService },
                { provide: UserLessonService, useValue: userLessonService },
                { provide: RankingWeeklyService, useValue: rankingService },
            ],
        });
        navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    });

    it('does not show the modules or an error while loading', () => {
        moduleService.getModulesForDisplay.and.returnValue(new Promise(() => undefined));
        setup();

        expect(text()).not.toContain('Módulo a');
        expect(text()).not.toContain('Erro ao carregar módulos');
    });

    it('lists the modules except the ones in revision', async () => {
        setup();
        await settle();

        expect(text()).toContain('Módulo a');
        expect(text()).toContain('Módulo b');
        expect(text()).toContain('Módulo c');
        expect(text()).not.toContain('Módulo rev');
    });

    it('shows the right state and action for not started, in progress and completed modules', async () => {
        setup();
        await settle();

        expect(text()).toContain('Não iniciado');
        expect(text()).toContain('50% concluído');
        expect(text()).toContain('Concluído');
        expect(button('Iniciar')).toBeTruthy();
        expect(button('Continuar')).toBeTruthy();
        expect(button('Revisar')).toBeTruthy();
    });

    it('computes progress from completed lessons of the module, reading both lesson shapes', async () => {
        setup();
        await settle();

        const bars = Array.from(fixture.nativeElement.querySelectorAll('[style*="width"]')) as HTMLElement[];
        expect(bars.map(b => b.style.width)).toEqual(['0%', '50%', '100%']);
    });

    it('shows 0% for a started module with no lessons', async () => {
        lessonService.getLessonsLightweight.and.resolveTo([]);
        setup();
        await settle();

        expect(text()).toContain('0% concluído');
    });

    it('shows an empty message when there are no modules', async () => {
        moduleService.getModulesForDisplay.and.resolveTo([mod('rev', { inRevision: true })] as any);
        setup();
        await settle();

        expect(text()).toContain('Nenhum módulo disponível no momento.');
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
            expect(userModuleService.getUserModulesForUser).toHaveBeenCalledWith('u9');
        });

        it('does not reload the profile when the user is already known', async () => {
            setup();
            await settle();

            expect(userService.loadUserProfile).not.toHaveBeenCalled();
            expect(userModuleService.getUserModulesForUser).toHaveBeenCalledWith('u1');
            expect(userLessonService.getUserLessonsForUser).toHaveBeenCalledWith('u1');
        });

        it('shows an error when nobody is logged in', async () => {
            currentUser.set(null);
            setup();
            await settle();

            expect(text()).toContain('Erro ao carregar módulos');
            expect(text()).toContain('Usuário não autenticado.');
            expect(moduleService.getModulesForDisplay).not.toHaveBeenCalled();
        });

        it('shows the error message when a request fails', async () => {
            moduleService.getModulesForDisplay.and.rejectWith(new Error('falhou'));
            setup();
            await settle();

            expect(text()).toContain('Erro ao carregar módulos');
            expect(text()).toContain('falhou');
        });

        it('shows a default error message for non-Error rejections', async () => {
            moduleService.getModulesForDisplay.and.rejectWith('x');
            setup();
            await settle();

            expect(text()).toContain('Erro ao carregar os módulos.');
        });
    });

    describe('starting a module', () => {
        it('starts it and navigates to its page', async () => {
            setup();
            await settle();

            button('Iniciar')!.click();
            await settle();

            expect(userModuleService.startModule).toHaveBeenCalledWith('a');
            expect(navigate).toHaveBeenCalledWith(['/app/s', 'slug-a']);
        });

        it('does not navigate when starting fails', async () => {
            spyOn(console, 'error');
            userModuleService.startModule.and.rejectWith(new Error('x'));
            setup();
            await settle();

            button('Iniciar')!.click();
            await settle();

            expect(navigate).not.toHaveBeenCalled();
        });
    });
});
