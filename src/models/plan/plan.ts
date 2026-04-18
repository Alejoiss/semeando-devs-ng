export interface Plan {
    id: string;
    name: string;
    price: number;
    validUntil: Date;
    discount: number;
    discountUntil: Date;
    couponCode?: string;
    couponCodeQuantity?: number;
}
