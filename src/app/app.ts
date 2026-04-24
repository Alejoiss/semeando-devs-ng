import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AchievementModalComponent } from './components/achievement-modal/achievement-modal';
import { AchievementsService } from './services/achievements';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, AchievementModalComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {
    private achievementsService = inject(AchievementsService);

    constructor(router: Router) {
        router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            });

        this.achievementsService.checkUnseenAchievements();
    }
}
