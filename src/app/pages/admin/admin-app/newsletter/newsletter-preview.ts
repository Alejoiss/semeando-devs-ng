import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const SAMPLE_NAME = 'Maria';

export interface NewsletterPreviewSource {
    body: string;
    html?: string | null;
    ctaUrl?: string | null;
    ctaLabel?: string | null;
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Keep in sync with buildDefaultHtml in supabase/functions/dispatch-newsletter/index.ts
export function buildDefaultNewsletterHtml(source: NewsletterPreviewSource): string {
    const cta = source.ctaUrl
        ? `
            <div style="margin-top: 24px; margin-bottom: 24px;">
                <a href="${escapeHtml(source.ctaUrl)}" style="background: linear-gradient(135deg, #3fc2fb, #27b4ed); color: #060e20; padding: 12px 24px; border-radius: 16px; text-decoration: none; font-weight: bold; display: inline-block;">
                    ${escapeHtml(source.ctaLabel || 'Acesse')}
                </a>
            </div>`
        : '';

    return `
        <div style="font-family: sans-serif; background-color: #060e20; color: #dee5ff; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3fc2fb; margin-top: 0;">Informativo Semeando Devs</h2>
            <div style="margin-bottom: 24px; line-height: 1.6;">
                ${source.body.replace(/\n/g, '<br>')}
            </div>${cta}
            <p style="font-size: 12px; color: #fe69ac; margin-top: 24px;">Semeando Devs: Transformando o aprendizado de tecnologia em uma jornada de alto impacto.</p>
        </div>
    `;
}

export function buildNewsletterPreviewHtml(source: NewsletterPreviewSource): string {
    const template = source.html?.trim() ? source.html : buildDefaultNewsletterHtml(source);
    return template.replaceAll('{{nome_virgula}}', `, ${escapeHtml(SAMPLE_NAME)}`);
}

@Component({
    selector: 'app-newsletter-preview',
    template: `
        <iframe
            [srcdoc]="srcdoc()"
            sandbox=""
            title="Pré-visualização do e-mail"
            class="w-full h-[640px] rounded-2xl bg-white"></iframe>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterPreview {
    private readonly sanitizer = inject(DomSanitizer);

    readonly source = input.required<NewsletterPreviewSource>();

    // The iframe is sandboxed without scripts, so the admin-authored HTML cannot execute code.
    protected readonly srcdoc = computed(() =>
        this.sanitizer.bypassSecurityTrustHtml(buildNewsletterPreviewHtml(this.source())),
    );
}
