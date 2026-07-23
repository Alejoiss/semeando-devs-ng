import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminApp } from './admin-app';
import { NavigationService } from '../../../services/navigation';
import { signal } from '@angular/core';

describe('AdminApp', () => {
    let component: AdminApp;
    let fixture: ComponentFixture<AdminApp>;
    let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

    beforeEach(async () => {
        const isSidebarOpenSignal = signal(false);
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['closeSidebar', 'toggleSidebar'], {
            isSidebarOpen: isSidebarOpenSignal.asReadonly()
        });

        await TestBed.configureTestingModule({
            imports: [AdminApp],
            providers: [
                provideRouter([]),
                { provide: NavigationService, useValue: navigationServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminApp);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render without any terms modal element', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const termsModal = compiled.querySelector('app-professor-terms, [data-terms-modal]');
        expect(termsModal).toBeNull();
    });

    it('should render the header admin component', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('app-header-admin')).toBeTruthy();
    });

    it('should render the aside admin component', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('app-aside-admin')).toBeTruthy();
    });

    it('should render the router outlet', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('router-outlet')).toBeTruthy();
    });

    it('should not show overlay when sidebar is closed', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const overlay = compiled.querySelector('.fixed.inset-0.bg-black\\/60');
        expect(overlay).toBeNull();
    });
});
