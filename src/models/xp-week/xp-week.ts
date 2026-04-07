import { User } from "../user/user";

export interface XpWeek {
    id: string;
    user: User;
    year: number;
    week: number;
    total: number;
}
