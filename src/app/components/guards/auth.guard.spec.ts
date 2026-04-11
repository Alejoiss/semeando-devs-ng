import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { UserService } from '../../services/user';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        userServiceSpy = jasmine.createSpyObj('UserService', ['getSession']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: UserService, useValue: userServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        });
    });

    it('should be created', () => {
        expect(authGuard).toBeTruthy();
    });

    it('should allow navigation if session exists', async () => {
        userServiceSpy.getSession.and.returnValue(Promise.resolve({ id: '123' } as any));

        const result = await (TestBed.runInInjectionContext(() =>
            authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        ) as Promise<boolean>);

        expect(result).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should redirect if session does not exist', async () => {
        userServiceSpy.getSession.and.returnValue(Promise.resolve(null));

        const result = await (TestBed.runInInjectionContext(() =>
            authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        ) as Promise<boolean>);

        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect if getSession throws error', async () => {
        userServiceSpy.getSession.and.returnValue(Promise.reject('error'));

        const result = await (TestBed.runInInjectionContext(() =>
            authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        ) as Promise<boolean>);

        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
});
