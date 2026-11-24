import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ModuleService } from '../../../services/module';
import { UserModuleService } from '../../../services/user-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { CourseService } from '../../../services/course';
import { TrackService } from '../../../services/track';
import { TrackSummary } from '../../../../models/track/track';
import { AchievementsService } from '../../../services/achievements';
import { UserService } from '../../../services/user';
import { Module } from '../../../../models/module/module';
import { Course } from '../../../../models/course/course';
import { Achievements } from '../../../../models/achievements/achievements';
import { SectionContentService } from '../../../services/section-content';
import { SectionContent, SectionContentType } from '../../../../models/section-content/section-content';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';

export interface ModuleWithState {
    module: Module;
    progressState: 'not-started' | 'in-progress' | 'completed' | 'blocked';
    targetLessonId: string | null;
    progressPercentage: number;
}

@Component({
    selector: 'app-module',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownModule],
    templateUrl: './module.html',
    styleUrls: ['./module.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulePage implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private moduleService = inject(ModuleService);
    private userModuleService = inject(UserModuleService);
    private lessonService = inject(LessonService);
    private userLessonService = inject(UserLessonService);
    private courseService = inject(CourseService);
    private trackService = inject(TrackService);
    private achievementsService = inject(AchievementsService);
    protected readonly userService = inject(UserService);
    private sectionContentService = inject(SectionContentService);
    private sanitizer = inject(DomSanitizer);

    course = signal<Course | null>(null);
    tracks = signal<TrackSummary[]>([]);
    modulesWithState = signal<ModuleWithState[]>([]);
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
                 this.error.set('Curso não encontrado.');
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
                modules,
                userModules,
                userLessons,
                course,
                allCourseLessons
            ] = await Promise.all([
                this.moduleService.getModulesByCourseSlug(slug),
                this.userModuleService.getUserModulesForUser(userId),
                this.userLessonService.getUserLessonsForUser(userId).catch(() => []),
                this.courseService.getCourseBySlug(slug),
                this.lessonService.getLessonsByCourseSlug(slug).catch(() => [])
            ]);

            if (course) {
                this.course.set(course);
            } else {
                this.error.set('Curso não encontrado.');
                this.isLoading.set(false);
                return;
            }

            // Group 2: Fetch resources dependent on course ID
            const [achievement, presentation, tracks] = await Promise.all([
                this.achievementsService.getAchievementByCourseId(course.id).catch(() => null),
                this.sectionContentService.getSectionContentsByCourseId(course.id).catch(() => []),
                this.trackService.getTracksForCourse(course.id).catch(() => [])
            ]);

            this.achievement.set(achievement);
            this.tracks.set(tracks);
            this.presentationContents.set(presentation);

            const completedLessonIds = new Set<string>(
                userLessons.filter((ul: any) => ul.completed).map((ul: any) => ul.lesson?.id || ul.lesson_id)
            );

            // Group batch-fetched lessons by moduleId
            const lessonsByModuleMap = new Map<string, any[]>();
            for (const lesson of allCourseLessons) {
                const lessonsList = lessonsByModuleMap.get(lesson.moduleId) || [];
                lessonsList.push(lesson);
                lessonsByModuleMap.set(lesson.moduleId, lessonsList);
            }

            const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

            let previousCompleted = true;
            const withState: ModuleWithState[] = [];

            for (const sm of sortedModules) {
                // @ts-ignore - DB returns sub_module_id as well
                const usm = userModules.find(u => u.module?.id === sm.id || u.sub_module_id === sm.id);
                let state: 'not-started' | 'in-progress' | 'completed' | 'blocked' = 'not-started';

                if (usm) {
                    state = usm.completed ? 'completed' : 'in-progress';
                } else if (!previousCompleted) {
                    state = 'blocked';
                }

                previousCompleted = state === 'completed';

                let targetLessonId: string | null = null;
                let progressPercentage = 0;

                if (state === 'completed') {
                    progressPercentage = 100;
                }

                const lessons = lessonsByModuleMap.get(sm.id) || [];
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
                    module: sm,
                    progressState: state,
                    targetLessonId,
                    progressPercentage
                });
            }

            this.modulesWithState.set(withState);
            this.error.set(null);
        } catch (err: any) {
            this.error.set(err.message || 'Erro ao carregar os módulos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async onStartModule(moduleId: string, slug: string): Promise<void> {
        try {
            await this.userModuleService.startModule(moduleId);
            await this.router.navigate(['m', slug], { relativeTo: this.route });
        } catch (err) {
            console.error('Erro ao iniciar módulo:', err);
        }
    }
}
