import { User } from "../user/user";

export enum XpLogType {
    LESSON = 'LESSON',
    ACHIEVEMENT = 'ACHIEVEMENT',
    PURCHASE_TIP = 'PURCHASE_TIP',
}

export interface XpLog {
    id: string;
    user: User;
    type: XpLogType;
    total: number;
}
