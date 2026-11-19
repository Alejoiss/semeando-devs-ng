import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MonacoLoader } from '../../services/monaco-loader';

export const monacoGuard: CanActivateFn = async () => {
    const loader = inject(MonacoLoader);
    const router = inject(Router);

    return (await loader.ensureLoaded()) ? true : router.createUrlTree(['/app']);
};
