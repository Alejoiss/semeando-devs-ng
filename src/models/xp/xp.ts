export class XP {
    public id: string;
    public userId: string;
    public totalXp: number;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.userId = data.user_id || '';
        this.totalXp = data.total_xp || 0;
    }
}
