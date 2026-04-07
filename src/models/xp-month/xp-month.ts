import { User } from "../user/user";

export interface XpMonth {
    id: string;
    user: User;
    year: number;
    month: number;
    total: number;
}
