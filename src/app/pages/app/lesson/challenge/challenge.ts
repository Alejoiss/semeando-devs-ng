import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { CodeEditorModule, CodeModel } from '@ngstack/code-editor';

import { LessonService } from '../../../../services/lesson';
import { UserLessonService } from '../../../../services/user-lesson';
import { SectionContentService } from '../../../../services/section-content';
import { AchievementsService } from '../../../../services/achievements';
import { SeedService } from '../../../../services/seed';
import { XpService } from '../../../../services/xp';

import { Lesson as LessonModel } from '../../../../../models/lesson/lesson';
import { UserLesson } from '../../../../../models/user-lesson/user-lesson';
import { SectionContent } from '../../../../../models/section-content/section-content';
import { AiCreditsService } from '../../../../services/ai-credits/ai-credits';

@Component({
    selector: 'app-challenge',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownModule, CodeEditorModule],
    templateUrl: './challenge.html',
    styleUrl: './challenge.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Challenge implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private lessonService = inject(LessonService);
    private userLessonService = inject(UserLessonService);
    private sectionContentService = inject(SectionContentService);
    private achievementsService = inject(AchievementsService);
    private seedService = inject(SeedService);
    private xpService = inject(XpService);
    private aiCreditsService = inject(AiCreditsService);

    lessonId = signal<string>('');
    slugSubmodule = signal<string>('');
    slug = signal<string>('');

    lesson = signal<LessonModel | null>(null);
    userLesson = signal<UserLesson | null>(null);
    sectionContents = signal<SectionContent[]>([]);

    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    isSubmitting = signal<boolean>(false);
    aiFeedback = signal<string | null>(null);
    xpAwarded = signal<number>(0);
    evaluationResult = signal<any>(null);
    passed = signal<boolean>(false);

    theme = 'vs-dark';

    codeModel = signal<CodeModel>({
        language: 'javascript',
        uri: 'main.js',
        value: '// Escreva seu código aqui\n'
    });
    currentCode = signal<string>('// Escreva seu código aqui\n');

    options = {
        contextmenu: true,
        minimap: {
            enabled: false
        }
    };

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
                this.error.set('Desafio não encontrado.');
                return;
            }

            this.slugSubmodule.set(slugSubmodule);
            this.lessonId.set(lessonId);
            this.slug.set(slug ?? '');

            const [lesson, userLesson, sectionContents] = await Promise.all([
                this.lessonService.getLessonById(lessonId),
                this.userLessonService.getUserLesson(lessonId),
                this.sectionContentService.getSectionContentsByLessonId(lessonId),
            ]);

            if (!lesson) {
                this.error.set('Desafio não encontrado.');
                return;
            }

            // Start lesson if it doesn't exist
            if (!userLesson) {
                await this.userLessonService.startLesson(lessonId);
            }

            this.lesson.set(lesson);
            this.userLesson.set(userLesson);
            this.sectionContents.set(sectionContents);

            const lang = lesson.language || 'javascript';
            const initCode = userLesson?.savedCode 
                ? (userLesson.savedCode as string) 
                : (lesson.initialCode || '// Escreva seu código aqui\n');

            this.codeModel.set({
                language: lang,
                uri: `main.${lang}`,
                value: initCode
            });
            this.currentCode.set(initCode);

            if (userLesson?.aiFeedback) {
                this.aiFeedback.set(userLesson.aiFeedback);
                this.passed.set(userLesson.completed);
            }

            this.error.set(null);
        } catch (err: unknown) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar o desafio.');
        } finally {
            this.isLoading.set(false);
        }
    }

    onCodeChanged(value: string) {
        this.currentCode.set(value);
    }

    async saveDraft() {
        if (!this.lessonId()) return;
        try {
            await this.userLessonService.updateDraftCode(this.lessonId(), this.currentCode());
        } catch (err) {
            console.error('Erro ao salvar rascunho', err);
        }
    }

    async submitChallenge() {
        if (this.isSubmitting() || this.passed()) return;

        try {
            this.isSubmitting.set(true);
            await this.saveDraft();

            const description = this.sectionContents()
                .map(s => s.content)
                .join('\n');

            const result = await this.userLessonService.evaluateChallenge(
                this.lessonId(),
                description,
                this.currentCode()
            );

            this.evaluationResult.set(result);
            this.aiFeedback.set(result.aiFeedback);
            this.passed.set(true);
            this.xpAwarded.set(result.xpAwarded);

            this.aiCreditsService.incrementSubmitCodeUsage();
            this.aiCreditsService.refreshCredits().catch(console.error);

            if (result.xpAwarded > 0) {
                const seedsAwarded = Math.ceil((this.lesson()?.xp ?? 0) * 0.1);
                await this.seedService.creditSeeds(seedsAwarded);
            }

            await this.xpService.refreshXp();
            await this.achievementsService.checkUnseenAchievements();

        } catch (err: unknown) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao avaliar o desafio.');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    continueChallenge() {
        if (this.isSubmitting()) return;

        const result = this.evaluationResult();
        const slug = this.slug();
        const slugSubmodule = this.slugSubmodule();

        if (result?.moduleCompleted) {
            this.router.navigate(['/app/s', slug, 'finished']);
        } else if (result?.subModuleCompleted) {
            this.router.navigate(['/app/s', slug]);
        } else {
            this.router.navigate(['/app/s', slug, 'ss', slugSubmodule]);
        }
    }
}
