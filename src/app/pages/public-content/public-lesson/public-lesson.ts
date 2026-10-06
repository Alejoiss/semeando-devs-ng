import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { map } from 'rxjs/operators';
import { Header } from '../../../components/header/header';
import { Footer } from '../../../components/footer/footer';
import { AdBannerComponent } from '../../../components/ad-banner/ad-banner';
import { PublicLessonPage } from '../../../services/public-catalog/public-catalog';
import { SeoService } from '../../../services/seo/seo';

@Component({
    selector: 'app-public-lesson',
    imports: [RouterLink, MarkdownModule, Header, Footer, AdBannerComponent],
    templateUrl: './public-lesson.html',
    styleUrl: './public-lesson.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLesson {
    private readonly route = inject(ActivatedRoute);
    private readonly seo = inject(SeoService);
    private readonly sanitizer = inject(DomSanitizer);

    protected readonly page = toSignal(this.route.data.pipe(map(data => data['lesson'] as PublicLessonPage)), {
        initialValue: this.route.snapshot.data['lesson'] as PublicLessonPage,
    });

    // O markdown das aulas costuma abrir com "# Título", que já é o <h1> da página
    protected readonly sections = computed(() =>
        this.page().sections.map((section, index) =>
            index === 0 && section.type === 'MARKDOWN' && section.content
                ? { ...section, content: section.content.replace(/^\s*#\s[^\n]*\n?/, '') }
                : section
        )
    );

    protected readonly practicePath = computed(() => {
        const page = this.page();
        return ['/app/s', page.module.slug, 'ss', page.submodule.slug, 'lesson', page.lesson.id];
    });

    constructor() {
        effect(() => {
            const { lesson, module } = this.page();
            this.seo.update({
                title: `${lesson.title} | ${module.title} - Semeando Devs`,
                description: lesson.description || `Aula gratuita de ${module.title}: ${lesson.title}.`,
            });
        });
    }

    protected trustedEmbed(html: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
