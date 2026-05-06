import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

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
}
