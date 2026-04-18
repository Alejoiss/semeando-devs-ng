import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { SectionContentService } from '../../../services/section-content';
import { Lesson as LessonModel } from '../../../../models/lesson/lesson';
import { UserLesson } from '../../../../models/user-lesson/user-lesson';
import { SectionContent } from '../../../../models/section-content/section-content';
import { ExtraMaterialService } from '../../../services/extra-material';
import { ExtraMaterial } from '../../../../models/extra-material/extra-material';
export interface LessonWithState {
    lesson: LessonModel;
    progressState: 'not-started' | 'in-progress' | 'completed';
}

@Component({
    selector: 'app-lesson',
    imports: [CommonModule, RouterLink, MarkdownModule],
    templateUrl: './lesson.html',
    styleUrls: ['./lesson.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lesson implements OnInit {
    private route = inject(ActivatedRoute);
    private lessonService = inject(LessonService);
    private userLessonService = inject(UserLessonService);
    private sectionContentService = inject(SectionContentService);
    private extraMaterialService = inject(ExtraMaterialService);

    lessonId = signal<string>('');
    slugSubmodule = signal<string>('');
    slug = signal<string>('');
    lessons = signal<LessonModel[]>([]);
    userLessons = signal<UserLesson[]>([]);
    sectionContents = signal<SectionContent[]>([]);
    extraMaterials = signal<ExtraMaterial[]>([]);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    activeLesson = computed<LessonModel | undefined>(() =>
        this.lessons().find(l => l.id === this.lessonId())
    );

    lessonsWithState = computed<LessonWithState[]>(() => {
        const userLessonMap = new Map<string, UserLesson>(
            this.userLessons().map(ul => [ul.lesson?.id, ul])
        );
        return this.lessons().map(lesson => {
            const userLesson = userLessonMap.get(lesson.id);
            let progressState: 'not-started' | 'in-progress' | 'completed' = 'not-started';
            if (userLesson) {
                progressState = userLesson.completed ? 'completed' : 'in-progress';
            }
            return { lesson, progressState };
        });
    });

    ngOnInit(): void {
        this.route.paramMap.subscribe(() => {
            this.loadData();
        });
    }

    async loadData(): Promise<void> {
        try {
            this.isLoading.set(true);
            const params = this.route.snapshot.paramMap;
            const slugSubmodule = params.get('slugSubmodule');
            const lessonId = params.get('lessonId');
            const slug = params.get('slug');

            if (!slugSubmodule || !lessonId) {
                this.error.set('Aula não encontrada.');
                return;
            }

            this.slugSubmodule.set(slugSubmodule);
            this.lessonId.set(lessonId);
            this.slug.set(slug ?? '');

            const [lessons, userLessons, sectionContents, extraMaterials] = await Promise.all([
                this.lessonService.getLessonsBySubModuleSlug(slugSubmodule),
                this.userLessonService.getUserLessons(),
                this.sectionContentService.getSectionContentsByLessonId(lessonId),
                this.extraMaterialService.getExtraMaterialsByLessonId(lessonId),
            ]);

            this.lessons.set(lessons);
            this.userLessons.set(userLessons);
            this.sectionContents.set(sectionContents);
            this.extraMaterials.set(extraMaterials);
            this.error.set(null);
        } catch (err: unknown) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar a aula.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
