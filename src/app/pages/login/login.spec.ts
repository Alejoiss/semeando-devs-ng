import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { UserService } from '../../services/user';

describe('LoginComponent', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['signIn']);

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call userService.signIn and navigate on success', async () => {
    userServiceSpy.signIn.and.returnValue(Promise.resolve());
    
    component.loginForm.setValue({
      email: 'test@test.com',
      password: 'password123'
    });
    
    await component.onSubmit();
    
    expect(userServiceSpy.signIn).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/app']);
  });

  it('should show error message on login failure', async () => {
    userServiceSpy.signIn.and.returnValue(Promise.reject(new Error('Invalid login')));
    
    component.loginForm.setValue({
      email: 'wrong@test.com',
      password: 'wrongpassword'
    });
    
    await component.onSubmit();
    
    expect(component.authError).toBe('Invalid login');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should be busy while logging in', async () => {
    let resolveSignIn: any;
    const signInPromise = new Promise<void>((resolve) => resolveSignIn = resolve);
    userServiceSpy.signIn.and.returnValue(signInPromise);

    component.loginForm.setValue({
      email: 'test@test.com',
      password: 'password'
    });

    const submitPromise = component.onSubmit();
    expect(component.busy).toBeTrue();

    resolveSignIn();
    await submitPromise;
    expect(component.busy).toBeFalse();
  });
});
