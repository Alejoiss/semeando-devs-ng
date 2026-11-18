import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { teacherGuard } from './teacher.guard';
import { UserService } from '../../services/user';

describe('teacherGuard', () => {
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const run = () =>
        TestBed.runInInjectionContext(() =>
            teacherGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        ) as Promise<boolean>;

    beforeEach(() => {
        userServiceSpy = jasmine.createSpyObj('UserService', ['getUserProfile']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            providers: [
                { provide: UserService, useValue: userServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });
    });

    for (const role of ['teacher', 'admin']) {
        it(`allows the ${role} role`, async () => {
            userServiceSpy.getUserProfile.and.resolveTo({ role } as any);

            expect(await run()).toBeTrue();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
    }

    it('redirects students to /app', async () => {
        userServiceSpy.getUserProfile.and.resolveTo({ role: 'student' } as any);

        expect(await run()).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    });

    it('redirects when there is no profile', async () => {
        userServiceSpy.getUserProfile.and.resolveTo(null as any);

        expect(await run()).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    });

    it('redirects when loading the profile fails', async () => {
        userServiceSpy.getUserProfile.and.rejectWith(new Error('down'));

        expect(await run()).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    });
});
