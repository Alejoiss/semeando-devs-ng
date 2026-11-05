import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { map } from 'rxjs/operators';
import { Header } from '../../../components/header/header';
import { Footer } from '../../../components/footer/footer';
import { AdBannerComponent } from '../../../components/ad-banner/ad-banner';
import { PublicLessonPage, PublicSection } from '../../../services/public-catalog/public-catalog';
import { SeoService } from '../../../services/seo/seo';
import { UserService } from '../../../services/user';

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
    private readonly userService = inject(UserService);

    protected readonly isLoggedIn = computed(() => !!this.userService.currentUser());

    protected readonly page = toSignal(this.route.data.pipe(map(data => data['lesson'] as PublicLessonPage)), {
        initialValue: this.route.snapshot.data['lesson'] as PublicLessonPage,
    });

    protected readonly isFull = computed(() => this.page().content.kind === 'full');

    // O markdown das aulas costuma abrir com "# Título", que já é o <h1> da página
    protected readonly sections = computed<PublicSection[]>(() => {
        const content = this.page().content;
        if (content.kind !== 'full') {
            return [];
        }
        return content.sections.map((section, index) =>
            index === 0 && section.type === 'MARKDOWN' && section.content
                ? { ...section, content: section.content.replace(/^\s*#\s[^\n]*\n?/, '') }
                : section
        );
    });

    protected readonly previewMarkdown = computed(() => {
        const content = this.page().content;
        return content.kind === 'preview' ? content.markdown : '';
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

    protected trustedEmbed(html: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
