export class SubscriptionBillingEvent {
    public id: string;
    public subscriptionId: string | null;
    public mpEventId: string;
    public topic: string;
    public payload: any;
    public status: string;
    public errorMessage: string | null;
    public createdAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.subscriptionId = data.subscription_id || null;
        this.mpEventId = data.mp_event_id || '';
        this.topic = data.topic || '';
        this.payload = data.payload || null;
        this.status = data.status || '';
        this.errorMessage = data.error_message || null;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
    }
}
