import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AchievementsService } from '../../services/achievements';
import { MotionReveal } from '../../directives/motion-reveal';

@Component({
    selector: 'app-achievement-modal',
    standalone: true,
    imports: [MotionReveal, CommonModule],
    templateUrl: './achievement-modal.html',
    styleUrl: './achievement-modal.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementModalComponent {
    private achievementsService = inject(AchievementsService);
    private router = inject(Router);

    protected readonly data = this.achievementsService.unseenAchievement;
    protected readonly achievement = computed(() => this.data()?.achievement);

    protected close() {
        const current = this.data();
        if (current) {
            this.achievementsService.markAsViewed(current.achievement_id);
        }
    }

    protected viewAchievements() {
        const current = this.data();
        if (current) {
            this.achievementsService.markAsViewed(current.achievement_id);
            this.router.navigate(['/app/conquistas']);
        }
    }
}
