import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { RankingOverallService } from '../../../services/ranking-overall';
import { RankingMonthlyService } from '../../../services/ranking-monthly';
import { RankingWeeklyService } from '../../../services/ranking-weekly';
import { RankingEntry } from '../../../../models/ranking/ranking';
import { UserService } from '../../../services/user';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-ranking',
    imports: [RouterLink],
    templateUrl: './ranking.html',
    styleUrl: './ranking.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ranking implements OnInit {
    private rankingOverallService = inject(RankingOverallService);
    private rankingMonthlyService = inject(RankingMonthlyService);
    private rankingWeeklyService = inject(RankingWeeklyService);
    protected userService = inject(UserService);

    activeTab = signal<'geral' | 'mensal' | 'semanal'>('geral');
    isLoading = signal<boolean>(true);

    podiumUsers = signal<RankingEntry[]>([]);
    rankedUsers = signal<RankingEntry[]>([]);
    isRankingComplete = computed(() => {
        return (this.podiumUsers().length + this.rankedUsers().length) >= 4;
    });
    currentUserPosition = signal<number | null>(null);
    currentUserXp = signal<number>(0);
    currentUserName = signal<string>('');
    currentUserAvatar = signal<string | null>(null);

    async ngOnInit() {
        const user = await this.userService.getUserProfile();
        this.currentUserName.set(user.name || 'Usuário');
        this.currentUserAvatar.set(user.avatar || null);

        await this.loadRanking();
    }

    async switchTab(tab: 'geral' | 'mensal' | 'semanal') {
        if (this.activeTab() === tab) return;
        this.activeTab.set(tab);
        await this.loadRanking();
    }

    async loadRanking() {
        this.isLoading.set(true);
        try {
            let result;
            switch (this.activeTab()) {
                case 'geral':
                    result = await this.rankingOverallService.getRanking();
                    break;
                case 'mensal':
                    result = await this.rankingMonthlyService.getRanking();
                    break;
                case 'semanal':
                    result = await this.rankingWeeklyService.getRanking();
                    break;
            }

            const ranking = result.ranking || [];

            this.podiumUsers.set(ranking.slice(0, 3));
            this.rankedUsers.set(ranking.slice(3));

            this.currentUserPosition.set(result.currentUser.position);
            this.currentUserXp.set(result.currentUser.xp);

        } catch (error) {
            console.error('Failed to load ranking:', error);
            this.podiumUsers.set([]);
            this.rankedUsers.set([]);
            this.currentUserPosition.set(null);
            this.currentUserXp.set(0);
        } finally {
            this.isLoading.set(false);
        }
    }

    getInitials(name: string | null): string {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}
