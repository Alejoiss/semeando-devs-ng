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

export interface BillingPaymentFields {
    mpPaymentId: string | null
    grossAmount: number | null
    netAmount: number | null
    feeAmount: number | null
    refundedAmount: number | null
    paidAt: string | null
}

export interface UpdateBillingEventParams {
    status: 'processing' | 'success' | 'failed' | 'orphan'
    subscriptionId?: string | null
    errorMessage?: string | null
    payment?: BillingPaymentFields
}

function toNumber(value: unknown): number | null {
    const parsed = typeof value === 'number' ? value : Number(value)
    return value === null || value === undefined || Number.isNaN(parsed) ? null : parsed
}

export function extractPaymentFields(payment: Record<string, unknown>): BillingPaymentFields {
    const details = payment['transaction_details'] as Record<string, unknown> | undefined
    const feeDetails = payment['fee_details'] as Array<Record<string, unknown>> | undefined
    const fees = Array.isArray(feeDetails)
        ? feeDetails.reduce((sum, fee) => sum + (toNumber(fee['amount']) ?? 0), 0)
        : null
    const approved = payment['status'] === 'approved'
    const approvedAt = payment['date_approved']

    return {
        mpPaymentId: payment['id'] != null ? String(payment['id']) : null,
        grossAmount: toNumber(payment['transaction_amount']),
        netAmount: toNumber(details?.['net_received_amount']),
        feeAmount: fees,
        refundedAmount: toNumber(payment['transaction_amount_refunded']),
        paidAt: approved && typeof approvedAt === 'string' ? approvedAt : null,
    }
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
    if (params.payment) {
        updatePayload['mp_payment_id'] = params.payment.mpPaymentId
        updatePayload['gross_amount'] = params.payment.grossAmount
        updatePayload['net_amount'] = params.payment.netAmount
        updatePayload['fee_amount'] = params.payment.feeAmount
        updatePayload['refunded_amount'] = params.payment.refundedAmount
        updatePayload['paid_at'] = params.payment.paidAt
    }

    const { error } = await client
        .from('subscription_billing_events')
        .update(updatePayload)
        .eq('id', id)

    if (error) {
        console.error('[billing-events] Failed to update billing event:', error.message)
    }
}
