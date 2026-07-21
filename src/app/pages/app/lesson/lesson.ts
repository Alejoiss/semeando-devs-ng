import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user';
export interface LessonWithState {
    lesson: LessonModel;
    progressState: 'not-started' | 'in-progress' | 'completed';
}

@Component({
    selector: 'app-lesson',
    imports: [CommonModule, RouterLink, MarkdownModule, RouterModule],
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
    private sanitizer = inject(DomSanitizer);
    private userService = inject(UserService);

    protected readonly isPro = computed(() => this.userService.currentUser()?.isPro ?? false);

    getSafeHtml(html: string | undefined): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html || '');
    }

    lessonId = signal<string>('');
    slugSubmodule = signal<string>('');
    slug = signal<string>('');
    lessons = signal<LessonModel[]>([]);
    userLessons = signal<UserLesson[]>([]);
    sectionContents = signal<SectionContent[]>([]);
    extraMaterials = signal<ExtraMaterial[]>([]);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);
    isDailyBlocked = signal<boolean>(false);

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
        this.route.queryParamMap.subscribe(params => {
            this.isDailyBlocked.set(params.get('bloqueado') === '1');
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

            if (this.isDailyBlocked() && !this.isPro()) {
                this.isLoading.set(false);
                return;
            }
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
