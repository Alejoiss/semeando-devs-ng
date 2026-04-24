import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AchievementsService } from '../../services/achievements';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-achievement-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './achievement-modal.html',
    styleUrl: './achievement-modal.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('modalAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
                animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }))
            ])
        ]),
        trigger('overlayAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
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
