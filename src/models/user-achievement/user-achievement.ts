export class UserAchievement {
    public userId: string;
    public achievementId: string;
    public viewed: boolean;
    public progress: number;
    public completed: boolean;
    public lastValue: string | null;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.userId = data.user_id || '';
        this.achievementId = data.achievement_id || '';
        this.viewed = data.viewed || false;
        this.progress = data.progress || 0;
        this.completed = data.completed || false;
        this.lastValue = data.last_value || null;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
