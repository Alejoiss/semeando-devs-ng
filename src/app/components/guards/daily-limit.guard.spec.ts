import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { dailyLimitGuard } from './daily-limit.guard';
import { UserService } from '../../services/user';
import { DailyLimitService } from '../../services/daily-limit/daily-limit';

describe('dailyLimitGuard', () => {
    let currentUser: ReturnType<typeof signal<{ id: string; isPro: boolean } | null>>;
    let limitSpy: jasmine.SpyObj<DailyLimitService>;
    let router: Router;
    let profileReady: Promise<void>;

    const lessonUrl = '/app/s/html/ss/tags/lesson/l1';

    const run = (url = lessonUrl, params: Record<string, string> = { lessonId: 'l1' }, query: Record<string, string> = {}) =>
        TestBed.runInInjectionContext(() =>
            dailyLimitGuard(
                { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap(query) } as ActivatedRouteSnapshot,
                { url } as RouterStateSnapshot,
            ),
        ) as Promise<boolean | UrlTree>;

    beforeEach(() => {
        currentUser = signal<{ id: string; isPro: boolean } | null>({ id: 'u1', isPro: false });
        profileReady = Promise.resolve();
        limitSpy = jasmine.createSpyObj('DailyLimitService', ['loadDailyCount', 'isLessonAccessible']);
        limitSpy.loadDailyCount.and.resolveTo();
        limitSpy.isLessonAccessible.and.resolveTo(true);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: UserService, useValue: { currentUser, waitForProfile: () => profileReady } },
                { provide: DailyLimitService, useValue: limitSpy },
            ],
        });
        router = TestBed.inject(Router);
    });

    it('waits for the profile to load before deciding, so a direct URL cannot bypass the limit', async () => {
        let resolveProfile!: () => void;
        profileReady = new Promise<void>((resolve) => (resolveProfile = resolve));
        currentUser.set(null);
        limitSpy.isLessonAccessible.and.resolveTo(false);

        const pending = run();
        await Promise.resolve();
        currentUser.set({ id: 'u1', isPro: false });
        resolveProfile();

        const result = await pending;
        expect(result instanceof UrlTree).toBeTrue();
        expect(router.serializeUrl(result as UrlTree)).toBe(`${lessonUrl}?bloqueado=1`);
    });

    it('lets the blocked screen itself render instead of redirecting to the same URL forever', async () => {
        limitSpy.isLessonAccessible.and.resolveTo(false);

        expect(await run(`${lessonUrl}?bloqueado=1`, { lessonId: 'l1' }, { bloqueado: '1' })).toBeTrue();
        expect(limitSpy.isLessonAccessible).not.toHaveBeenCalled();
    });

    it('lets pro users through without checking the limit', async () => {
        currentUser.set({ id: 'u1', isPro: true });

        expect(await run()).toBeTrue();
        expect(limitSpy.loadDailyCount).not.toHaveBeenCalled();
    });

    it('lets the navigation through when the route has no lessonId', async () => {
        expect(await run(lessonUrl, {})).toBeTrue();
        expect(limitSpy.isLessonAccessible).not.toHaveBeenCalled();
    });

    it('lets the navigation through when there is no logged user', async () => {
        currentUser.set(null);
        expect(await run()).toBeTrue();
        expect(limitSpy.isLessonAccessible).not.toHaveBeenCalled();
    });

    it('loads the daily count before checking whether the lesson is accessible', async () => {
        const order: string[] = [];
        limitSpy.loadDailyCount.and.callFake(async () => void order.push('load'));
        limitSpy.isLessonAccessible.and.callFake(async () => (order.push('check'), true));

        expect(await run()).toBeTrue();
        expect(order).toEqual(['load', 'check']);
        expect(limitSpy.loadDailyCount).toHaveBeenCalledWith('u1');
        expect(limitSpy.isLessonAccessible).toHaveBeenCalledWith('l1', 'u1');
    });

    it('redirects to the lesson page with bloqueado=1 when the limit was reached', async () => {
        limitSpy.isLessonAccessible.and.resolveTo(false);

        const result = (await run()) as UrlTree;

        expect(result instanceof UrlTree).toBeTrue();
        expect(router.serializeUrl(result)).toBe(`${lessonUrl}?bloqueado=1`);
    });

    for (const suffix of ['quiz', 'challenge']) {
        it(`sends a blocked /${suffix} back to the lesson page`, async () => {
            limitSpy.isLessonAccessible.and.resolveTo(false);

            const result = (await run(`${lessonUrl}/${suffix}`)) as UrlTree;

            expect(router.serializeUrl(result)).toBe(`${lessonUrl}?bloqueado=1`);
        });
    }

    it('ignores existing query params when building the redirect', async () => {
        limitSpy.isLessonAccessible.and.resolveTo(false);

        const result = (await run(`${lessonUrl}/quiz?foo=bar`)) as UrlTree;

        expect(router.serializeUrl(result)).toBe(`${lessonUrl}?bloqueado=1`);
    });

    it('fails open when checking the limit throws', async () => {
        limitSpy.loadDailyCount.and.rejectWith(new Error('down'));
        expect(await run()).toBeTrue();
    });
});
