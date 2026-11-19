import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AsideAdmin } from './aside-admin/aside-admin';
import { HeaderAdmin } from './header-admin/header-admin';
import { NavigationService } from '../../../services/navigation';
import { UserService } from '../../../services/user';

describe('Admin shell', () => {
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

    describe('AsideAdmin', () => {
        let fixture: ComponentFixture<AsideAdmin>;
        const hrefs = () => Array.from(fixture.nativeElement.querySelectorAll('nav a')).map((a: any) => a.getAttribute('href'));
        const logoutLink = () => fixture.nativeElement.querySelector('a[href="/"]') as HTMLAnchorElement;

        beforeEach(() => {
            configure();
            fixture = TestBed.createComponent(AsideAdmin);
            fixture.detectChanges();
        });

        it('is labeled for assistive technology', () => {
            expect(fixture.nativeElement.querySelector('aside').getAttribute('aria-label')).toBe('Menu lateral administrativo');
        });

        it('links to every admin section and back to the student area', () => {
            expect(hrefs()).toEqual([
                '/admin/dashboard',
                '/admin/lista-de-alunos',
                '/admin/cadastro-de-cupons',
                '/admin/envio-de-newsletter',
                '/admin/relatorio-de-receita',
                '/admin/configuracoes-ia',
                '/app',
            ]);
        });

        it('closes the sidebar when a link is chosen', () => {
            const navigation = TestBed.inject(NavigationService);
            navigation.toggleSidebar();

            (fixture.nativeElement.querySelector('nav a') as HTMLAnchorElement).click();

            expect(navigation.isSidebarOpen()).toBeFalse();
        });

        it('shows the sidebar on small screens only when open', () => {
            const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
            expect(aside.classList).not.toContain('translate-x-0');

            TestBed.inject(NavigationService).toggleSidebar();
            fixture.detectChanges();
            expect(aside.classList).toContain('translate-x-0');
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

    describe('HeaderAdmin', () => {
        let fixture: ComponentFixture<HeaderAdmin>;

        beforeEach(() => {
            configure();
            fixture = TestBed.createComponent(HeaderAdmin);
            fixture.detectChanges();
        });

        it('links the logo to the admin panel with an accessible name', () => {
            const link = fixture.nativeElement.querySelector('h1 a') as HTMLAnchorElement;
            expect(link.getAttribute('href')).toBe('/admin');
            expect(link.getAttribute('aria-label')).toBe('Ir para o painel administrativo');
        });

        it('opens the sidebar from the labeled menu button', () => {
            const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
            expect(button.getAttribute('aria-label')).toBe('Abrir menu lateral');

            button.click();

            expect(TestBed.inject(NavigationService).isSidebarOpen()).toBeTrue();
        });

        it('shows the avatar, or a placeholder without one', () => {
            expect(fixture.nativeElement.querySelector('a[href="/app/perfil"] img')).toBeNull();

            currentUser.set({ isPro: false, avatar: 'me.png' });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelector('a[href="/app/perfil"] img').getAttribute('src')).toBe('me.png');
        });

        it('marks pro users with a star', () => {
            currentUser.set({ isPro: true, avatar: '' });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelector('[data-icon="star"]')).toBeTruthy();
        });
    });
});
