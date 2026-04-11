export enum XpLogReason {
    LESSON = 'LESSON',
    ACHIEVEMENT = 'ACHIEVEMENT',
    PURCHASE_TIP = 'PURCHASE_TIP',
}

export class XpLog {
    public id: string;
    public userId: string;
    public amount: number;
    public reason: XpLogReason;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.userId = data.user_id || '';
        this.amount = data.amount || 0;
        this.reason = data.reason || '';
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
