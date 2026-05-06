export class Plan {
    public id: string;
    public name: string;
    public monthlyPrice: number;
    public yearlyPrice: number;
    public isMain: boolean;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.monthlyPrice = Number(data.monthly_price) || 0;
        this.yearlyPrice = Number(data.yearly_price) || 0;
        this.isMain = data.is_main || false;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
