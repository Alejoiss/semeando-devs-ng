import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Register } from './register';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../../services/user';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('Register', () => {
    let component: Register;
    let fixture: ComponentFixture<Register>;
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let router: Router;

    beforeEach(async () => {
        const userServiceMock = jasmine.createSpyObj('UserService', ['register']);

        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                RouterTestingModule.withRoutes([]),
                Register
            ],
            providers: [
                { provide: UserService, useValue: userServiceMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(Register);
        component = fixture.componentInstance;
        userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('displays the success modal on successful registration', fakeAsync(() => {
        userServiceSpy.register.and.returnValue(Promise.resolve());

        component.registerForm.setValue({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            termsAccepted: true,
            newsletterActive: false
        });

        expect(component.showSuccessModal()).toBeFalse();

        component.onSubmit();
        tick();

        expect(userServiceSpy.register).toHaveBeenCalled();
        expect(component.showSuccessModal()).toBeTrue();
    }));

    it('redirects the user to the login page when the confirmation button is clicked', fakeAsync(() => {
        const navigateSpy = spyOn(router, 'navigate');
        
        component.onCloseSuccessModal();
        tick();

        expect(component.showSuccessModal()).toBeFalse();
        expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    }));

    it('should show error message on registration failure', fakeAsync(() => {
        userServiceSpy.register.and.returnValue(Promise.reject({ message: 'Registration failed' }));

        component.registerForm.setValue({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            termsAccepted: true,
            newsletterActive: false
        });

        component.onSubmit();
        tick();

        expect(component.registerError).toBe('Registration failed');
        expect(component.busy).toBeFalse();
    }));
});
