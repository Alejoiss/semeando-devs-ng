import { inject, Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { Coupon } from '../../models/coupon/coupon';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private supabase = inject(SupabaseService);

    async createSubscription(
        planId: string,
        billingCycle: 'monthly' | 'yearly',
        paymentMethod: 'card' | 'pix',
        couponCode?: string,
        cardTokenId?: string
    ): Promise<any> {
        const { data: { session } } = await this.supabase.client.auth.getSession();
        if (!session) throw new Error('Sessão não encontrada. Faça login novamente.');

        const { data, error } = await this.supabase.client.functions.invoke('create-subscription', {
            body: { planId, billingCycle, couponCode, paymentMethod, cardTokenId },
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (error) {
            throw { message: error.message || 'Erro ao criar assinatura', code: 'unknown' };
        }

        if (data?.error) {
            throw { message: data.error, code: data.code || 'unknown', details: data.details };
        }

        return data;
    }
    async getActiveSubscription(): Promise<any> {
        const { data: { session } } = await this.supabase.client.auth.getSession();
        if (!session) throw new Error('Sessão não encontrada. Faça login novamente.');

        const { data, error } = await this.supabase.client
            .from('subscriptions')
            .select(`
                *,
                plans (*),
                coupons (*)
            `)
            .eq('user_id', session.user.id)
            .in('status', ['active', 'pending'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    }

    async cancelSubscription(subscriptionId: string): Promise<any> {
        const { data: { session } } = await this.supabase.client.auth.getSession();
        if (!session) throw new Error('Sessão não encontrada. Faça login novamente.');

        const { data, error } = await this.supabase.client.functions.invoke('cancel-subscription', {
            body: { subscriptionId },
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (error) {
            throw { message: error.message || 'Erro ao cancelar assinatura', code: 'unknown' };
        }

        if (data?.error) {
            throw { message: data.error, code: data.code || 'unknown', details: data.details };
        }

        return data;
    }

    async activateProWithCoupon(coupon: Coupon): Promise<void> {
        const { error } = await this.supabase.client.rpc('activate_pro_with_coupon_id', {
            p_coupon_id: coupon.id
        });

        if (error) {
            throw new Error(error.message || 'Erro ao ativar o plano Pro.');
        }
    }

    watchSubscriptionStatus(
        subscriptionId: string,
        onActive: () => void,
    ): RealtimeChannel {
        const channel = this.supabase.client
            .channel(`subscription-status-${subscriptionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'subscriptions',
                    filter: `id=eq.${subscriptionId}`,
                },
                (payload) => {
                    if (payload.new['status'] === 'active') {
                        onActive();
                    }
                },
            )
            .subscribe();

        return channel;
    }
}
