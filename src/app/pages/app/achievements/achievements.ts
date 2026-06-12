import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { AchievementsService } from '../../../services/achievements';
import { XpService } from '../../../services/xp';
import { SeedService } from '../../../services/seed';
import { Achievements as AchievementModel } from '../../../../models/achievements/achievements';
import { UserAchievement } from '../../../../models/user-achievement/user-achievement';

import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-achievements',
    imports: [CommonModule, DecimalPipe],
    templateUrl: './achievements.html',
    styleUrl: './achievements.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Achievements implements OnInit {
    private achievementsService = inject(AchievementsService);
    private xpService = inject(XpService);
    private seedService = inject(SeedService);

    public achievements = signal<AchievementModel[]>([]);
    public userAchievements = signal<UserAchievement[]>([]);
    public totalXp = this.xpService.totalXp;
    public totalSeeds = this.seedService.totalSeeds;

    public earnedAchievementsCount = computed(() =>
        this.userAchievements().filter((ua) =>
            this.achievements().some((a) => a.id === ua.achievementId)
        ).length
    );

    async ngOnInit() {
        const [allAchievements, myAchievements] = await Promise.all([
            this.achievementsService.getAchievements(),
            this.achievementsService.getUserAchievements(),
        ]);

        this.achievements.set(allAchievements);
        this.userAchievements.set(myAchievements);

        // Ensure XP and Seeds are loaded
        await Promise.all([
            this.xpService.getXp(),
            this.seedService.getSeeds()
        ]);
    }

    getGradientClasses(identification: string): string {
        const gradients: Record<string, string> = {
            'APRENDIZ_DE_TAGS': 'from-primary to-tertiary',
            'COMBO_INSANO': 'from-primary to-secondary',
            'ESTILISTA_DA_WEB': 'from-secondary to-primary',
            'IMPARAVEL': 'from-orange-400 to-red-500',
            'MAGO_DAS_FUNCOES': 'from-primary to-tertiary',
            'MARATONISTA_DO_CODIGO': 'from-secondary to-primary',
            'MEU_PRIMEIRO_DESAFIO': 'from-primary-dim to-secondary',
            'MINHA_PRIMEIRA_REVISAO': 'from-tertiary-dim to-primary',
            'MODO_FOGUETE': 'from-orange-400 to-red-500',
            'PERFECCIONISTA_DO_CODIGO': 'from-primary to-secondary',
            'PRIMEIRO_PASSO_NO_CODIGO': 'from-tertiary to-primary-container',
            'SERIE_PERFEITA': 'from-secondary-dim to-primary'
        };

        return gradients[identification] || 'from-primary to-tertiary';
    }

    isEarned(achievementId: string): boolean {
        return this.userAchievements().some(ua => ua.achievementId === achievementId);
    }

    getEarnedDate(achievementId: string): string | null {
        const ua = this.userAchievements().find(ua => ua.achievementId === achievementId);
        if (!ua) return null;

        return ua.createdAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).toUpperCase();
    }
}
