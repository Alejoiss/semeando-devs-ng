import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { Newsletter, NewsletterSendProgress } from '../../../../../models/newsletter/newsletter';
import { AdminNewsletterService } from '../../../../services/admin-newsletter';
import { NewsletterSendProgressBar } from './newsletter-send-progress';

@Component({
    selector: 'app-admin-newsletter',
    imports: [DatePipe, RouterLink, ReactiveFormsModule, NewsletterSendProgressBar],
    styleUrl: './newsletter.scss',
    templateUrl: './newsletter.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNewsletter {
    private readonly newsletterService = inject(AdminNewsletterService);
    private readonly router = inject(Router);

    protected readonly pageSize = 20;

    readonly searchQuery = signal('');
    readonly sortDir = signal<'asc' | 'desc'>('desc');
    readonly currentPage = signal(0);

    readonly newsletters = signal<Newsletter[]>([]);
    readonly totalCount = signal(0);
    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);

    readonly searchControl = new FormControl('', { nonNullable: true });

    readonly resending = signal<Newsletter | null>(null);
    readonly resendStep = signal<'confirm' | 'sending' | 'done'>('confirm');
    readonly resendProgress = signal<NewsletterSendProgress | null>(null);
    readonly resendError = signal<string | null>(null);

    private readonly resendDialog = viewChild<ElementRef<HTMLDialogElement>>('resendDialog');
    private lastTrigger: HTMLElement | null = null;
    private requestId = 0;

    constructor() {
        this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(value => {
            this.searchQuery.set(value);
            this.currentPage.set(0);
        });

        effect(() => {
            this.searchQuery();
            this.sortDir();
            this.currentPage();
            untracked(() => this.loadNewsletters());
        });
    }

    protected toggleSort() {
        this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
        this.currentPage.set(0);
    }

    protected open(newsletter: Newsletter) {
        this.router.navigate(['/admin/envio-de-newsletter', newsletter.id]);
    }

    protected openResend(newsletter: Newsletter, event: Event) {
        this.lastTrigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
        this.resending.set(newsletter);
        this.resendStep.set('confirm');
        this.resendProgress.set(null);
        this.resendError.set(null);
        this.resendDialog()?.nativeElement.showModal();
    }

    protected closeResend() {
        this.resendDialog()?.nativeElement.close();
    }

    protected onResendCancel(event: Event) {
        if (this.resendStep() === 'sending') {
            event.preventDefault();
        }
    }

    protected onResendClosed() {
        this.resending.set(null);
        this.lastTrigger?.focus();
    }

    protected async confirmResend() {
        const newsletter = this.resending();
        if (!newsletter) {
            return;
        }

        this.resendStep.set('sending');
        this.resendError.set(null);
        try {
            const result = await this.newsletterService.sendToPending(newsletter.id, progress =>
                this.resendProgress.set(progress),
            );
            this.resendProgress.set(result);
        } catch (err: any) {
            this.resendError.set(err.message || 'Não foi possível enviar a newsletter.');
        } finally {
            this.resendStep.set('done');
        }
    }

    async loadNewsletters() {
        const requestId = ++this.requestId;
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const result = await this.newsletterService.getNewsletters({
                search: this.searchQuery(),
                sortDir: this.sortDir(),
                page: this.currentPage(),
                pageSize: this.pageSize,
            });
            if (requestId !== this.requestId) {
                return;
            }
            this.newsletters.set(result.newsletters);
            this.totalCount.set(result.total);
        } catch (err: any) {
            if (requestId !== this.requestId) {
                return;
            }
            this.error.set(err.message || 'Não foi possível carregar as newsletters. Tente novamente.');
            this.newsletters.set([]);
            this.totalCount.set(0);
        } finally {
            if (requestId === this.requestId) {
                this.isLoading.set(false);
            }
        }
    }
}
