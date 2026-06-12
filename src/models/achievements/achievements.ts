export class Achievements {
    public id: string;
    public name: string; // visible title for display to the user
    public icon: string; // visible icon for display to the user
    public identification: string; // unique identifier for the achievement
    public requirement: string; // requirement for the achievement
    public moduleId?: string; // id of the module for this achievement whether its module based achievement
    public xpAmount: number; // xp amount for this achievement
    public isVisible: boolean;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.icon = data.icon || '';
        this.identification = data.identification || '';
        this.requirement = data.requirement || '';
        this.moduleId = data.module_id || '';
        this.xpAmount = data.xp_amount || 0;
        this.isVisible = data.is_visible !== undefined ? data.is_visible : true;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
