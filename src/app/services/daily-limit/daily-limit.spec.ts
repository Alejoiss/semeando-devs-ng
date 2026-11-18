import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DAILY_LIMIT, DailyLimitService } from './daily-limit';
import { SupabaseService } from '../supabase';
import { UserService } from '../user';
import { createQueryStub, StubResult } from '../../../testing/query-stub';

describe('DailyLimitService', () => {
    let service: DailyLimitService;
    let fromSpy: jasmine.Spy;
    let currentUser: ReturnType<typeof signal<{ id: string; isPro: boolean } | null>>;

    function respondWith(result: StubResult) {
        const stub = createQueryStub(result);
        fromSpy.and.returnValue(stub.query);
        return stub;
    }

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        currentUser = signal<{ id: string; isPro: boolean } | null>({ id: 'u1', isPro: false });
        TestBed.configureTestingModule({
            providers: [
                { provide: SupabaseService, useValue: { client: { from: fromSpy } } },
                { provide: UserService, useValue: { currentUser } },
            ],
        });
        service = TestBed.inject(DailyLimitService);
    });

    describe('limit state', () => {
        it('is not reached below the daily limit', () => {
            service.dailyCompletedCount.set(DAILY_LIMIT - 1);
            expect(service.isDailyLimitReached()).toBeFalse();
        });

        it('is reached at the daily limit for free users', () => {
            service.dailyCompletedCount.set(DAILY_LIMIT);
            expect(service.isDailyLimitReached()).toBeTrue();
        });

        it('is never reached for pro users', () => {
            currentUser.set({ id: 'u1', isPro: true });
            service.dailyCompletedCount.set(DAILY_LIMIT + 3);
            expect(service.isDailyLimitReached()).toBeFalse();
        });

        it('is not reached when there is no user', () => {
            currentUser.set(null);
            service.dailyCompletedCount.set(0);
            expect(service.isDailyLimitReached()).toBeFalse();
        });

        it('exposes one indicator per daily slot, filled by the completed count', () => {
            service.dailyCompletedCount.set(2);
            expect(service.dailyIndicators()).toEqual([true, true, false, false, false]);
            expect(service.dailyIndicators().length).toBe(DAILY_LIMIT);
        });
    });

    describe('loadDailyCount', () => {
        it('counts today\'s completed lessons of the user', async () => {
            const stub = respondWith({ count: 3 });

            await service.loadDailyCount('u1');

            expect(fromSpy).toHaveBeenCalledWith('user_lessons');
            expect(stub.spy('select')).toHaveBeenCalledWith('id', { count: 'exact', head: true });
            expect(stub.spy('eq')).toHaveBeenCalledWith('user_id', 'u1');
            expect(stub.spy('eq')).toHaveBeenCalledWith('completed', true);
            expect(service.dailyCompletedCount()).toBe(3);
        });

        it('treats a null count as zero', async () => {
            respondWith({ count: null });
            service.dailyCompletedCount.set(4);
            await service.loadDailyCount('u1');
            expect(service.dailyCompletedCount()).toBe(0);
        });

        it('skips the query for pro users', async () => {
            currentUser.set({ id: 'u1', isPro: true });
            await service.loadDailyCount('u1');
            expect(fromSpy).not.toHaveBeenCalled();
        });

        it('keeps the previous count when the query fails', async () => {
            spyOn(console, 'error');
            respondWith({ error: { message: 'down' } });
            service.dailyCompletedCount.set(2);

            await service.loadDailyCount('u1');

            expect(service.dailyCompletedCount()).toBe(2);
        });

        describe('day window (UTC-3)', () => {
            const dayWindow = async () => {
                const stub = respondWith({ count: 0 });
                await service.loadDailyCount('u1');
                return {
                    start: stub.spy('gte').calls.mostRecent().args[1] as string,
                    end: stub.spy('lte').calls.mostRecent().args[1] as string,
                };
            };

            beforeEach(() => jasmine.clock().install());
            afterEach(() => jasmine.clock().uninstall());

            it('spans 00:00-23:59 of the UTC-3 day regardless of the browser timezone', async () => {
                jasmine.clock().mockDate(new Date('2026-11-18T15:00:00.000Z'));
                const { start, end } = await dayWindow();
                expect(start).toBe('2026-11-18T03:00:00.000Z');
                expect(end).toBe('2026-11-19T02:59:59.999Z');
            });

            it('still belongs to the previous UTC-3 day right after 00:00 UTC', async () => {
                jasmine.clock().mockDate(new Date('2026-11-18T01:00:00.000Z'));
                const { start, end } = await dayWindow();
                expect(start).toBe('2026-11-17T03:00:00.000Z');
                expect(end).toBe('2026-11-18T02:59:59.999Z');
            });

            it('always covers exactly 24 hours', async () => {
                jasmine.clock().mockDate(new Date('2026-11-18T15:00:00.000Z'));
                const { start, end } = await dayWindow();
                const span = new Date(end).getTime() - new Date(start).getTime();
                expect(span).toBe(24 * 60 * 60 * 1000 - 1);
            });
        });
    });

    describe('isLessonAccessible', () => {
        it('is always accessible for pro users without querying', async () => {
            currentUser.set({ id: 'u1', isPro: true });
            expect(await service.isLessonAccessible('l1', 'u1')).toBeTrue();
            expect(fromSpy).not.toHaveBeenCalled();
        });

        it('is accessible when the lesson was already completed, even at the limit', async () => {
            const stub = respondWith({ data: { completed: true } });
            service.dailyCompletedCount.set(DAILY_LIMIT);

            expect(await service.isLessonAccessible('l1', 'u1')).toBeTrue();
            expect(stub.spy('eq')).toHaveBeenCalledWith('lesson_id', 'l1');
        });

        it('is accessible for a new lesson below the limit', async () => {
            respondWith({ data: null });
            service.dailyCompletedCount.set(DAILY_LIMIT - 1);
            expect(await service.isLessonAccessible('l1', 'u1')).toBeTrue();
        });

        it('is blocked for a new lesson once the limit was reached', async () => {
            respondWith({ data: null });
            service.dailyCompletedCount.set(DAILY_LIMIT);
            expect(await service.isLessonAccessible('l1', 'u1')).toBeFalse();
        });

        it('fails open when the check query errors', async () => {
            spyOn(console, 'error');
            respondWith({ error: { message: 'down' } });
            service.dailyCompletedCount.set(DAILY_LIMIT);
            expect(await service.isLessonAccessible('l1', 'u1')).toBeTrue();
        });
    });
});
