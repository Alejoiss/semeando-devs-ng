import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { insertBillingEvent, updateBillingEvent } from "./billing-events.ts"

type MpEvent = { topic?: string; data?: { id?: string } }

async function fetchFromMercadoPago(url: string, mlToken: string): Promise<unknown> {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${mlToken}` },
    })
    if (!response.ok) {
        const body = await response.text()
        throw new Error(`MP API error ${response.status}: ${body}`)
    }
    return response.json()
}

async function syncSubscriptionAndProfile(
    client: SupabaseClient,
    preapprovalId: string,
    newStatus: 'active' | 'cancelled' | 'payment_failed',
    isPro: boolean,
): Promise<string | null> {
    const { data: subscription, error: subError } = await client
        .from('subscriptions')
        .select('id, user_id')
        .eq('mp_preapproval_id', preapprovalId)
        .maybeSingle()

    if (subError) throw subError
    if (!subscription) return null

    await client
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscription.id)

    await client
        .from('profiles')
        .update({ is_pro: isPro })
        .eq('id', subscription.user_id)

    return subscription.id
}

export async function handleAuthorizedPayment(
    client: SupabaseClient,
    event: MpEvent,
    mlToken: string,
): Promise<void> {
    const paymentId = event?.data?.id
    if (!paymentId) {
        console.warn('[mp-webhook] handleAuthorizedPayment: missing data.id')
        return
    }

    const billingResult = await insertBillingEvent(client, {
        mpEventId: paymentId,
        topic: 'subscription_authorized_payment',
        payload: event,
    })

    if (billingResult.duplicate) {
        console.log(`[mp-webhook] Duplicate authorized_payment event for id ${paymentId}, skipping.`)
        return
    }

    const billingEventId = billingResult.id

    try {
        const payment = await fetchFromMercadoPago(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            mlToken,
        ) as Record<string, unknown>

        const preapprovalId = payment['preapproval_id'] as string | undefined
        if (!preapprovalId) {
            await updateBillingEvent(client, billingEventId, { status: 'orphan', errorMessage: 'No preapproval_id in payment object' })
            return
        }

        const paymentStatus = payment['status'] as string
        const isApproved = paymentStatus === 'approved'
        const newStatus = isApproved ? 'active' : 'payment_failed'
        const isPro = isApproved

        const subscriptionId = await syncSubscriptionAndProfile(client, preapprovalId, newStatus, isPro)

        if (!subscriptionId) {
            await updateBillingEvent(client, billingEventId, { status: 'orphan', errorMessage: `No subscription found for preapproval_id ${preapprovalId}` })
            return
        }

        await updateBillingEvent(client, billingEventId, { status: 'success', subscriptionId })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        await updateBillingEvent(client, billingEventId, { status: 'failed', errorMessage: message })
        console.error('[mp-webhook] handleAuthorizedPayment error:', message)
    }
}

export async function handlePreapproval(
    client: SupabaseClient,
    event: MpEvent,
    mlToken: string,
): Promise<void> {
    const preapprovalIdFromEvent = event?.data?.id
    if (!preapprovalIdFromEvent) {
        console.warn('[mp-webhook] handlePreapproval: missing data.id')
        return
    }

    const billingResult = await insertBillingEvent(client, {
        mpEventId: preapprovalIdFromEvent,
        topic: 'subscription_preapproval',
        payload: event,
    })

    if (billingResult.duplicate) {
        console.log(`[mp-webhook] Duplicate preapproval event for id ${preapprovalIdFromEvent}, skipping.`)
        return
    }

    const billingEventId = billingResult.id

    try {
        const preapproval = await fetchFromMercadoPago(
            `https://api.mercadopago.com/preapproval/${preapprovalIdFromEvent}`,
            mlToken,
        ) as Record<string, unknown>

        const preapprovalStatus = preapproval['status'] as string
        const mpPreapprovalId = preapproval['id'] as string

        if (preapprovalStatus === 'cancelled') {
            const subscriptionId = await syncSubscriptionAndProfile(client, mpPreapprovalId, 'cancelled', false)
            if (!subscriptionId) {
                await updateBillingEvent(client, billingEventId, { status: 'orphan', errorMessage: `No subscription found for preapproval_id ${mpPreapprovalId}` })
                return
            }
            await updateBillingEvent(client, billingEventId, { status: 'success', subscriptionId })
            return
        }

        if (preapprovalStatus === 'paused') {
            const subscriptionId = await syncSubscriptionAndProfile(client, mpPreapprovalId, 'payment_failed', false)
            if (!subscriptionId) {
                await updateBillingEvent(client, billingEventId, { status: 'orphan', errorMessage: `No subscription found for preapproval_id ${mpPreapprovalId}` })
                return
            }
            await updateBillingEvent(client, billingEventId, { status: 'success', subscriptionId })
            return
        }

        await updateBillingEvent(client, billingEventId, { status: 'success' })
        console.log(`[mp-webhook] Informational preapproval status "${preapprovalStatus}" for ${mpPreapprovalId}`)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        await updateBillingEvent(client, billingEventId, { status: 'failed', errorMessage: message })
        console.error('[mp-webhook] handlePreapproval error:', message)
    }
}
