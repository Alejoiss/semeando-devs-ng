import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavigationService } from '../../../../services/navigation';
import { UserService } from '../../../../services/user';
import { HeaderProfessor } from './header-professor';

describe('HeaderProfessor', () => {
    let fixture: ComponentFixture<HeaderProfessor>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: UserService, useValue: { currentUser: signal({ avatar: '' }) } }],
        });
        fixture = TestBed.createComponent(HeaderProfessor);
        fixture.detectChanges();
    });

    it('links the logo to the professor home', () => {
        expect(fixture.nativeElement.querySelector('a.brand').getAttribute('href')).toBe('/professor');
    });

    it('has a named menu button that toggles the sidebar', () => {
        const navigation = TestBed.inject(NavigationService);
        const button = fixture.nativeElement.querySelector('header button') as HTMLButtonElement;
        expect(button.getAttribute('aria-label')).toBe('Abrir menu lateral');

        button.click();
        expect(navigation.isSidebarOpen()).toBeTrue();
    });
});
