import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Achievements } from './achievements';
import { AchievementsService } from '../../../services/achievements';
import { XpService } from '../../../services/xp';
import { SeedService } from '../../../services/seed';
import { signal } from '@angular/core';
import { Achievements as AchievementModel } from '../../../../models/achievements/achievements';
import { UserAchievement } from '../../../../models/user-achievement/user-achievement';

describe('Achievements Component', () => {
    let component: Achievements;
    let fixture: ComponentFixture<Achievements>;
    let achievementsServiceSpy: jasmine.SpyObj<AchievementsService>;
    let xpServiceSpy: jasmine.SpyObj<XpService>;
    let seedServiceSpy: jasmine.SpyObj<SeedService>;

    beforeEach(async () => {
        achievementsServiceSpy = jasmine.createSpyObj('AchievementsService', [
            'getAchievements',
            'getUserAchievements'
        ]);
        xpServiceSpy = jasmine.createSpyObj('XpService', ['getXp']);
        seedServiceSpy = jasmine.createSpyObj('SeedService', ['getSeeds']);

        // Mock totalXp and totalSeeds signals
        (xpServiceSpy as any).totalXp = signal(1200);
        (seedServiceSpy as any).totalSeeds = signal(150);

        xpServiceSpy.getXp.and.returnValue(Promise.resolve(1200));
        seedServiceSpy.getSeeds.and.returnValue(Promise.resolve(150));

        await TestBed.configureTestingModule({
            imports: [Achievements],
            providers: [
                { provide: AchievementsService, useValue: achievementsServiceSpy },
                { provide: XpService, useValue: xpServiceSpy },
                { provide: SeedService, useValue: seedServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(Achievements);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        achievementsServiceSpy.getAchievements.and.returnValue(Promise.resolve([]));
        achievementsServiceSpy.getUserAchievements.and.returnValue(Promise.resolve([]));
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should filter earned achievements count based only on visible achievements', async () => {
        // Mock 2 visible achievements
        const visibleAchievements = [
            new AchievementModel({ id: 'active-1', name: 'Active 1', is_visible: true, xp_amount: 100 }),
            new AchievementModel({ id: 'active-2', name: 'Active 2', is_visible: true, xp_amount: 200 })
        ];

        // Mock 2 user achievements (1 active, 1 inactive)
        const myAchievements = [
            new UserAchievement({ achievement_id: 'active-1', completed: true }),
            new UserAchievement({ achievement_id: 'inactive-achievement', completed: true })
        ];

        achievementsServiceSpy.getAchievements.and.returnValue(Promise.resolve(visibleAchievements));
        achievementsServiceSpy.getUserAchievements.and.returnValue(Promise.resolve(myAchievements));

        // Trigger ngOnInit
        await component.ngOnInit();
        fixture.detectChanges();

        expect(component.achievements()).toEqual(visibleAchievements);
        expect(component.userAchievements()).toEqual(myAchievements);
        // Should only count active-1 as earned since active-2 is not in myAchievements
        // and inactive-achievement is not in visibleAchievements.
        expect(component.earnedAchievementsCount()).toBe(1);
    });
});
