import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [
        CommonModule, RouterModule
    ],
    templateUrl: './header.html',
    styleUrls: ['./header.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(window:scroll)': 'onWindowScroll()'
    }
})
export class Header {
    protected readonly isScrolled = signal(false);

    protected onWindowScroll() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.isScrolled.set(scrollPosition > 20);
    }
}
