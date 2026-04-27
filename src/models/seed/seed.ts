export class Seed {
    public id: string;
    public userId: string;
    public totalSeeds: number;
    public updatedAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.userId = data.user_id || '';
        this.totalSeeds = data.total_seeds || 0;
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : new Date();
    }
}
