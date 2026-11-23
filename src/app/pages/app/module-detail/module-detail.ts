import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ModuleService } from '../../../services/module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { Module } from '../../../../models/module/module';
import { Lesson, LessonType } from '../../../../models/lesson/lesson';
import { UserLesson } from '../../../../models/user-lesson/user-lesson';
import { UserQuizService } from '../../../services/user-quiz';
import { UserQuiz } from '../../../../models/user-quiz/user-quiz';
import { DailyLimitService } from '../../../services/daily-limit/daily-limit';
import { UserService } from '../../../services/user';

export interface LessonWithState {
    lesson: Lesson;
    progressState: 'not-started' | 'in-progress' | 'completed' | 'blocked';
}

@Component({
    selector: 'app-module-detail',
    imports: [CommonModule, RouterLink],
    templateUrl: './module-detail.html',
    styleUrls: ['./module-detail.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleDetail implements OnInit {
    private route = inject(ActivatedRoute);
    private moduleService = inject(ModuleService);
    private lessonService = inject(LessonService);
    private userLessonService = inject(UserLessonService);
    private userQuizService = inject(UserQuizService);
    private router = inject(Router);
    protected readonly dailyLimitService = inject(DailyLimitService);
    private readonly userService = inject(UserService);
    protected readonly isPro = computed(() => this.userService.currentUser()?.isPro ?? false);

    module = signal<Module | null>(null);
    slug = signal<string>('');
    slugModule = signal<string>('');
    lessons = signal<Lesson[]>([]);
    userLessons = signal<UserLesson[]>([]);
    userQuizzes = signal<UserQuiz[]>([]);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    lessonQuizzesMap = computed<Map<string, UserQuiz>>(() => {
        const quizMap = new Map<string, UserQuiz>();
        this.userQuizzes().forEach(uq => {
            if (uq.lessonId) {
                const existing = quizMap.get(uq.lessonId);
                if (!existing || (uq.score > existing.score)) {
                    quizMap.set(uq.lessonId, uq);
                }
            }
        });
        return quizMap;
    });

    lessonsWithState = computed<LessonWithState[]>(() => {
        const userLessonMap = new Map<string, UserLesson>(
            this.userLessons().map(ul => [ul.lesson?.id, ul])
        );
        const sortedLessons = [...this.lessons()].sort((a, b) => (a.order || 0) - (b.order || 0));
        const isPro = this.isPro();
        const limitReached = !isPro && this.dailyLimitService.isDailyLimitReached();

        let previousCompleted = true;
        return sortedLessons.map(lesson => {
            const userLesson = userLessonMap.get(lesson.id);
            let progressState: 'not-started' | 'in-progress' | 'completed' | 'blocked' = 'not-started';

            if (userLesson) {
                progressState = userLesson.completed ? 'completed' : 'in-progress';
            } else if (!previousCompleted) {
                progressState = 'blocked';
            }

            if (progressState !== 'completed' && progressState !== 'blocked' && limitReached) {
                progressState = 'blocked';
            }

            previousCompleted = progressState === 'completed';
            return { lesson, progressState };
        });
    });

    completedCount = computed<number>(() =>
        this.lessonsWithState().filter(l => l.progressState === 'completed').length
    );

    completionPercentage = computed<number>(() => {
        const total = this.lessonsWithState().length;
        return total > 0 ? Math.round((this.completedCount() / total) * 100) : 0;
    });

    ngOnInit(): void {
        this.loadData();
    }

    async loadData(): Promise<void> {
        try {
            this.isLoading.set(true);
            const slug = this.route.snapshot.paramMap.get('slug');
            const slugModule = this.route.snapshot.paramMap.get('slugModule');

            if (!slug || !slugModule) {
                this.error.set('Módulo não encontrado.');
                return;
            }

            const userId = this.userService.currentUser()?.id;

            const [modules, lessons, userLessons] = await Promise.all([
                this.moduleService.getModulesByCourseSlug(slug),
                this.lessonService.getLessonsByModuleSlug(slugModule),
                this.userLessonService.getUserLessons(),
                ...(userId && !this.userService.currentUser()?.isPro
                    ? [this.dailyLimitService.loadDailyCount(userId)]
                    : []),
            ]);

            const module = modules.find(
                // @ts-ignore - DB returns slug field directly
                sm => sm.slug === slugModule
            ) ?? null;

            this.module.set(module);
            this.lessons.set(lessons as Lesson[]);
            this.userLessons.set(userLessons as UserLesson[]);

            if (module) {
                const quizzes = await this.userQuizService.getUserQuizzesByModule(module.id);
                this.userQuizzes.set(quizzes);
            }

            this.error.set(null);
        } catch (err: unknown) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar os dados.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async onStartLesson(lesson: Lesson): Promise<void> {
        try {
            await this.userLessonService.startLesson(lesson.id);
            if (lesson.type === LessonType.REVISION) {
                await this.router.navigate(['lesson', lesson.id, 'quiz'], { relativeTo: this.route });
                return;
            }
            if (lesson.type === LessonType.CHALLENGE) {
                await this.router.navigate(['lesson', lesson.id, 'challenge'], { relativeTo: this.route });
                return;
            }
            await this.router.navigate(['lesson', lesson.id], { relativeTo: this.route });
        } catch (err) {
            console.error('Erro ao iniciar lição:', err);
        }
    }
}
