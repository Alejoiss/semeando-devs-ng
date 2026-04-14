import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubModuleService } from '../../../services/sub-module';
import { UserSubModuleService } from '../../../services/user-sub-module';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { SubModule } from '../../../../models/sub-module/sub-module';

export interface SubmoduleWithState {
    submodule: SubModule;
    progressState: 'not-started' | 'in-progress' | 'completed';
    targetLessonId: string | null;
}

@Component({
    selector: 'app-submodule',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './submodule.html',
    styleUrls: ['./submodule.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Submodule implements OnInit {
    private route = inject(ActivatedRoute);
    private submoduleService = inject(SubModuleService);
    private userSubmoduleService = inject(UserSubModuleService);
    private lessonService = inject(LessonService);
    private userLessonService = inject(UserLessonService);

    submodulesWithState = signal<SubmoduleWithState[]>([]);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

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

            const submodules = await this.submoduleService.getSubModulesByModuleSlug(slug);
            const userSubmodules = await this.userSubmoduleService.getUserSubModules();

            let userLessons: any[] = [];
            try {
                userLessons = await this.userLessonService.getUserLessons();
            } catch {
                // user might not have any lessons yet
            }
            const completedLessonIds = new Set(
                userLessons.filter(ul => ul.completed).map(ul => ul.lesson?.id)
            );

            const withState: SubmoduleWithState[] = await Promise.all(
                submodules.map(async sm => {
                    // @ts-ignore - DB returns sub_module_id as well
                    const usm = userSubmodules.find(u => u.subModule?.id === sm.id || u.sub_module_id === sm.id);
                    let state: 'not-started' | 'in-progress' | 'completed' = 'not-started';

                    if (usm) {
                        state = usm.completed ? 'completed' : 'in-progress';
                    }

                    let targetLessonId: string | null = null;
                    try {
                        const lessons = await this.lessonService.getLessonsBySubModuleSlug(sm.slug);
                        if (lessons.length > 0) {
                            if (state === 'in-progress') {
                                const firstIncomplete = lessons.find(l => !completedLessonIds.has(l.id));
                                targetLessonId = firstIncomplete?.id ?? lessons[0].id;
                            } else {
                                targetLessonId = lessons[0].id;
                            }
                        }
                    } catch {
                        // fallback: no target lesson
                    }

                    return {
                        submodule: sm,
                        progressState: state,
                        targetLessonId
                    };
                })
            );

            this.submodulesWithState.set(withState);
            this.error.set(null);
        } catch (err: any) {
            this.error.set(err.message || 'Erro ao carregar os submódulos.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
