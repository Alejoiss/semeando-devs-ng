import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

    protected readonly isTeacherOrAdmin = computed(() => {
        const user = this.userService.currentUser();
        return user?.role === 'teacher' || user?.role === 'admin';
    });
}
