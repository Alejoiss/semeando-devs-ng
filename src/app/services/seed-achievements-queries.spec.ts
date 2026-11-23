import { TestBed } from '@angular/core/testing';
import { createClientStub } from '../../testing/client-stub';
import { AchievementsService } from './achievements';
import { SeedService } from './seed';
import { UserService } from './user';

describe('SeedService and AchievementsService queries', () => {
    let users: jasmine.SpyObj<UserService>;
    const fails = { error: { message: 'boom' } };

    beforeEach(() => {
        users = jasmine.createSpyObj('UserService', ['getUserProfile']);
        users.getUserProfile.and.resolveTo({ id: 'me' } as any);
        TestBed.configureTestingModule({ providers: [{ provide: UserService, useValue: users }] });
        spyOn(console, 'error');
        spyOn(console, 'warn');
    });

    describe('SeedService', () => {
        let service: SeedService;
        const use = (...results: any[]) => {
            const stub = createClientStub(...results);
            (service as any).supabase = stub.client;
            return stub;
        };
        beforeEach(() => (service = TestBed.inject(SeedService)));

        it('reads the seeds of a user, 0 when absent or failing', async () => {
            use({ data: { total_seeds: 12 } });
            expect(await service.getSeedsForUser('u')).toBe(12);
            use({ data: null });
            expect(await service.getSeedsForUser('u')).toBe(0);
            use(fails);
            expect(await service.getSeedsForUser('u')).toBe(0);
        });

        it('updates the signal when reading the seeds of the logged user', async () => {
            use({ data: { total_seeds: 5 } });
            expect(await service.getSeeds()).toBe(5);
            expect(service.totalSeeds()).toBe(5);
            users.getUserProfile.and.resolveTo(null as any);
            expect(await service.getSeeds()).toBe(0);
            users.getUserProfile.and.rejectWith(new Error('x'));
            expect(await service.getSeeds()).toBe(0);
        });

        it('credits and spends seeds through the log, refreshing the total', async () => {
            const stub = use({ data: { total_seeds: 8 } });
            await service.creditSeeds(3);
            expect(stub.spy(0, 'insert')).toHaveBeenCalledWith({ user_id: 'me', amount: 3 });
            expect(service.totalSeeds()).toBe(8);
            expect(await service.spendSeeds(2)).toBeTrue();
            expect(stub.spy(2, 'insert')).toHaveBeenCalledWith({ user_id: 'me', amount: -2 });
        });

        it('swallows failures when crediting and reports them when spending', async () => {
            use(fails);
            await service.creditSeeds(1);
            expect(await service.spendSeeds(1)).toBeFalse();
        });
    });

    describe('AchievementsService', () => {
        let service: AchievementsService;
        const use = (...results: any[]) => {
            const stub = createClientStub(...results);
            (service as any).supabase = stub.client;
            return stub;
        };
        beforeEach(() => (service = TestBed.inject(AchievementsService)));

        it('lists visible achievements, empty on failure', async () => {
            use({ data: [{ id: 'a' }] });
            expect((await service.getAchievements()).length).toBe(1);
            use({ data: null });
            expect(await service.getAchievements()).toEqual([]);
            use(fails);
            expect(await service.getAchievements()).toEqual([]);
        });

        it('gets the achievement of a course, null when absent or failing', async () => {
            use({ data: { id: 'a' } });
            expect(await service.getAchievementByCourseId('m')).not.toBeNull();
            use({ error: { code: 'PGRST116', message: '' } });
            expect(await service.getAchievementByCourseId('m')).toBeNull();
            use(fails);
            expect(await service.getAchievementByCourseId('m')).toBeNull();
        });

        it('lists the completed achievements of the logged user', async () => {
            use({ data: [{ id: 'ua' }] });
            expect((await service.getUserAchievements()).length).toBe(1);
            users.getUserProfile.and.resolveTo(null as any);
            expect(await service.getUserAchievements()).toEqual([]);
            users.getUserProfile.and.rejectWith(new Error('x'));
            expect(await service.getUserAchievements()).toEqual([]);
        });

        it('lists the completed achievements of a user, empty on failure', async () => {
            use({ data: null });
            expect(await service.getUserAchievementsForUser('u')).toEqual([]);
            use(fails);
            expect(await service.getUserAchievementsForUser('u')).toEqual([]);
        });

        it('exposes the oldest unseen achievement, or null', async () => {
            use({ data: { id: 'ua' } });
            await service.checkUnseenAchievements();
            expect(service.unseenAchievement()).toEqual({ id: 'ua' });
            use(fails);
            await service.checkUnseenAchievements();
            expect(service.unseenAchievement()).toBeNull();
            users.getUserProfile.and.resolveTo(null as any);
            await service.checkUnseenAchievements();
            expect(service.unseenAchievement()).toBeNull();
        });

        it('marks an achievement as viewed and looks for the next one', async () => {
            const stub = use({}, { data: { id: 'next' } });
            await service.markAsViewed('a');
            expect(stub.spy(0, 'update')).toHaveBeenCalledWith({ viewed: true });
            expect(service.unseenAchievement()).toEqual({ id: 'next' });
        });

        it('ignores markAsViewed without user and swallows update failures', async () => {
            const stub = use(fails);
            users.getUserProfile.and.resolveTo(null as any);
            await service.markAsViewed('a');
            expect(stub.client.from).not.toHaveBeenCalled();
            users.getUserProfile.and.resolveTo({ id: 'me' } as any);
            await service.markAsViewed('a');
            expect(console.error).toHaveBeenCalled();
        });
    });
});
