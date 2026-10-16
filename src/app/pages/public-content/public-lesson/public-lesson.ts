import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { map } from 'rxjs/operators';
import { Header } from '../../../components/header/header';
import { Footer } from '../../../components/footer/footer';
import { PublicLessonPage } from '../../../services/public-catalog/public-catalog';
import { SeoService } from '../../../services/seo/seo';
import { UserService } from '../../../services/user';

@Component({
    selector: 'app-public-lesson',
    imports: [RouterLink, MarkdownModule, Header, Footer],
    templateUrl: './public-lesson.html',
    styleUrl: './public-lesson.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLesson {
    private readonly route = inject(ActivatedRoute);
    private readonly seo = inject(SeoService);
    private readonly userService = inject(UserService);

    protected readonly isLoggedIn = computed(() => !!this.userService.currentUser());

    protected readonly page = toSignal(this.route.data.pipe(map(data => data['lesson'] as PublicLessonPage)), {
        initialValue: this.route.snapshot.data['lesson'] as PublicLessonPage,
    });

    constructor() {
        effect(() => {
            const { lesson, module } = this.page();
            this.seo.update({
                title: `${lesson.title} | ${module.title} - Semeando Devs`,
                description: lesson.description || `Aula de ${module.title}: ${lesson.title}.`,
            });
        });
    }
}
