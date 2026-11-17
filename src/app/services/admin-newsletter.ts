import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    NewNewsletterInput,
    Newsletter,
    NewsletterListResult,
    NewsletterQueryParams,
    NewsletterSendProgress,
} from '../../models/newsletter/newsletter';
import { SupabaseService } from './supabase';

const SEND_BATCH_SIZE = 100;

interface DispatchResponse {
    sent_count: number;
    failed_count: number;
    remaining: number;
}

@Injectable({
    providedIn: 'root',
})
export class AdminNewsletterService {
    private readonly supabase: SupabaseClient = inject(SupabaseService).client;

    async getNewsletters(params: NewsletterQueryParams): Promise<NewsletterListResult> {
        const { search, sortDir, page, pageSize } = params;
        const from = page * pageSize;

        let query = this.supabase
            .from('newsletter')
            .select('id, subject, created_at', { count: 'exact' })
            .order('created_at', { ascending: sortDir === 'asc' })
            .order('id', { ascending: true })
            .range(from, from + pageSize - 1);

        const term = search.trim().replace(/[%_,()\\]/g, '');
        if (term) {
            query = query.ilike('subject', `%${term}%`);
        }

        const { data, error, count } = await query;
        if (error) {
            throw new Error(error.message);
        }

        return { newsletters: (data ?? []) as Newsletter[], total: count ?? 0 };
    }

    async getNewsletter(id: string): Promise<Newsletter | null> {
        const { data, error } = await this.supabase.from('newsletter').select('*').eq('id', id).maybeSingle();
        if (error) {
            throw new Error(error.message);
        }
        return data as Newsletter | null;
    }

    async createNewsletter(input: NewNewsletterInput): Promise<string> {
        const { data, error } = await this.supabase
            .from('newsletter')
            .insert({
                subject: input.subject,
                body: input.body,
                html: input.html,
                cta_label: input.ctaLabel,
                cta_url: input.ctaUrl,
            })
            .select('id')
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data.id as string;
    }

    async sendTest(input: NewNewsletterInput, email: string): Promise<void> {
        await this.invokeDispatch({
            test_email: email,
            draft: {
                subject: input.subject,
                body: input.body,
                html: input.html,
                cta_label: input.ctaLabel,
                cta_url: input.ctaUrl,
            },
        });
    }

    /** Sends in batches until nobody is pending; stops early if a batch delivers nothing. */
    async sendToPending(
        newsletterId: string,
        onProgress: (progress: NewsletterSendProgress) => void,
    ): Promise<NewsletterSendProgress> {
        let progress: NewsletterSendProgress = { sent: 0, failed: 0, remaining: 0, total: 0 };

        for (;;) {
            const result = await this.invokeDispatch({ newsletter_id: newsletterId, max_per_run: SEND_BATCH_SIZE });
            const sent = progress.sent + result.sent_count;
            progress = {
                sent,
                failed: result.failed_count,
                remaining: result.remaining,
                total: progress.total || result.sent_count + result.failed_count + result.remaining,
            };
            onProgress(progress);

            if (result.remaining === 0 || result.sent_count === 0) {
                return progress;
            }
        }
    }

    private async invokeDispatch(body: Record<string, unknown>): Promise<DispatchResponse> {
        const { data, error } = await this.supabase.functions.invoke('dispatch-newsletter', { body });
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
        return data as DispatchResponse;
    }
}
