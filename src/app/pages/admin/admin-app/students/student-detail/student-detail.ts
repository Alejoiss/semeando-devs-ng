import { ChangeDetectionStrategy, Component, inject, signal, effect, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminStudentService } from '../../../../../services/admin-student';
import { ModuleService } from '../../../../../services/module';
import { UserModuleService } from '../../../../../services/user-module';
import { UserLessonService } from '../../../../../services/user-lesson';
import { AchievementsService } from '../../../../../services/achievements';
import { XpService } from '../../../../../services/xp';
import { SeedService } from '../../../../../services/seed';
import { AdminStudent } from '../../../../../../models/admin-student/admin-student';
import { Achievements as AchievementModel } from '../../../../../../models/achievements/achievements';
import { UserAchievement } from '../../../../../../models/user-achievement/user-achievement';
import { NgOptimizedImage, DatePipe, CommonModule, DecimalPipe } from '@angular/common';
import { UserQuizService } from '../../../../../services/user-quiz';
import { UserQuiz } from '../../../../../../models/user-quiz/user-quiz';

@Component({
    selector: 'app-admin-student-detail',
    templateUrl: './student-detail.html',
    styleUrl: './student-detail.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgOptimizedImage, DatePipe, RouterLink, CommonModule, DecimalPipe]
})
export class AdminStudentDetail implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly adminStudentService = inject(AdminStudentService);
    private readonly moduleService = inject(ModuleService);
    private readonly userModuleService = inject(UserModuleService);
    private readonly userLessonService = inject(UserLessonService);
    private readonly userQuizService = inject(UserQuizService);
    private readonly achievementsService = inject(AchievementsService);
    private readonly xpService = inject(XpService);
    private readonly seedService = inject(SeedService);

    readonly studentId = signal<string | null>(null);
    readonly student = signal<AdminStudent | null>(null);
    readonly isLoading = signal(true);
    readonly error = signal<string | null>(null);

    readonly activeTab = signal<'general' | 'progress' | 'achievements'>('general');

    // Progress Tab State
    readonly curriculum = signal<any[]>([]);
    readonly userModules = signal<any[]>([]);
    readonly userLessons = signal<any[]>([]);
    readonly isProgressLoading = signal(false);

    // Gamification State
    readonly achievements = signal<AchievementModel[]>([]);
    readonly userAchievements = signal<UserAchievement[]>([]);
    readonly totalXp = signal<number>(0);
    readonly totalSeeds = signal<number>(0);
    readonly isGamificationLoading = signal(false);

    readonly earnedAchievementsCount = computed(() =>
        this.userAchievements().filter((ua) =>
            this.achievements().some((a) => a.id === ua.achievementId)
        ).length
    );

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id-aluno');
            this.studentId.set(id);
            if (id) {
                this.loadStudent(id);
            }
        });
    }

    async loadStudent(id: string) {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const result = await this.adminStudentService.getStudentById(id);
            this.student.set(result);
            await Promise.all([
                this.loadProgress(id),
                this.loadGamification(id)
            ]);
        } catch (err: any) {
            this.error.set(err.message || 'Não foi possível carregar os dados do aluno.');
            this.student.set(null);
        } finally {
            this.isLoading.set(false);
        }
    }

    async loadGamification(id: string) {
        this.isGamificationLoading.set(true);
        try {
            const [allAchievements, myAchievements, xp, seeds] = await Promise.all([
                this.achievementsService.getAchievements(),
                this.achievementsService.getUserAchievementsForUser(id),
                this.xpService.getXpForUser(id),
                this.seedService.getSeedsForUser(id)
            ]);

            this.achievements.set(allAchievements);
            this.userAchievements.set(myAchievements);
            this.totalXp.set(xp);
            this.totalSeeds.set(seeds);
        } catch (err) {
            console.error('Erro ao carregar gamificação:', err);
        } finally {
            this.isGamificationLoading.set(false);
        }
    }

    async loadProgress(id: string) {
        this.isProgressLoading.set(true);
        try {
            const [curriculum, userModules, userLessons, userQuizzes] = await Promise.all([
                this.moduleService.getCurriculum(),
                this.userModuleService.getUserModulesForUser(id),
                this.userLessonService.getUserLessonsForUser(id),
                this.userQuizService.getUserQuizzesForUser(id)
            ]);

            // Process curriculum to include user progress and expanded state
            const processed = curriculum.map((mod: any) => {
                const userModule = userModules.find((um: any) => um.module_id === mod.id);
                
                // Calculate percentage
                let completedCount = 0;
                let totalCount = 0;
                
                const submodules = mod.submodules.map((sub: any) => {
                    let subCompletedCount = 0;
                    let subTotalCount = 0;
                    
                    const lessons = sub.lessons.filter((l: any) => l.type === 'LESSON' || l.type === 'QUIZ' || l.type === 'CHALLENGE').map((lesson: any) => {
                        const userLesson = userLessons.find((ul: any) => (ul.lesson?.id || ul.lesson_id) === lesson.id);
                        const userQuiz = userQuizzes.find((q: any) => q.lessonId === lesson.id);
                        const isCompleted = userLesson?.completed || false;
                        
                        if (isCompleted) {
                            completedCount++;
                            subCompletedCount++;
                        }
                        totalCount++;
                        subTotalCount++;

                        return {
                            ...lesson,
                            isCompleted,
                            score: userLesson?.score || null,
                            quiz: userQuiz || null
                        };
                    });
                    
                    const subProgressPercentage = subTotalCount === 0 ? 0 : Math.round((subCompletedCount / subTotalCount) * 100);

                    return {
                        ...sub,
                        expanded: false,
                        progressPercentage: subProgressPercentage,
                        lessons
                    };
                });

                const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

                return {
                    ...mod,
                    expanded: false,
                    isStarted: !!userModule,
                    isCompleted: userModule?.completed || false,
                    progressPercentage,
                    submodules
                };
            });

            this.curriculum.set(processed);
            this.userModules.set(userModules);
            this.userLessons.set(userLessons);
        } catch (err) {
            console.error('Erro ao carregar progresso:', err);
        } finally {
            this.isProgressLoading.set(false);
        }
    }

    toggleModule(mod: any) {
        mod.expanded = !mod.expanded;
        this.curriculum.update(c => [...c]);
    }

    toggleSubmodule(sub: any) {
        sub.expanded = !sub.expanded;
        this.curriculum.update(c => [...c]);
    }

    // Gamification Helpers
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
