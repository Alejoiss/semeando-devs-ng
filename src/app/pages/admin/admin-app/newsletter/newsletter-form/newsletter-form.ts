import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs/operators';
import { NewNewsletterInput, NewsletterSendProgress } from '../../../../../../models/newsletter/newsletter';
import { AdminNewsletterService } from '../../../../../services/admin-newsletter';
import { NewsletterPreview } from '../newsletter-preview';
import { NewsletterSendProgressBar } from '../newsletter-send-progress';

const TEST_EMAIL = 'joissonjdm@gmail.com';
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

@Component({
    selector: 'app-admin-newsletter-form',
    imports: [ReactiveFormsModule, RouterLink, NewsletterPreview, NewsletterSendProgressBar],
    styles: `
        dialog::backdrop {
            background: rgb(0 0 0 / 0.6);
            backdrop-filter: blur(4px);
        }
    `,
    templateUrl: './newsletter-form.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNewsletterForm {
    private readonly newsletterService = inject(AdminNewsletterService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    readonly form = new FormGroup({
        subject: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        body: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        html: new FormControl('', { nonNullable: true }),
        ctaLabel: new FormControl('', { nonNullable: true }),
        ctaUrl: new FormControl('', { nonNullable: true, validators: [Validators.pattern(HTTP_URL_PATTERN)] }),
    });

    readonly isSaving = signal(false);
    readonly saveError = signal<string | null>(null);
    readonly saveStep = signal<'confirm' | 'sending' | 'done'>('confirm');
    readonly sendProgress = signal<NewsletterSendProgress | null>(null);
    readonly isSendingTest = signal(false);
    readonly testResult = signal<{ ok: boolean; message: string } | null>(null);
    readonly duplicateError = signal<string | null>(null);

    protected readonly value = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
        initialValue: this.form.getRawValue(),
    });

    private readonly saveDialog = viewChild<ElementRef<HTMLDialogElement>>('saveDialog');

    constructor() {
        const sourceId = this.route.snapshot.queryParamMap.get('duplicar');
        if (sourceId) {
            void this.loadSource(sourceId);
        }
    }

    protected showError(name: 'subject' | 'body' | 'ctaUrl'): boolean {
        const control = this.form.controls[name];
        return control.touched && control.invalid;
    }

    protected openSaveDialog() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.saveError.set(null);
        this.saveStep.set('confirm');
        this.sendProgress.set(null);
        this.saveDialog()?.nativeElement.showModal();
    }

    protected closeSaveDialog() {
        this.saveDialog()?.nativeElement.close();
    }

    protected onSaveDialogCancel(event: Event) {
        if (this.saveStep() === 'sending') {
            event.preventDefault();
        }
    }

    protected async sendTest() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSendingTest.set(true);
        this.testResult.set(null);
        try {
            await this.newsletterService.sendTest(this.buildInput(), TEST_EMAIL);
            this.testResult.set({ ok: true, message: `Teste enviado para ${TEST_EMAIL}.` });
        } catch (err: any) {
            this.testResult.set({ ok: false, message: err.message || 'Não foi possível enviar o teste.' });
        } finally {
            this.isSendingTest.set(false);
        }
    }

    protected async save(sendAfterSaving: boolean) {
        this.isSaving.set(true);
        this.saveError.set(null);

        let newsletterId: string;
        try {
            newsletterId = await this.newsletterService.createNewsletter(this.buildInput());
        } catch (err: any) {
            this.saveError.set(err.message || 'Não foi possível salvar a newsletter.');
            this.isSaving.set(false);
            return;
        }

        if (!sendAfterSaving) {
            this.isSaving.set(false);
            await this.finish();
            return;
        }

        this.saveStep.set('sending');
        try {
            const result = await this.newsletterService.sendToPending(newsletterId, progress =>
                this.sendProgress.set(progress),
            );
            this.sendProgress.set(result);
            if (result.remaining === 0 && result.failed === 0) {
                await this.finish();
                return;
            }
        } catch (err: any) {
            this.saveError.set(`A newsletter foi salva, mas o envio falhou: ${err.message || 'erro desconhecido'}`);
        } finally {
            this.isSaving.set(false);
        }
        this.saveStep.set('done');
    }

    protected async finish() {
        this.closeSaveDialog();
        await this.router.navigate(['/admin/envio-de-newsletter']);
    }

    private buildInput(): NewNewsletterInput {
        const value = this.form.getRawValue();
        return {
            subject: value.subject.trim(),
            body: value.body,
            html: value.html.trim() || null,
            ctaLabel: value.ctaLabel.trim() || null,
            ctaUrl: value.ctaUrl.trim() || null,
        };
    }

    private async loadSource(id: string) {
        try {
            const source = await this.newsletterService.getNewsletter(id);
            if (!source) {
                this.duplicateError.set('A newsletter a ser duplicada não foi encontrada.');
                return;
            }
            this.form.patchValue({
                subject: source.subject ?? '',
                body: source.body,
                html: source.html ?? '',
                ctaLabel: source.cta_label ?? '',
                ctaUrl: source.cta_url ?? '',
            });
        } catch (err: any) {
            this.duplicateError.set(err.message || 'Não foi possível carregar a newsletter a ser duplicada.');
        }
    }
}
