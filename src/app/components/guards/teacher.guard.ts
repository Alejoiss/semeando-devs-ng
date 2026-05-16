import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/user';

export const teacherGuard: CanActivateFn = async (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    try {
        const user = await userService.getUserProfile();

        if (user && (user.role === 'teacher' || user.role === 'admin')) {
            return true;
        }
    } catch (e) {
        // Fallback if profile check fails
    }

    router.navigate(['/app']);
    return false;
};
