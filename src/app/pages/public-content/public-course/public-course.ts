import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { Header } from '../../../components/header/header';
import { Footer } from '../../../components/footer/footer';
import { PublicCourse as PublicCourseData, publicLessonPath } from '../../../services/public-catalog/public-catalog';
import { SeoService } from '../../../services/seo/seo';

@Component({
    selector: 'app-public-course',
    imports: [RouterLink, Header, Footer],
    templateUrl: './public-course.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicCourse {
    private readonly route = inject(ActivatedRoute);
    private readonly seo = inject(SeoService);

    protected readonly course = toSignal(this.route.data.pipe(map(data => data['course'] as PublicCourseData)), {
        initialValue: this.route.snapshot.data['course'] as PublicCourseData,
    });

    protected readonly lessonCount = computed(() =>
        this.course().modules.reduce((total, sub) => total + sub.lessons.length, 0)
    );

    protected readonly lessonPath = publicLessonPath;

    constructor() {
        effect(() => {
            const course = this.course();
            this.seo.update({
                title: `Curso de ${course.title} - Semeando Devs`,
                description: course.description ||
                    `Conheça o currículo do curso de ${course.title}: ${this.lessonCount()} aulas com quizzes e desafios práticos.`,
            });
        });
    }
}
