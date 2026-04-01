import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { Location } from '@angular/common';

describe('App Routes', () => {
    let router: Router;
    let location: Location;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter(routes),
            ]
        });
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
    });

    it('navigates to "upgrade" takes you to /app/upgrade', async () => {
        await router.navigate(['/app/upgrade']);
        expect(location.path()).toBe('/app/upgrade');
    });
});
