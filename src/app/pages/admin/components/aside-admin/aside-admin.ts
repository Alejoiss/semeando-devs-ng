import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../../services/user';
import { NavigationService } from '../../../../services/navigation';

@Component({
    selector: 'app-aside-admin',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './aside-admin.html',
    styleUrl: './aside-admin.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideAdmin {
    protected readonly userService = inject(UserService);
    protected readonly navigationService = inject(NavigationService);
    private readonly router = inject(Router);

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
