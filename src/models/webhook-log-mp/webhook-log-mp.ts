export class WebhookLogMp {
    public id: string;
    public payload: any;
    public status: 'pending' | 'success' | 'error';
    public createdAt: Date;
    public updatedAt: Date;

    constructor(data: any = {}) {
        this.id = data.id || '';
        this.payload = data.payload || {};
        this.status = data.status || 'pending';
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : new Date();
    }
}
