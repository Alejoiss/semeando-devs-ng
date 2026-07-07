import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/user';
import { DailyLimitService } from '../../services/daily-limit/daily-limit';

export const dailyLimitGuard: CanActivateFn = async (route, state) => {
    const userService = inject(UserService);
    const dailyLimitService = inject(DailyLimitService);
    const router = inject(Router);

    try {
        const user = userService.currentUser();

        if (user?.isPro) {
            return true;
        }

        const lessonId = route.paramMap.get('lessonId');
        if (!lessonId || !user?.id) {
            return true;
        }

        await dailyLimitService.loadDailyCount(user.id);

        const accessible = await dailyLimitService.isLessonAccessible(lessonId, user.id);

        if (accessible) {
            return true;
        }

        const lessonPath = state.url.split('?')[0].replace(/\/(quiz|challenge)$/, '');
        return router.createUrlTree([lessonPath], { queryParams: { bloqueado: '1' } });
    } catch {
        return true;
    }
};
