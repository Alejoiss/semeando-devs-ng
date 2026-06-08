import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SubModuleService } from '../../../services/sub-module';
import { UserSubModuleService } from '../../../services/user-sub-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { ModuleService } from '../../../services/module';
import { AchievementsService } from '../../../services/achievements';
import { UserService } from '../../../services/user';
import { SubModule } from '../../../../models/sub-module/sub-module';
import { Module } from '../../../../models/module/module';
import { Achievements } from '../../../../models/achievements/achievements';
import { SectionContentService } from '../../../services/section-content';
import { SectionContent, SectionContentType } from '../../../../models/section-content/section-content';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';

export interface SubmoduleWithState {
    submodule: SubModule;
    progressState: 'not-started' | 'in-progress' | 'completed' | 'blocked';
    targetLessonId: string | null;
    progressPercentage: number;
}

@Component({
    selector: 'app-submodule',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownModule],
    templateUrl: './submodule.html',
    styleUrls: ['./submodule.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Submodule implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private submoduleService = inject(SubModuleService);
    private userSubmoduleService = inject(UserSubModuleService);
    private lessonService = inject(LessonService);
    private userLessonService = inject(UserLessonService);
    private moduleService = inject(ModuleService);
    private achievementsService = inject(AchievementsService);
    private userService = inject(UserService);
    private sectionContentService = inject(SectionContentService);
    private sanitizer = inject(DomSanitizer);

    module = signal<Module | null>(null);
    submodulesWithState = signal<SubmoduleWithState[]>([]);
    achievement = signal<Achievements | null>(null);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    presentationContents = signal<SectionContent[]>([]);
    isPresentationCollapsed = signal<boolean>(true);
    SectionContentType = SectionContentType;

    getSafeHtml(html: string | undefined): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html || '');
    }

    togglePresentation() {
        this.isPresentationCollapsed.update(c => !c);
    }

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        try {
            this.isLoading.set(true);
            const slug = this.route.snapshot.paramMap.get('slug');
            
            if (!slug) {
                 this.error.set('Módulo não encontrado.');
                 return;
            }

            let userId = this.userService.currentUser()?.id;
            if (!userId) {
                await this.userService.loadUserProfile();
                userId = this.userService.currentUser()?.id;
            }
            if (!userId) {
                throw new Error('Usuário não autenticado.');
            }

            // Group 1: Parallel fetch independent resources
            const [
                submodules,
                userSubmodules,
                userLessons,
                module,
                allModuleLessons
            ] = await Promise.all([
                this.submoduleService.getSubModulesByModuleSlug(slug),
                this.userSubmoduleService.getUserSubModulesForUser(userId),
                this.userLessonService.getUserLessonsForUser(userId).catch(() => []),
                this.moduleService.getModuleBySlug(slug),
                this.lessonService.getLessonsByModuleSlug(slug).catch(() => [])
            ]);

            if (module) {
                this.module.set(module);
            } else {
                this.error.set('Módulo não encontrado.');
                this.isLoading.set(false);
                return;
            }

            // Group 2: Fetch resources dependent on module ID
            const [achievement, presentation] = await Promise.all([
                this.achievementsService.getAchievementByModuleId(module.id).catch(() => null),
                this.sectionContentService.getSectionContentsByModuleId(module.id).catch(() => [])
            ]);

            this.achievement.set(achievement);
            this.presentationContents.set(presentation);

            const isPro = this.userService.currentUser()?.isPro || false;

            const completedLessonIds = new Set<string>(
                userLessons.filter((ul: any) => ul.completed).map((ul: any) => ul.lesson?.id || ul.lesson_id)
            );

            // Group batch-fetched lessons by subModuleId
            const lessonsBySubmoduleMap = new Map<string, any[]>();
            for (const lesson of allModuleLessons) {
                const lessonsList = lessonsBySubmoduleMap.get(lesson.subModuleId) || [];
                lessonsList.push(lesson);
                lessonsBySubmoduleMap.set(lesson.subModuleId, lessonsList);
            }

            const sortedSubmodules = [...submodules].sort((a, b) => (a.order || 0) - (b.order || 0));

            let previousCompleted = true;
            const withState: SubmoduleWithState[] = [];

            for (const sm of sortedSubmodules) {
                // @ts-ignore - DB returns sub_module_id as well
                const usm = userSubmodules.find(u => u.subModule?.id === sm.id || u.sub_module_id === sm.id);
                let state: 'not-started' | 'in-progress' | 'completed' | 'blocked' = 'not-started';

                if (usm) {
                    state = usm.completed ? 'completed' : 'in-progress';
                } else if (!previousCompleted) {
                    state = 'blocked';
                }

                if ((sm.order ?? 0) > 1 && !isPro) {
                    state = 'blocked';
                }

                previousCompleted = state === 'completed';

                let targetLessonId: string | null = null;
                let progressPercentage = 0;

                if (state === 'completed') {
                    progressPercentage = 100;
                }

                const lessons = lessonsBySubmoduleMap.get(sm.id) || [];
                if (lessons.length > 0) {
                    if (state === 'in-progress') {
                        const sortedLessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
                        const firstIncomplete = sortedLessons.find(l => !completedLessonIds.has(l.id));
                        targetLessonId = firstIncomplete?.id ?? sortedLessons[0].id;
                        
                        const completedCount = lessons.filter(l => completedLessonIds.has(l.id)).length;
                        progressPercentage = Math.round((completedCount / lessons.length) * 100);
                    } else {
                        const sortedLessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
                        targetLessonId = sortedLessons[0].id;
                    }
                }

                withState.push({
                    submodule: sm,
                    progressState: state,
                    targetLessonId,
                    progressPercentage
                });
            }

            this.submodulesWithState.set(withState);
            this.error.set(null);
        } catch (err: any) {
            this.error.set(err.message || 'Erro ao carregar os submódulos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async onStartSubmodule(submoduleId: string, slug: string): Promise<void> {
        try {
            await this.userSubmoduleService.startSubModule(submoduleId);
            await this.router.navigate(['ss', slug], { relativeTo: this.route });
        } catch (err) {
            console.error('Erro ao iniciar submódulo:', err);
        }
    }
}
