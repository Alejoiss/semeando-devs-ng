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

export async function handleClaim(
    client: SupabaseClient,
    event: MpEvent,
    mlToken: string,
): Promise<void> {
    const claimId = event?.data?.id
    if (!claimId) {
        console.warn('[mp-webhook] handleClaim: missing data.id')
        return
    }

    const billingResult = await insertBillingEvent(client, {
        mpEventId: claimId,
        topic: 'claims_integration',
        payload: event,
    })

    if (billingResult.duplicate) {
        console.log(`[mp-webhook] Duplicate claim event for id ${claimId}, skipping.`)
        return
    }

    const billingEventId = billingResult.id

    try {
        const claim = await fetchFromMercadoPago(
            `https://api.mercadopago.com/v1/claims/${claimId}`,
            mlToken,
        ) as Record<string, unknown>

        const claimStatus = claim['status'] as string
        const claimResolution = (claim['resolution'] as Record<string, unknown> | undefined)?.['reason'] as string | undefined
        const payments = claim['payments'] as Array<Record<string, unknown>> | undefined
        const preapprovalId = payments?.[0]?.['preapproval_id'] as string | undefined

        if (!preapprovalId) {
            await updateBillingEvent(client, billingEventId, { status: 'orphan', errorMessage: 'No preapproval_id found in claim payments' })
            return
        }

        if (claimStatus === 'opened' || claimStatus === 'in_process') {
            // Suspend PRO access preventively while dispute is open
            const subscriptionId = await syncSubscriptionAndProfile(client, preapprovalId, 'payment_failed', false)
            if (!subscriptionId) {
                await updateBillingEvent(client, billingEventId, { status: 'orphan', errorMessage: `No subscription for preapproval_id ${preapprovalId}` })
                return
            }
            await updateBillingEvent(client, billingEventId, { status: 'success', subscriptionId })
            console.log(`[mp-webhook] Claim ${claimId} opened — PRO access suspended for preapproval ${preapprovalId}`)
            return
        }

        if (claimStatus === 'resolved') {
            if (claimResolution === 'seller') {
                // Seller won — restore PRO access
                const subscriptionId = await syncSubscriptionAndProfile(client, preapprovalId, 'active', true)
                if (!subscriptionId) {
                    await updateBillingEvent(client, billingEventId, { status: 'orphan', errorMessage: `No subscription for preapproval_id ${preapprovalId}` })
                    return
                }
                await updateBillingEvent(client, billingEventId, { status: 'success', subscriptionId })
                console.log(`[mp-webhook] Claim ${claimId} resolved for seller — PRO access restored for preapproval ${preapprovalId}`)
            } else {
                // Buyer won (refund issued) — subscription already cancelled by payment webhook
                await updateBillingEvent(client, billingEventId, { status: 'success' })
                console.log(`[mp-webhook] Claim ${claimId} resolved for buyer — no additional action needed`)
            }
            return
        }

        await updateBillingEvent(client, billingEventId, { status: 'success' })
        console.log(`[mp-webhook] Informational claim status "${claimStatus}" for claim ${claimId}`)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        await updateBillingEvent(client, billingEventId, { status: 'failed', errorMessage: message })
        console.error('[mp-webhook] handleClaim error:', message)
    }
}
