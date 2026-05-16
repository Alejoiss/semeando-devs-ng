import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TabContent } from './tab-content/tab-content';
import { TabExtraMaterial } from './tab-extra-material/tab-extra-material';
import { TabQuiz } from './tab-quiz/tab-quiz';

export type LessonTab = 'content' | 'extra' | 'quiz';

@Component({
    selector: 'app-create-lesson',
    standalone: true,
    imports: [TabContent, TabExtraMaterial, TabQuiz],
    templateUrl: './create-lesson.html',
    styleUrl: './create-lesson.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLesson {
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    activeTab = signal<LessonTab>('content');

    subModuleId = signal<string | null>(null);
    lessonId = signal<string | null>(null);

    constructor() {
        this.lessonId.set(this.route.snapshot.paramMap.get('id'));
        this.subModuleId.set(this.route.snapshot.paramMap.get('idSubModule'));
    }

    setTab(tab: LessonTab) {
        this.activeTab.set(tab);
    }

    goBack() {
        const sId = this.subModuleId();
        if (sId) {
            this.router.navigate(['/professor/editar-submodulo', sId]);
        } else {
            window.history.back();
        }
    }
}
