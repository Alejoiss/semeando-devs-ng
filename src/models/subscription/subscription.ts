import { Plan } from '../plan/plan';
import { Coupon } from '../coupon/coupon';

export class Subscription {
    public id: string;
    public userId: string;
    public planId: string;
    public couponId: string | null;
    public mpPreapprovalId: string;
    public billingCycle: 'monthly' | 'yearly';
    public transactionAmount: number;
    public status: 'pending' | 'active' | 'cancelled' | 'payment_failed';
    public createdAt: Date;
    public plan?: Plan;
    public coupon?: Coupon;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.userId = data.user_id || '';
        this.planId = data.plan_id || '';
        this.couponId = data.coupon_id || null;
        this.mpPreapprovalId = data.mp_preapproval_id || '';
        this.billingCycle = data.billing_cycle || 'monthly';
        this.transactionAmount = Number(data.transaction_amount) || 0;
        this.status = data.status || 'pending';
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
        if (data.plans) this.plan = new Plan(data.plans);
        if (data.coupons) this.coupon = new Coupon(data.coupons);
    }
}
