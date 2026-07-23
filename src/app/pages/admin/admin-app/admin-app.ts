import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../../services/navigation';
import { HeaderAdmin } from '../components/header-admin/header-admin';
import { AsideAdmin } from '../components/aside-admin/aside-admin';

@Component({
    selector: 'app-admin-app',
    imports: [
        RouterModule,
        HeaderAdmin,
        AsideAdmin,
    ],
    templateUrl: './admin-app.html',
    styleUrl: './admin-app.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminApp {
    protected readonly navigationService = inject(NavigationService);
}
