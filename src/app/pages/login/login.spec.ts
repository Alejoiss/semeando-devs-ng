import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user';
import { RouterModule } from '@angular/router';

describe('LoginComponent', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['signIn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, RouterModule.forRoot([])],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

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
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
  });

  it('should show error message on login failure', async () => {
    userServiceSpy.signIn.and.returnValue(Promise.reject(new Error('Invalid login')));
    
    component.loginForm.setValue({
      email: 'wrong@test.com',
      password: 'wrongpassword'
    });
    
    await component.onSubmit();
    
    expect(component.authError).toBe('Invalid login');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
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
