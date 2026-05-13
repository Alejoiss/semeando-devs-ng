import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AsideMenu } from '../../components/aside-menu/aside-menu';
import { InternalHeader } from '../../components/internal-header/internal-header';
import { NewsletterModal } from '../../components/newsletter-modal/newsletter-modal';
import { NavigationService } from '../../services/navigation';
import { inject } from '@angular/core';

@Component({
    selector: 'app-app',
    standalone: true,
    imports: [
        RouterModule,
        InternalHeader,
        AsideMenu,
        NewsletterModal
    ],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected readonly navigationService = inject(NavigationService);
}
