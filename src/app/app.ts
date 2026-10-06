import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AchievementModalComponent } from './components/achievement-modal/achievement-modal';
import { AchievementsService } from './services/achievements';
import { SeoService } from './services/seo/seo';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, AchievementModalComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {
    private achievementsService = inject(AchievementsService);

    constructor(router: Router) {
        inject(SeoService).init();

        if (!isPlatformBrowser(inject(PLATFORM_ID))) {
            return;
        }

        router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            });

        this.achievementsService.checkUnseenAchievements();
    }
}
