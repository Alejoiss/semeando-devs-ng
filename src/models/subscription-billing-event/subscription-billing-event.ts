export class SubscriptionBillingEvent {
    public id: string;
    public subscriptionId: string | null;
    public mpEventId: string;
    public topic: string;
    public payload: any;
    public status: string;
    public errorMessage: string | null;
    public mpPaymentId: string | null;
    public grossAmount: number | null;
    public netAmount: number | null;
    public feeAmount: number | null;
    public refundedAmount: number | null;
    public paidAt: Date | null;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.subscriptionId = data.subscription_id || null;
        this.mpEventId = data.mp_event_id || '';
        this.topic = data.topic || '';
        this.payload = data.payload || null;
        this.status = data.status || '';
        this.errorMessage = data.error_message || null;
        this.mpPaymentId = data.mp_payment_id || null;
        this.grossAmount = data.gross_amount ?? null;
        this.netAmount = data.net_amount ?? null;
        this.feeAmount = data.fee_amount ?? null;
        this.refundedAmount = data.refunded_amount ?? null;
        this.paidAt = data.paid_at ? new Date(data.paid_at) : null;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
