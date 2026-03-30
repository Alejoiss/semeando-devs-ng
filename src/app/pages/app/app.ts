import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AsideMenu } from '../../components/aside-menu/aside-menu';
import { InternalHeader } from '../../components/internal-header/internal-header';

@Component({
    selector: 'app-app',
    standalone: true,
    imports: [
        RouterModule,
        InternalHeader,
        AsideMenu
    ],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {

}
