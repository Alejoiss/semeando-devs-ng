export class XpMonth {
    public id: string;
    public userId: string;
    public year: number;
    public month: number;
    public xpAmount: number;
    public updatedAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.userId = data.user_id || '';
        this.year = data.year || new Date().getFullYear();
        this.month = data.month || new Date().getMonth() + 1;
        this.xpAmount = data.xp_amount || 0;
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : new Date();
    }
}
