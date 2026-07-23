import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user';
import { NavigationService } from '../../../../services/navigation';

@Component({
    selector: 'app-header-admin',
    imports: [RouterLink],
    templateUrl: './header-admin.html',
    styleUrl: './header-admin.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderAdmin {
    private readonly userService = inject(UserService);
    protected readonly navigationService = inject(NavigationService);
    protected readonly currentUser = this.userService.currentUser;
}
