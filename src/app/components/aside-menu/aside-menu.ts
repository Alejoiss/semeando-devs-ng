import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../services/user';
import { NavigationService } from '../../services/navigation';
import { AiCreditsService } from '../../services/ai-credits/ai-credits';
import { DailyLimitService } from '../../services/daily-limit/daily-limit';

@Component({
    selector: 'app-aside-menu',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './aside-menu.html',
    styleUrls: ['./aside-menu.scss']
})
export class AsideMenu implements OnInit {
    protected readonly userService = inject(UserService);
    protected readonly navigationService = inject(NavigationService);
    protected readonly aiCreditsService = inject(AiCreditsService);
    protected readonly dailyLimitService = inject(DailyLimitService);
    private readonly router = inject(Router);

    protected readonly isTeacherOrAdmin = computed(() => {
        const user = this.userService.currentUser();
        return user?.role === 'teacher' || user?.role === 'admin';
    });

    async ngOnInit(): Promise<void> {
        const user = this.userService.currentUser();
        if (user?.id && !user.isPro) {
            await this.dailyLimitService.loadDailyCount(user.id);
        }
    }

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
