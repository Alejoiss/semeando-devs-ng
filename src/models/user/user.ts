import { Plan } from "../plan/plan";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    acceptedTerms: boolean;
    acceptedTermsAt?: Date | null;
    avatar: string;
    plan: Plan;
    isPro: boolean;
    role: 'student' | 'teacher' | 'admin';
    proUntil?: Date | null;
    newsletter_active?: boolean;
}
