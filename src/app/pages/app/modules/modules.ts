import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Module } from '../../../../models/module/module';
import { UserModule } from '../../../../models/user-module/user-module';
import { ModuleService } from '../../../services/module';
import { UserModuleService } from '../../../services/user-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { RankingWeeklyService } from '../../../services/ranking-weekly';
import { UserService } from '../../../services/user';
import { Lesson } from '../../../../models/lesson/lesson';
import { UserLesson } from '../../../../models/user-lesson/user-lesson';
import { RankingEntry } from '../../../../models/ranking/ranking';

type ProgressState = 'not-started' | 'in-progress' | 'completed';

interface ModuleWithState {
    module: Module;
    progressState: ProgressState;
    progressPercentage: number;
}

@Component({
    selector: 'app-modules',
    imports: [RouterLink, DecimalPipe],
    templateUrl: './modules.html',
    styleUrls: ['./modules.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modules implements OnInit {
    private readonly moduleService = inject(ModuleService);
    private readonly userModuleService = inject(UserModuleService);
    private readonly lessonService = inject(LessonService);
    private readonly userLessonService = inject(UserLessonService);
    private readonly rankingWeeklyService = inject(RankingWeeklyService);
    protected readonly userService = inject(UserService);
    private readonly router = inject(Router);

    protected readonly modules = signal<Module[]>([]);
    protected readonly userModules = signal<any[]>([]);
    protected readonly allLessons = signal<{ id: string; subModuleId: string; moduleId: string }[]>([]);
    protected readonly userLessons = signal<any[]>([]);
    
    protected readonly podiumUsers = signal<RankingEntry[]>([]);
    protected readonly currentUserPosition = signal<number | null>(null);
    protected readonly currentUserXp = signal<number>(0);

    protected readonly isLoading = signal<boolean>(true);
    protected readonly error = signal<string | null>(null);

    protected readonly modulesWithState = computed<ModuleWithState[]>(() => {
        const userModuleMap = new Map<string, any>(
            this.userModules().map((um) => [um.module_id || um.module?.id, um])
        );

        return this.modules().map((module) => {
            const userModule = userModuleMap.get(module.id);
            let progressState: ProgressState = 'not-started';
            let progressPercentage = 0;

            if (userModule) {
                progressState = userModule.completed ? 'completed' : 'in-progress';
                
                if (progressState === 'completed') {
                    progressPercentage = 100;
                } else {
                    const moduleLessons = this.allLessons().filter(l => l.moduleId === module.id);
                    if (moduleLessons.length > 0) {
                        const completedCount = this.userLessons().filter(ul => 
                            ul.completed && moduleLessons.some(l => l.id === (ul.lesson?.id || ul.lesson_id))
                        ).length;
                        progressPercentage = Math.round((completedCount / moduleLessons.length) * 100);
                    }
                }
            }

            return { module, progressState, progressPercentage };
        });
    });

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            this.isLoading.set(true);

            let userId = this.userService.currentUser()?.id;
            if (!userId) {
                await this.userService.loadUserProfile();
                userId = this.userService.currentUser()?.id;
            }
            if (!userId) {
                throw new Error('Usuário não autenticado.');
            }

            const [modules, userModules, userLessons, rankingResult, lightweightLessons] = await Promise.all([
                this.moduleService.getModulesForDisplay(),
                this.userModuleService.getUserModulesForUser(userId),
                this.userLessonService.getUserLessonsForUser(userId),
                this.rankingWeeklyService.getRanking(),
                this.lessonService.getLessonsLightweight()
            ]);

            this.modules.set(modules.filter(m => !m.inRevision));
            this.userModules.set(userModules);
            this.userLessons.set(userLessons);
            this.allLessons.set(lightweightLessons);

            // Ranking data
            this.podiumUsers.set(rankingResult.ranking.slice(0, 3));
            this.currentUserPosition.set(rankingResult.currentUser.position);
            this.currentUserXp.set(rankingResult.currentUser.xp);

        } catch (err) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar os módulos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async onStartModule(moduleId: string, slug: string): Promise<void> {
        try {
            await this.userModuleService.startModule(moduleId);
            await this.router.navigate(['/app/s', slug]);
        } catch (err) {
            console.error('Erro ao iniciar módulo:', err);
        }
    }
}
