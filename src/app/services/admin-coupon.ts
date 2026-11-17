import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    Coupon,
    CouponListResult,
    CouponQueryParams,
    CouponUpdateInput,
    NewCouponInput,
} from '../../models/coupon/coupon';
import { SupabaseService } from './supabase';

const UNIQUE_VIOLATION = '23505';

@Injectable({
    providedIn: 'root',
})
export class AdminCouponService {
    private readonly supabase: SupabaseClient = inject(SupabaseService).client;

    async getCoupons(params: CouponQueryParams): Promise<CouponListResult> {
        const { search, discountType, planType, sortField, sortDir, page, pageSize } = params;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let query = this.supabase
            .from('coupons')
            .select('*', { count: 'exact' })
            .order(sortField, { ascending: sortDir === 'asc', nullsFirst: false })
            .order('id', { ascending: true })
            .range(from, to);

        const term = search.trim().replace(/[%_,()]/g, '');
        if (term) {
            query = query.ilike('code', `%${term}%`);
        }
        if (discountType) {
            query = query.eq('discount_type', discountType);
        }
        if (planType) {
            query = query.eq('valid_for_plan_type', planType);
        }

        const { data, error, count } = await query;
        if (error) {
            throw new Error(error.message);
        }

        return { coupons: (data ?? []).map(row => new Coupon(row)), total: count ?? 0 };
    }

    async createCoupons(inputs: NewCouponInput[]): Promise<void> {
        const rows = inputs.map(input => ({
            code: input.code,
            discount_type: input.discountType,
            discount_value: input.discountValue,
            valid_for_plan_type: input.validForPlanType,
            duration_months: input.durationMonths,
            expiration_date: input.expirationDate?.toISOString() ?? null,
        }));

        const { error } = await this.supabase.from('coupons').insert(rows);
        if (error) {
            if (error.code === UNIQUE_VIOLATION) {
                const duplicated = /\(code\)=\(([^)]*)\)/.exec(error.details ?? '')?.[1];
                throw new Error(
                    duplicated
                        ? `Já existe um cupom com o código ${duplicated}. Nenhum cupom foi criado.`
                        : 'Já existe um cupom com um dos códigos informados. Nenhum cupom foi criado.',
                );
            }
            throw new Error(error.message);
        }
    }

    async updateCoupon(id: string, input: CouponUpdateInput): Promise<void> {
        const { data, error } = await this.supabase
            .from('coupons')
            .update({
                usage_limit: input.usageLimit,
                expiration_date: input.expirationDate?.toISOString() ?? null,
            })
            .eq('id', id)
            .select('id');

        if (error) {
            throw new Error(error.message);
        }
        if (!data?.length) {
            throw new Error('Não foi possível atualizar o cupom.');
        }
    }
}
