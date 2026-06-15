export interface Profile {
    id: string;
    is_pro: boolean;
    role: 'student' | 'teacher' | 'admin';
    pro_until?: string | null;
    newsletter_active?: boolean;
    terms_accepted?: boolean;
    terms_accepted_at?: string | null;
    teacher_terms_accepted?: boolean;
    teacher_terms_accepted_at?: string | null;
    created_at?: string;
    updated_at?: string;
}
