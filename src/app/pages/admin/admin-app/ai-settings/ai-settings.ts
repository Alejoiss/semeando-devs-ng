import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
    AI_FEATURES,
    AiFeature,
    AiModelCheck,
    AiModels,
} from '../../../../../models/ai-settings/ai-settings';
import { AdminAiSettingsService } from '../../../../services/admin-ai-settings';

const MAX_MODELS = 5;
const MODEL_PATTERN = /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:-]*$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

const STATUS_LABELS: Record<AiModelCheck['status'], string> = {
    ok: 'Funcionando',
    expiring: 'Retirada agendada',
    removed: 'Removido do OpenRouter',
    failing: 'Falhando',
};

@Component({
    selector: 'app-admin-ai-settings',
    imports: [ReactiveFormsModule],
    templateUrl: './ai-settings.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAiSettings implements OnInit {
    private readonly service = inject(AdminAiSettingsService);

    protected readonly features = AI_FEATURES;
    protected readonly maxModels = MAX_MODELS;

    readonly models = signal<AiModels>({ evaluate_challenge: [], evaluate_lesson_content: [] });
    readonly emails = signal<string[]>([]);
    readonly isLoading = signal(true);
    readonly loadError = signal<string | null>(null);

    readonly canSave = computed(
        () => !this.loadError() && this.features.every(({ feature }) => this.models()[feature].length > 0),
    );

    readonly isSaving = signal(false);
    readonly saveResult = signal<{ ok: boolean; message: string } | null>(null);

    readonly isChecking = signal(false);
    readonly checks = signal<AiModelCheck[] | null>(null);
    readonly checkError = signal<string | null>(null);
    readonly catalogAvailable = signal(true);

    readonly modelControls: Record<AiFeature, FormControl<string>> = {
        evaluate_challenge: new FormControl('', { nonNullable: true }),
        evaluate_lesson_content: new FormControl('', { nonNullable: true }),
    };
    readonly modelErrors = signal<Record<AiFeature, string | null>>({ evaluate_challenge: null, evaluate_lesson_content: null });
    readonly emailControl = new FormControl('', { nonNullable: true });
    readonly emailError = signal<string | null>(null);

    ngOnInit() {
        void this.load();
    }

    protected addModel(feature: AiFeature) {
        const control = this.modelControls[feature];
        const value = control.value.trim();
        const current = this.models()[feature];

        let error: string | null = null;
        if (!MODEL_PATTERN.test(value)) {
            error = 'Informe o identificador no formato provedor/modelo, como openai/gpt-5-nano.';
        } else if (current.some(model => model.toLowerCase() === value.toLowerCase())) {
            error = 'Este modelo já está na lista.';
        } else if (current.length >= MAX_MODELS) {
            error = `Use no máximo ${MAX_MODELS} modelos por funcionalidade.`;
        }

        this.modelErrors.update(errors => ({ ...errors, [feature]: error }));
        if (error) {
            return;
        }
        this.models.update(models => ({ ...models, [feature]: [...current, value] }));
        control.reset('');
    }

    protected removeModel(feature: AiFeature, index: number) {
        this.models.update(models => ({ ...models, [feature]: models[feature].filter((_, i) => i !== index) }));
    }

    protected moveModel(feature: AiFeature, index: number, delta: -1 | 1) {
        const target = index + delta;
        const list = [...this.models()[feature]];
        if (target < 0 || target >= list.length) {
            return;
        }
        [list[index], list[target]] = [list[target], list[index]];
        this.models.update(models => ({ ...models, [feature]: list }));
    }

    protected addEmail() {
        const value = this.emailControl.value.trim().toLowerCase();
        let error: string | null = null;
        if (!EMAIL_PATTERN.test(value)) {
            error = 'Informe um e-mail válido.';
        } else if (this.emails().includes(value)) {
            error = 'Este e-mail já está na lista.';
        }

        this.emailError.set(error);
        if (error) {
            return;
        }
        this.emails.update(emails => [...emails, value]);
        this.emailControl.reset('');
    }

    protected removeEmail(index: number) {
        this.emails.update(emails => emails.filter((_, i) => i !== index));
    }

    protected async save() {
        this.isSaving.set(true);
        this.saveResult.set(null);
        try {
            await this.service.saveSettings({ models: this.models(), emails: this.emails() });
            this.saveResult.set({ ok: true, message: 'Configurações salvas.' });
        } catch (err) {
            this.saveResult.set({ ok: false, message: errorMessage(err, 'Não foi possível salvar as configurações.') });
        } finally {
            this.isSaving.set(false);
        }
    }

    protected async runCheck() {
        this.isChecking.set(true);
        this.checkError.set(null);
        try {
            const result = await this.service.checkModels();
            this.checks.set(result.checks);
            this.catalogAvailable.set(result.catalogAvailable);
        } catch (err) {
            this.checks.set(null);
            this.checkError.set(errorMessage(err, 'Não foi possível verificar os modelos.'));
        } finally {
            this.isChecking.set(false);
        }
    }

    protected checkFor(feature: AiFeature, model: string): AiModelCheck | undefined {
        return this.checks()?.find(check => check.feature === feature && check.model === model);
    }

    protected statusLabel(check: AiModelCheck): string {
        const label = STATUS_LABELS[check.status];
        return check.status === 'expiring' && check.expiresAt ? `${label}: ${this.formatDate(check.expiresAt)}` : label;
    }

    protected statusIcon(status: AiModelCheck['status']): string {
        return status === 'ok' ? 'check_circle' : status === 'expiring' ? 'schedule' : 'error';
    }

    protected statusClass(status: AiModelCheck['status']): string {
        return status === 'ok'
            ? 'bg-emerald-400/15 text-emerald-300'
            : status === 'expiring'
              ? 'bg-amber-400/15 text-amber-300'
              : 'bg-error/10 text-error';
    }

    /** Formats a `YYYY-MM-DD` date without going through Date, so the machine timezone cannot shift the day. */
    private formatDate(isoDate: string): string {
        const [year, month, day] = isoDate.slice(0, 10).split('-');
        return `${day}/${month}/${year}`;
    }

    private async load() {
        this.isLoading.set(true);
        this.loadError.set(null);
        try {
            const settings = await this.service.getSettings();
            this.models.set(settings.models);
            this.emails.set(settings.emails);
        } catch (err) {
            this.loadError.set(errorMessage(err, 'Não foi possível carregar as configurações.'));
        } finally {
            this.isLoading.set(false);
        }
    }
}
