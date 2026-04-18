import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubModuleService } from '../../../services/sub-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { SubModule } from '../../../../models/sub-module/sub-module';
import { Lesson } from '../../../../models/lesson/lesson';
import { UserLesson } from '../../../../models/user-lesson/user-lesson';

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

    submodule = signal<SubModule | null>(null);
    slug = signal<string>('');
    slugSubmodule = signal<string>('');
    lessons = signal<Lesson[]>([]);
    userLessons = signal<UserLesson[]>([]);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    lessonsWithState = computed<LessonWithState[]>(() => {
        const userLessonMap = new Map<string, UserLesson>(
            this.userLessons().map(ul => [ul.lesson?.id, ul])
        );
        const sortedLessons = [...this.lessons()].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        let previousCompleted = true;
        return sortedLessons.map(lesson => {
            const userLesson = userLessonMap.get(lesson.id);
            let progressState: 'not-started' | 'in-progress' | 'completed' | 'blocked' = 'not-started';
            
            if (userLesson) {
                progressState = userLesson.completed ? 'completed' : 'in-progress';
            } else if (!previousCompleted) {
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

            this.slug.set(slug);
            this.slugSubmodule.set(slugSubmodule);

            const [submodules, lessons, userLessons] = await Promise.all([
                this.subModuleService.getSubModulesByModuleSlug(slug),
                this.lessonService.getLessonsBySubModuleSlug(slugSubmodule),
                this.userLessonService.getUserLessons(),
            ]);

            const submodule = submodules.find(
                // @ts-ignore - DB returns slug field directly
                sm => sm.slug === slugSubmodule
            ) ?? null;

            this.submodule.set(submodule);
            this.lessons.set(lessons);
            this.userLessons.set(userLessons);
            this.error.set(null);
        } catch (err: unknown) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar os dados.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
