export interface Newsletter {
    id: string;
    subject?: string | null;
    body: string;
    cta_url?: string | null;
    cta_label?: string | null;
    created_at?: string;
}
