import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { UserService } from '../../services/user';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('adminGuard', () => {
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        userServiceSpy = jasmine.createSpyObj('UserService', ['getUserProfile']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: UserService, useValue: userServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        });
    });

    it('should be created', () => {
        expect(adminGuard).toBeTruthy();
    });

    it('should allow navigation when user has admin role', async () => {
        userServiceSpy.getUserProfile.and.returnValue(Promise.resolve({ role: 'admin' } as any));

        const result = await (TestBed.runInInjectionContext(() =>
            adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        ) as Promise<boolean>);

        expect(result).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to /app when user has student role', async () => {
        userServiceSpy.getUserProfile.and.returnValue(Promise.resolve({ role: 'student' } as any));

        const result = await (TestBed.runInInjectionContext(() =>
            adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        ) as Promise<boolean>);

        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    });

    it('should redirect to /app when user has teacher role', async () => {
        userServiceSpy.getUserProfile.and.returnValue(Promise.resolve({ role: 'teacher' } as any));

        const result = await (TestBed.runInInjectionContext(() =>
            adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        ) as Promise<boolean>);

        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    });

    it('should redirect to /app when getUserProfile throws an error', async () => {
        userServiceSpy.getUserProfile.and.returnValue(Promise.reject('error'));

        const result = await (TestBed.runInInjectionContext(() =>
            adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        ) as Promise<boolean>);

        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    });
});
