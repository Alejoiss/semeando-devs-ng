export class Coupon {
    public id: string;
    public code: string;
    public discountType: 'percentage' | 'fixed';
    public discountValue: number;
    public usageLimit: number | null;
    public usedCount: number;
    public expirationDate: Date | null;
    public durationMonths: number | null;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.code = data.code || '';
        this.discountType = data.discount_type || 'percentage';
        this.discountValue = Number(data.discount_value) || 0;
        this.usageLimit = data.usage_limit || null;
        this.usedCount = data.used_count || 0;
        this.expirationDate = data.expiration_date ? new Date(data.expiration_date) : null;
        this.durationMonths = data.duration_months || null;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
