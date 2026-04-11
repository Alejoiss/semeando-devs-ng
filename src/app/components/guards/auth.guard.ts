import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/user';

export const authGuard: CanActivateFn = async (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    try {
        const session = await userService.getSession();

        if (session) {
            return true;
        }
    } catch (e) {
        // Fallback if session check truly fails
    }

    router.navigate(['/auth/login']);
    return false;
};
