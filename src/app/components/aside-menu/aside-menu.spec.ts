import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AsideMenu } from './aside-menu';

describe('AsideMenu', () => {
  let component: AsideMenu;
  let fixture: ComponentFixture<AsideMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsideMenu],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AsideMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should navigate from sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[routerLink="/app/upgrade"]');
    expect(button).toBeTruthy();
  });
});
