import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { Header } from '../../../components/header/header';
import { Footer } from '../../../components/footer/footer';
import { PublicModule as PublicModuleData, publicLessonPath } from '../../../services/public-catalog/public-catalog';
import { SeoService } from '../../../services/seo/seo';

@Component({
    selector: 'app-public-module',
    imports: [RouterLink, Header, Footer],
    templateUrl: './public-module.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicModule {
    private readonly route = inject(ActivatedRoute);
    private readonly seo = inject(SeoService);

    protected readonly module = toSignal(this.route.data.pipe(map(data => data['module'] as PublicModuleData)), {
        initialValue: this.route.snapshot.data['module'] as PublicModuleData,
    });

    protected readonly lessonCount = computed(() =>
        this.module().submodules.reduce((total, sub) => total + sub.lessons.length, 0)
    );

    protected readonly lessonPath = publicLessonPath;

    constructor() {
        effect(() => {
            const module = this.module();
            this.seo.update({
                title: `Curso de ${module.title} grátis - Semeando Devs`,
                description: module.description ||
                    `Aprenda ${module.title} do zero com ${this.lessonCount()} aulas gratuitas em português.`,
            });
        });
    }
}
