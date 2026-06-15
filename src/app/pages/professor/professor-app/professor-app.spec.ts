import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessorApp } from './professor-app';
import { UserService } from '../../../services/user';
import { NavigationService } from '../../../services/navigation';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('ProfessorApp', () => {
  let component: ProfessorApp;
  let fixture: ComponentFixture<ProfessorApp>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockNavigationService: any;
  let currentUserSignal: any;

  beforeEach(async () => {
    currentUserSignal = signal<any>(null);

    mockUserService = jasmine.createSpyObj('UserService', ['acceptTeacherTerms']);
    (mockUserService as any).currentUser = currentUserSignal;

    mockNavigationService = {
      isSidebarOpen: signal(false),
      closeSidebar: jasmine.createSpy('closeSidebar')
    };

    await TestBed.configureTestingModule({
      imports: [ProfessorApp],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: NavigationService, useValue: mockNavigationService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorApp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show terms modal if user has not accepted teacher terms', () => {
    currentUserSignal.set({
      id: 'prof_123',
      name: 'Test Prof',
      role: 'teacher',
      teacherTermsAccepted: false
    });
    fixture.detectChanges();
    
    expect(component['showTermsModal']()).toBeTrue();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-professor-terms')).toBeTruthy();
  });

  it('should not show terms modal if user has accepted teacher terms', () => {
    currentUserSignal.set({
      id: 'prof_123',
      name: 'Test Prof',
      role: 'teacher',
      teacherTermsAccepted: true
    });
    fixture.detectChanges();
    
    expect(component['showTermsModal']()).toBeFalse();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-professor-terms')).toBeNull();
  });
});
