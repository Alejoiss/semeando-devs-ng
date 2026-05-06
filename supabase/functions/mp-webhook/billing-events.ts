import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export interface InsertBillingEventParams {
    mpEventId: string
    topic: string
    payload: unknown
}

export interface InsertBillingEventResult {
    id: string
    duplicate: false
}

export interface DuplicateBillingEventResult {
    duplicate: true
}

export type BillingEventResult = InsertBillingEventResult | DuplicateBillingEventResult

export interface UpdateBillingEventParams {
    status: 'processing' | 'success' | 'failed' | 'orphan'
    subscriptionId?: string | null
    errorMessage?: string | null
}

const PG_UNIQUE_VIOLATION = '23505'

export async function insertBillingEvent(
    client: SupabaseClient,
    params: InsertBillingEventParams,
): Promise<BillingEventResult> {
    const { data, error } = await client
        .from('subscription_billing_events')
        .insert({
            mp_event_id: params.mpEventId,
            topic: params.topic,
            payload: params.payload,
            status: 'processing',
        })
        .select('id')
        .single()

    if (error) {
        if (error.code === PG_UNIQUE_VIOLATION) {
            return { duplicate: true }
        }
        throw error
    }

    return { id: data.id, duplicate: false }
}

export async function updateBillingEvent(
    client: SupabaseClient,
    id: string,
    params: UpdateBillingEventParams,
): Promise<void> {
    const updatePayload: Record<string, unknown> = { status: params.status }

    if (params.subscriptionId !== undefined) {
        updatePayload['subscription_id'] = params.subscriptionId
    }
    if (params.errorMessage !== undefined) {
        updatePayload['error_message'] = params.errorMessage
    }

    const { error } = await client
        .from('subscription_billing_events')
        .update(updatePayload)
        .eq('id', id)

    if (error) {
        console.error('[billing-events] Failed to update billing event:', error.message)
    }
}
