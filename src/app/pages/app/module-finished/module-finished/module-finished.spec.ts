import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ModuleFinished } from './module-finished';
import { ModuleService } from '../../../../services/module';
import { AchievementsService } from '../../../../services/achievements';
import { Module } from '../../../../../models/module/module';
import { Achievements } from '../../../../../models/achievements/achievements';

const mockModule: Module = {
    id: 'mod-1',
    title: 'HTML Essencial',
    description: 'Módulo de HTML',
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
    requirement: 'Conclua o módulo de HTML',
    module_id: 'mod-1',
    xp_amount: 500,
    created_at: new Date().toISOString(),
});

describe('ModuleFinished', () => {
    let component: ModuleFinished;
    let fixture: ComponentFixture<ModuleFinished>;
    let moduleServiceSpy: jasmine.SpyObj<ModuleService>;
    let achievementsServiceSpy: jasmine.SpyObj<AchievementsService>;

    beforeEach(async () => {
        moduleServiceSpy = jasmine.createSpyObj('ModuleService', ['getModuleBySlug']);
        achievementsServiceSpy = jasmine.createSpyObj('AchievementsService', ['getAchievements']);

        await TestBed.configureTestingModule({
            imports: [ModuleFinished, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => 'html-essencial' } } },
                },
                { provide: ModuleService, useValue: moduleServiceSpy },
                { provide: AchievementsService, useValue: achievementsServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ModuleFinished);
        component = fixture.componentInstance;
    });

    it('shows loading state before data is fetched', () => {
        moduleServiceSpy.getModuleBySlug.and.returnValue(new Promise(() => {}));
        achievementsServiceSpy.getAchievements.and.returnValue(new Promise(() => {}));

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('[class*="animate-pulse"]')).toBeTruthy();
        expect(el.querySelector('h1')).toBeNull();
    });

    it('shows the error state when module is not found', async () => {
        moduleServiceSpy.getModuleBySlug.and.resolveTo(null);
        achievementsServiceSpy.getAchievements.and.resolveTo([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('Módulo não encontrado');
    });

    it('displays congratulations heading with module name', async () => {
        moduleServiceSpy.getModuleBySlug.and.resolveTo(mockModule);
        achievementsServiceSpy.getAchievements.and.resolveTo([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('Parabéns! Você concluiu o módulo');
        expect(el.textContent).toContain(mockModule.title);
    });

    it('shows achievement card with name, icon, and XP when moduleId matches', async () => {
        moduleServiceSpy.getModuleBySlug.and.resolveTo(mockModule);
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

    it('hides achievement section when no achievement matches the moduleId', async () => {
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

        moduleServiceSpy.getModuleBySlug.and.resolveTo(mockModule);
        achievementsServiceSpy.getAchievements.and.resolveTo([otherAchievement]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).not.toContain('Conquista Desbloqueada');
        expect(el.textContent).not.toContain(otherAchievement.name);
    });

    it('displays correct Seeds amount computed from xpAmount', async () => {
        moduleServiceSpy.getModuleBySlug.and.resolveTo(mockModule);
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

    it('renders navigation button to modules list with correct routerLink', async () => {
        moduleServiceSpy.getModuleBySlug.and.resolveTo(mockModule);
        achievementsServiceSpy.getAchievements.and.resolveTo([]);

        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('#btn-modules-list') as HTMLAnchorElement;
        expect(btn).toBeTruthy();
        expect(btn.getAttribute('href')).toBe('/app');
    });

    it('renders navigation button to achievements with correct routerLink', async () => {
        moduleServiceSpy.getModuleBySlug.and.resolveTo(mockModule);
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
