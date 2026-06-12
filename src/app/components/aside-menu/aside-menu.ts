import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../services/user';
import { NavigationService } from '../../services/navigation';
import { AiCreditsService } from '../../services/ai-credits/ai-credits';

@Component({
    selector: 'app-aside-menu',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './aside-menu.html',
    styleUrls: ['./aside-menu.scss']
})
export class AsideMenu {
    protected readonly userService = inject(UserService);
    protected readonly navigationService = inject(NavigationService);
    protected readonly aiCreditsService = inject(AiCreditsService);
    private readonly router = inject(Router);

    protected readonly isTeacherOrAdmin = computed(() => {
        const user = this.userService.currentUser();
        return user?.role === 'teacher' || user?.role === 'admin';
    });

    protected async logout(event: Event) {
        event.preventDefault();
        this.navigationService.closeSidebar();
        try {
            await this.userService.signOut();
        } catch (error) {
            console.error('Error signing out', error);
        }
        await this.router.navigate(['/']);
    }
}

