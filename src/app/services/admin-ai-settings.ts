import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    AI_FEATURES,
    AiFeature,
    AiModelCheckResult,
    AiModelResult,
    AiModels,
    AiSettings,
} from '../../models/ai-settings/ai-settings';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class AdminAiSettingsService {
    private readonly supabase: SupabaseClient = inject(SupabaseService).client;

    async getSettings(): Promise<AiSettings> {
        const [modelsResult, alertResult] = await Promise.all([
            this.supabase.from('ai_model_settings').select('feature, models'),
            this.supabase.from('ai_alert_settings').select('emails').maybeSingle(),
        ]);
        if (modelsResult.error) {
            throw new Error(modelsResult.error.message);
        }
        if (alertResult.error) {
            throw new Error(alertResult.error.message);
        }

        const models = Object.fromEntries(AI_FEATURES.map(({ feature }) => [feature, [] as string[]])) as AiModels;
        for (const row of (modelsResult.data ?? []) as { feature: AiFeature; models: string[] }[]) {
            if (row.feature in models) {
                models[row.feature] = row.models ?? [];
            }
        }

        return { models, emails: (alertResult.data?.emails as string[] | undefined) ?? [] };
    }

    async saveSettings(settings: AiSettings): Promise<void> {
        const updatedAt = new Date().toISOString();

        const { error: modelsError } = await this.supabase.from('ai_model_settings').upsert(
            AI_FEATURES.map(({ feature }) => ({ feature, models: settings.models[feature], updated_at: updatedAt })),
            { onConflict: 'feature' },
        );
        if (modelsError) {
            throw new Error(modelsError.message);
        }

        const { error: alertError } = await this.supabase
            .from('ai_alert_settings')
            .upsert({ id: true, emails: settings.emails, updated_at: updatedAt }, { onConflict: 'id' });
        if (alertError) {
            throw new Error(alertError.message);
        }
    }

    /** Runs the same health check as the daily job, without sending the alert email. */
    async checkModels(): Promise<AiModelCheckResult> {
        return this.invokeCheck<AiModelCheckResult>({ notify: false });
    }

    /** Tests one model (saved or not) against the OpenRouter catalog and with a minimal call. */
    async testModel(model: string): Promise<AiModelResult> {
        const { check } = await this.invokeCheck<{ check: AiModelResult }>({ model });
        return check;
    }

    private async invokeCheck<T>(body: Record<string, unknown>): Promise<T> {
        const { data, error } = await this.supabase.functions.invoke('check-ai-models', { body });
        if (error) {
            let message = error.message;
            try {
                const payload = await (error as { context?: Response }).context?.json();
                message = payload?.error ?? message;
            } catch {
                // keep the generic message when the response has no JSON body
            }
            throw new Error(message);
        }
        return data as T;
    }
}
