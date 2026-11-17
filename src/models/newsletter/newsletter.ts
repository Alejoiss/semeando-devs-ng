export interface Newsletter {
    id: string;
    subject?: string | null;
    body: string;
    html?: string | null;
    cta_url?: string | null;
    cta_label?: string | null;
    created_at?: string;
}

export interface NewsletterQueryParams {
    search: string;
    sortDir: 'asc' | 'desc';
    page: number;
    pageSize: number;
}

export interface NewsletterListResult {
    newsletters: Newsletter[];
    total: number;
}

export interface NewNewsletterInput {
    subject: string;
    body: string;
    html: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
}

export interface NewsletterSendProgress {
    sent: number;
    failed: number;
    remaining: number;
    total: number;
}
