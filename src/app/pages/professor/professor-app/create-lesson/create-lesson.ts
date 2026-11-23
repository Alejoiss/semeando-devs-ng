import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LessonService } from '../../../../services/lesson';
import { LessonType } from '../../../../../models/lesson/lesson';
import { TabContent } from './tab-content/tab-content';
import { TabExtraMaterial } from './tab-extra-material/tab-extra-material';
import { TabQuiz } from './tab-quiz/tab-quiz';
import { TabCode } from './tab-code/tab-code';

export type LessonTab = 'content' | 'extra' | 'quiz' | 'code';

@Component({
    selector: 'app-create-lesson',
    standalone: true,
    imports: [TabContent, TabExtraMaterial, TabQuiz, TabCode],
    templateUrl: './create-lesson.html',
    styleUrl: './create-lesson.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLesson {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private lessonService = inject(LessonService);

    protected readonly LessonType = LessonType;

    activeTab = signal<LessonTab>('content');

    moduleId = signal<string | null>(null);
    lessonId = signal<string | null>(null);
    lessonType = signal<LessonType>(LessonType.LESSON);

    constructor() {
        this.lessonId.set(this.route.snapshot.paramMap.get('id'));
        this.moduleId.set(this.route.snapshot.paramMap.get('idModule'));
        
        const typeParam = this.route.snapshot.queryParamMap.get('type');
        if (typeParam === 'CHALLENGE') {
            this.lessonType.set(LessonType.CHALLENGE);
        }
        
        this.checkLessonType();
    }

    private async checkLessonType() {
        const id = this.lessonId();
        if (id) {
            try {
                const lesson = await this.lessonService.getLessonById(id);
                if (lesson) {
                    this.lessonType.set(lesson.type);
                    if (lesson.type === LessonType.REVISION) {
                        const moduleId = lesson.moduleId || this.moduleId();
                        if (moduleId) {
                            this.router.navigate(['/professor/editar-modulo', moduleId], { replaceUrl: true });
                        } else {
                            this.router.navigate(['/professor/meus-cursos'], { replaceUrl: true });
                        }
                    }
                }
            } catch (err) {
                console.error('Erro ao verificar tipo da lição', err);
            }
        }
    }

    setTab(tab: LessonTab) {
        this.activeTab.set(tab);
    }

    goBack() {
        const sId = this.moduleId();
        if (sId) {
            this.router.navigate(['/professor/editar-modulo', sId]);
        } else {
            window.history.back();
        }
    }
}
