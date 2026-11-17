import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NewsletterSendProgress } from '../../../../../models/newsletter/newsletter';

@Component({
    selector: 'app-newsletter-send-progress',
    template: `
        <div class="flex flex-col gap-3" aria-live="polite">
            <div
                class="h-3 rounded-full bg-[#060e20] overflow-hidden"
                role="progressbar"
                aria-label="Progresso do envio"
                aria-valuemin="0"
                [attr.aria-valuemax]="progress()?.total ?? 0"
                [attr.aria-valuenow]="progress()?.sent ?? 0">
                <div class="h-full bg-[#3fc2fb] transition-all" [style.width.%]="percent()"></div>
            </div>
            <p class="font-label text-sm text-[#dee5ff]/80">
                @if (progress(); as p) {
                    {{ p.sent }} de {{ p.total }} enviados
                    @if (p.failed > 0) { · {{ p.failed }} com falha }
                } @else {
                    Iniciando envio...
                }
            </p>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterSendProgressBar {
    readonly progress = input<NewsletterSendProgress | null>(null);

    protected readonly percent = computed(() => {
        const p = this.progress();
        return p && p.total > 0 ? Math.round((p.sent / p.total) * 100) : 0;
    });
}
