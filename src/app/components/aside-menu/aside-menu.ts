import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../services/user';
import { NavigationService } from '../../services/navigation';

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
}
