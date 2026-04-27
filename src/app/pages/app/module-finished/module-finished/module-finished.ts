import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ModuleService } from '../../../../services/module';
import { AchievementsService } from '../../../../services/achievements';
import { UserModuleService } from '../../../../services/user-module';
import { Module } from '../../../../../models/module/module';
import { Achievements } from '../../../../../models/achievements/achievements';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-module-finished',
    imports: [CommonModule, RouterLink],
    templateUrl: './module-finished.html',
    styleUrl: './module-finished.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleFinished implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private moduleService = inject(ModuleService);
    private achievementsService = inject(AchievementsService);
    private userModuleService = inject(UserModuleService);

    protected readonly isLoading = signal<boolean>(true);
    protected readonly module = signal<Module | null>(null);
    protected readonly moduleAchievement = signal<Achievements | null>(null);

    protected readonly earnedSeeds = computed(() =>
        Math.ceil((this.moduleAchievement()?.xpAmount ?? 0) * 0.1)
    );

    async ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('slug');

        if (!slug) {
            this.router.navigate(['/app']);
            return;
        }

        try {
            const [mod, allAchievements] = await Promise.all([
                this.moduleService.getModuleBySlug(slug),
                this.achievementsService.getAchievements(),
            ]);

            if (!mod) {
                this.isLoading.set(false);
                return;
            }

            // Guard: only show this screen if the module is actually completed
            const completed = await this.userModuleService.isModuleCompleted(mod.id);
            if (!completed) {
                this.router.navigate(['/app']);
                return;
            }

            this.module.set(mod);

            const matched = allAchievements.find(
                (a) => a.moduleId === mod.id
            ) ?? null;
            this.moduleAchievement.set(matched);
        } catch {
            this.module.set(null);
        } finally {
            this.isLoading.set(false);
        }
    }
}
