import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AsideMenu } from './aside-menu';
import { UserService } from '../../services/user';

describe('AsideMenu', () => {
  let component: AsideMenu;
  let fixture: ComponentFixture<AsideMenu>;
  let userService: UserService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsideMenu],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AsideMenu);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should navigate from sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[routerLink="/app/upgrade"]');
    expect(button).toBeTruthy();
  });

  it('should call userService.signOut and navigate to / on logout', async () => {
    spyOn(userService, 'signOut').and.returnValue(Promise.resolve());
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const event = new Event('click');
    spyOn(event, 'preventDefault');

    await (component as any).logout(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(userService.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});

