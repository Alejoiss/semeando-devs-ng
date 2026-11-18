import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AsideProfessor } from './aside-professor/aside-professor';
import { HeaderProfessor } from './header-professor/header-professor';
import { NavigationService } from '../../../services/navigation';
import { UserService } from '../../../services/user';

describe('Professor shell', () => {
    let currentUser: WritableSignal<any>;
    let userService: { currentUser: WritableSignal<any>; signOut: jasmine.Spy };
    let navigate: jasmine.Spy;

    function configure() {
        currentUser = signal({ isPro: false, avatar: '' });
        userService = { currentUser, signOut: jasmine.createSpy('signOut').and.resolveTo() };
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: UserService, useValue: userService }],
        });
        navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    }

    describe('AsideProfessor', () => {
        let fixture: ComponentFixture<AsideProfessor>;
        const hrefs = () => Array.from(fixture.nativeElement.querySelectorAll('nav a')).map((a: any) => a.getAttribute('href'));
        const logoutLink = () => fixture.nativeElement.querySelector('a[href="/"]') as HTMLAnchorElement;

        beforeEach(() => {
            configure();
            fixture = TestBed.createComponent(AsideProfessor);
            fixture.detectChanges();
        });

        it('links to my modules, create module and back to the student area', () => {
            expect(hrefs()).toEqual(['/professor/meus-modulos', '/professor/criar-modulo', '/app']);
        });

        it('logs out, closes the sidebar and goes to the home page', async () => {
            const navigation = TestBed.inject(NavigationService);
            navigation.toggleSidebar();
            const event = new MouseEvent('click', { cancelable: true });

            logoutLink().dispatchEvent(event);
            await fixture.whenStable();

            expect(event.defaultPrevented).toBeTrue();
            expect(navigation.isSidebarOpen()).toBeFalse();
            expect(userService.signOut).toHaveBeenCalled();
            expect(navigate).toHaveBeenCalledWith(['/']);
        });

        it('still goes home when signing out fails', async () => {
            spyOn(console, 'error');
            userService.signOut.and.rejectWith(new Error('down'));

            logoutLink().click();
            await fixture.whenStable();

            expect(navigate).toHaveBeenCalledWith(['/']);
        });
    });

    describe('HeaderProfessor', () => {
        let fixture: ComponentFixture<HeaderProfessor>;

        beforeEach(() => {
            configure();
            fixture = TestBed.createComponent(HeaderProfessor);
            fixture.detectChanges();
        });

        it('links the logo to the professor area', () => {
            expect(fixture.nativeElement.querySelector('a.brand').getAttribute('href')).toBe('/professor');
        });

        it('toggles the sidebar from the menu button', () => {
            (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
            expect(TestBed.inject(NavigationService).isSidebarOpen()).toBeTrue();
        });

        it('shows the avatar, or a placeholder without one', () => {
            expect(fixture.nativeElement.querySelector('a[href="/app/perfil"] img')).toBeNull();

            currentUser.set({ isPro: false, avatar: 'me.png' });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelector('a[href="/app/perfil"] img').getAttribute('src')).toBe('me.png');
        });

        it('marks pro users with a star', () => {
            expect(fixture.nativeElement.querySelector('[data-icon="star"]')).toBeNull();

            currentUser.set({ isPro: true, avatar: '' });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelector('[data-icon="star"]')).toBeTruthy();
        });
    });
});
