import { Plan } from "../plan/plan";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    acceptedTerms: boolean;
    acceptedTermsAt: Date;
    avatar: string;
    plan: Plan;
}
