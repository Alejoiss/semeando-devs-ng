export interface Profile {
    id: string;
    is_pro: boolean;
    role: 'student' | 'teacher' | 'admin';
    pro_until?: string | null;
    newsletter_active?: boolean;
    created_at?: string;
    updated_at?: string;
}
