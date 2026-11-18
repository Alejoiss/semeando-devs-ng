import { TestBed } from '@angular/core/testing';
import { RankingOverallService } from './ranking-overall';
import { RankingMonthlyService } from './ranking-monthly';
import { RankingWeeklyService } from './ranking-weekly';
import { SupabaseService } from './supabase';
import { UserService } from './user';

describe('Ranking services', () => {
    let rpc: jasmine.Spy;
    let getUserProfile: jasmine.Spy;
    const ranking = { top: [], me: null };

    beforeEach(() => {
        rpc = jasmine.createSpy('rpc').and.resolveTo({ data: ranking, error: null });
        getUserProfile = jasmine.createSpy('getUserProfile').and.resolveTo({ id: 'u1' });
        spyOn(console, 'error');
        TestBed.configureTestingModule({
            providers: [
                { provide: SupabaseService, useValue: { client: { rpc } } },
                { provide: UserService, useValue: { getUserProfile } },
            ],
        });
    });

    describe('RankingOverallService', () => {
        it('requests the overall ranking for the logged user', async () => {
            expect(await TestBed.inject(RankingOverallService).getRanking()).toBe(ranking as any);
            expect(rpc).toHaveBeenCalledWith('get_ranking_overall', { p_user_id: 'u1' });
        });

        it('rethrows rpc errors', async () => {
            rpc.and.resolveTo({ data: null, error: { message: 'boom' } });
            await expectAsync(TestBed.inject(RankingOverallService).getRanking()).toBeRejectedWithError('boom');
        });

        it('rethrows profile errors without calling the rpc', async () => {
            getUserProfile.and.rejectWith(new Error('no session'));
            await expectAsync(TestBed.inject(RankingOverallService).getRanking()).toBeRejectedWithError('no session');
            expect(rpc).not.toHaveBeenCalled();
        });
    });

    describe('RankingMonthlyService', () => {
        beforeEach(() => jasmine.clock().install());
        afterEach(() => jasmine.clock().uninstall());

        it('requests the ranking for the current year and 1-based month', async () => {
            jasmine.clock().mockDate(new Date(2026, 10, 18, 12));
            await TestBed.inject(RankingMonthlyService).getRanking();
            expect(rpc).toHaveBeenCalledWith('get_ranking_monthly', { p_user_id: 'u1', p_year: 2026, p_month: 11 });
        });

        it('rethrows rpc errors', async () => {
            rpc.and.resolveTo({ data: null, error: { message: 'boom' } });
            await expectAsync(TestBed.inject(RankingMonthlyService).getRanking()).toBeRejectedWithError('boom');
        });
    });

    describe('RankingWeeklyService', () => {
        beforeEach(() => jasmine.clock().install());
        afterEach(() => jasmine.clock().uninstall());

        async function weekFor(date: Date) {
            jasmine.clock().mockDate(date);
            rpc.calls.reset();
            await TestBed.inject(RankingWeeklyService).getRanking();
            return rpc.calls.mostRecent().args[1] as { p_user_id: string; p_year: number; p_week: number };
        }

        it('calls the weekly rpc with the ISO year and week', async () => {
            expect(await weekFor(new Date(2026, 10, 18, 12))).toEqual({ p_user_id: 'u1', p_year: 2026, p_week: 47 });
            expect(rpc.calls.mostRecent().args[0]).toBe('get_ranking_weekly');
        });

        it('belongs to week 1 of the new ISO year when the first Thursday is in it (Mon 2024-12-30)', async () => {
            const args = await weekFor(new Date(2024, 11, 30, 12));
            expect([args.p_year, args.p_week]).toEqual([2025, 1]);
        });

        it('belongs to week 53 of the previous ISO year at the start of the year (Fri 2021-01-01)', async () => {
            const args = await weekFor(new Date(2021, 0, 1, 12));
            expect([args.p_year, args.p_week]).toEqual([2020, 53]);
        });

        it('treats Sunday as the last day of the ISO week (Sun 2026-11-22)', async () => {
            const args = await weekFor(new Date(2026, 10, 22, 12));
            expect([args.p_year, args.p_week]).toEqual([2026, 47]);
        });

        it('rethrows rpc errors', async () => {
            rpc.and.resolveTo({ data: null, error: { message: 'boom' } });
            await expectAsync(TestBed.inject(RankingWeeklyService).getRanking()).toBeRejectedWithError('boom');
        });
    });
});
