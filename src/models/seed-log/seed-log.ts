export class SeedLog {
    public id: string;
    public userId: string;
    public amount: number;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.userId = data.user_id || '';
        this.amount = data.amount || 0;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
