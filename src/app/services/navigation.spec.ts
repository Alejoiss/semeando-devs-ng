import { TestBed } from '@angular/core/testing';
import { NavigationService } from './navigation';

describe('NavigationService', () => {
    let service: NavigationService;

    beforeEach(() => {
        service = TestBed.inject(NavigationService);
    });

    it('starts with the sidebar closed', () => {
        expect(service.isSidebarOpen()).toBeFalse();
    });

    it('toggles the sidebar', () => {
        service.toggleSidebar();
        expect(service.isSidebarOpen()).toBeTrue();
        service.toggleSidebar();
        expect(service.isSidebarOpen()).toBeFalse();
    });

    it('closes the sidebar and stays closed when already closed', () => {
        service.toggleSidebar();
        service.closeSidebar();
        expect(service.isSidebarOpen()).toBeFalse();
        service.closeSidebar();
        expect(service.isSidebarOpen()).toBeFalse();
    });
});
