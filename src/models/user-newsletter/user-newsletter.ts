export interface UserNewsletter {
    user_id: string;
    newsletter_id: string;
    email_sent: boolean;
    viewed: boolean;
    created_at?: string;
}
