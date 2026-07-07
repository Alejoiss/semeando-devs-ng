import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SubModuleService } from '../../../services/sub-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { SubModule } from '../../../../models/sub-module/sub-module';
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
    selector: 'app-submodule-detail',
    imports: [CommonModule, RouterLink],
    templateUrl: './submodule-detail.html',
    styleUrls: ['./submodule-detail.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmoduleDetail implements OnInit {
    private route = inject(ActivatedRoute);
    private subModuleService = inject(SubModuleService);
    private lessonService = inject(LessonService);
    private userLessonService = inject(UserLessonService);
    private userQuizService = inject(UserQuizService);
    private router = inject(Router);
    protected readonly dailyLimitService = inject(DailyLimitService);
    private readonly userService = inject(UserService);

    submodule = signal<SubModule | null>(null);
    slug = signal<string>('');
    slugSubmodule = signal<string>('');
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
        const isPro = this.userService.currentUser()?.isPro ?? false;
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
            const slugSubmodule = this.route.snapshot.paramMap.get('slugSubmodule');

            if (!slug || !slugSubmodule) {
                this.error.set('Submódulo não encontrado.');
                return;
            }

            const userId = this.userService.currentUser()?.id;

            const [submodules, lessons, userLessons] = await Promise.all([
                this.subModuleService.getSubModulesByModuleSlug(slug),
                this.lessonService.getLessonsBySubModuleSlug(slugSubmodule),
                this.userLessonService.getUserLessons(),
                ...(userId && !this.userService.currentUser()?.isPro
                    ? [this.dailyLimitService.loadDailyCount(userId)]
                    : []),
            ]);

            const submodule = submodules.find(
                // @ts-ignore - DB returns slug field directly
                sm => sm.slug === slugSubmodule
            ) ?? null;

            this.submodule.set(submodule);
            this.lessons.set(lessons as Lesson[]);
            this.userLessons.set(userLessons as UserLesson[]);

            if (submodule) {
                const quizzes = await this.userQuizService.getUserQuizzesBySubModule(submodule.id);
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
