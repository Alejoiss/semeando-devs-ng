import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    private readonly _isSidebarOpen = signal<boolean>(false);
    public readonly isSidebarOpen = this._isSidebarOpen.asReadonly();

    toggleSidebar() {
        this._isSidebarOpen.update(open => !open);
    }

    closeSidebar() {
        this._isSidebarOpen.set(false);
    }
}
