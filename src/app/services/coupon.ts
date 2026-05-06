import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import { Coupon } from '../../models/coupon/coupon';

@Injectable({
    providedIn: 'root'
})
export class CouponService {
    private readonly supabase = inject(SupabaseService);

    async validateCoupon(code: string): Promise<Coupon | null> {
        const { data, error } = await this.supabase.client
            .from('coupons')
            .select('*')
            .eq('code', code)
            .single();

        if (error) {
            console.error('Error validating coupon:', error);
            return null;
        }

        const coupon = new Coupon(data);
        const now = new Date();

        if (coupon.expirationDate && coupon.expirationDate < now) {
            console.warn('Coupon expired');
            return null;
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            console.warn('Coupon usage limit reached');
            return null;
        }

        return coupon;
    }
}
