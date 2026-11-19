import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { monacoGuard } from './monaco.guard';
import { MonacoLoader } from '../../services/monaco-loader';

describe('monacoGuard', () => {
    let ensureLoaded: jasmine.Spy;

    const run = () =>
        TestBed.runInInjectionContext(() =>
            monacoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        ) as Promise<boolean | UrlTree>;

    beforeEach(() => {
        ensureLoaded = jasmine.createSpy('ensureLoaded').and.resolveTo(true);
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: MonacoLoader, useValue: { ensureLoaded } }],
        });
    });

    it('lets the navigation through once the editor is loaded', async () => {
        expect(await run()).toBeTrue();
    });

    it('sends the user back to the app home when the editor cannot be loaded', async () => {
        ensureLoaded.and.resolveTo(false);

        const result = await run();

        expect(result instanceof UrlTree).toBeTrue();
        expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/app');
    });
});
