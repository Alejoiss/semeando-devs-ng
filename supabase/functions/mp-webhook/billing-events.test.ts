import { assertEquals, assertRejects } from "jsr:@std/assert@1"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { extractPaymentFields, insertBillingEvent, updateBillingEvent } from "./billing-events.ts"

Deno.test('extractPaymentFields reads amounts, fees and the approval date of an approved payment', () => {
    assertEquals(
        extractPaymentFields({
            id: 123,
            status: 'approved',
            transaction_amount: 29.9,
            transaction_amount_refunded: 0,
            date_approved: '2026-03-10T10:00:00.000-03:00',
            transaction_details: { net_received_amount: 27.5 },
            fee_details: [{ amount: 1.2 }, { amount: '1.2' }],
        }),
        {
            mpPaymentId: '123',
            grossAmount: 29.9,
            netAmount: 27.5,
            feeAmount: 2.4,
            refundedAmount: 0,
            paidAt: '2026-03-10T10:00:00.000-03:00',
        },
    )
})

Deno.test('extractPaymentFields leaves paidAt empty unless the payment is approved', () => {
    const fields = extractPaymentFields({ id: 1, status: 'pending', date_approved: '2026-03-10T10:00:00Z' })
    assertEquals(fields.paidAt, null)
})

Deno.test('extractPaymentFields returns nulls for missing or non-numeric values', () => {
    assertEquals(extractPaymentFields({ transaction_amount: 'abc' }), {
        mpPaymentId: null,
        grossAmount: null,
        netAmount: null,
        feeAmount: null,
        refundedAmount: null,
        paidAt: null,
    })
})

Deno.test('extractPaymentFields ignores fee entries without a valid amount', () => {
    assertEquals(extractPaymentFields({ fee_details: [{ amount: 2 }, {}, { amount: 'x' }] }).feeAmount, 2)
})

Deno.test('insertBillingEvent stores the event as processing and returns its id', async () => {
    const fake = createFakeSupabase({ 'subscription_billing_events.insert': { data: { id: 'evt-1' } } })
    const result = await insertBillingEvent(fake.client, { mpEventId: 'mp-1', topic: 'payment', payload: { a: 1 } })
    assertEquals(result, { id: 'evt-1', duplicate: false })
    assertEquals(fake.calls[0].payload, { mp_event_id: 'mp-1', topic: 'payment', payload: { a: 1 }, status: 'processing' })
})

Deno.test('insertBillingEvent reports a duplicate on a unique violation', async () => {
    const fake = createFakeSupabase({ 'subscription_billing_events.insert': { error: { code: '23505' } } })
    assertEquals(await insertBillingEvent(fake.client, { mpEventId: 'mp-1', topic: 't', payload: {} }), { duplicate: true })
})

Deno.test('insertBillingEvent reopens a duplicate whose previous attempt failed so the retry is processed', async () => {
    const fake = createFakeSupabase({
        'subscription_billing_events.insert': { error: { code: '23505' } },
        'subscription_billing_events.select': { data: { id: 'evt-9', status: 'failed' } },
    })
    assertEquals(await insertBillingEvent(fake.client, { mpEventId: 'mp-1', topic: 't', payload: {} }), { id: 'evt-9', duplicate: false })
    const update = fake.callsFor('subscription_billing_events', 'update')[0]
    assertEquals(update.payload, { status: 'processing', error_message: null })
    assertEquals(update.filters, [['eq', 'id', 'evt-9']])
})

Deno.test('insertBillingEvent reopens a duplicate stuck in processing', async () => {
    const fake = createFakeSupabase({
        'subscription_billing_events.insert': { error: { code: '23505' } },
        'subscription_billing_events.select': { data: { id: 'evt-9', status: 'processing' } },
    })
    assertEquals(await insertBillingEvent(fake.client, { mpEventId: 'mp-1', topic: 't', payload: {} }), { id: 'evt-9', duplicate: false })
})

for (const status of ['success', 'orphan']) {
    Deno.test(`insertBillingEvent keeps skipping a duplicate already ${status}`, async () => {
        const fake = createFakeSupabase({
            'subscription_billing_events.insert': { error: { code: '23505' } },
            'subscription_billing_events.select': { data: { id: 'evt-9', status } },
        })
        assertEquals(await insertBillingEvent(fake.client, { mpEventId: 'mp-1', topic: 't', payload: {} }), { duplicate: true })
        assertEquals(fake.callsFor('subscription_billing_events', 'update'), [])
    })
}

Deno.test('insertBillingEvent rethrows any other database error', async () => {
    const error = { code: '42501', message: 'denied' }
    const fake = createFakeSupabase({ 'subscription_billing_events.insert': { error } })
    await assertRejects(() => insertBillingEvent(fake.client, { mpEventId: 'mp-1', topic: 't', payload: {} }))
})

Deno.test('updateBillingEvent sends only the fields that were given', async () => {
    const fake = createFakeSupabase()
    await updateBillingEvent(fake.client, 'evt-1', { status: 'failed', errorMessage: 'boom' })
    const [call] = fake.calls
    assertEquals(call.payload, { status: 'failed', error_message: 'boom' })
    assertEquals(call.filters, [['eq', 'id', 'evt-1']])
})

Deno.test('updateBillingEvent maps the payment fields to columns', async () => {
    const fake = createFakeSupabase()
    await updateBillingEvent(fake.client, 'evt-1', {
        status: 'success',
        subscriptionId: 'sub-1',
        payment: { mpPaymentId: '9', grossAmount: 10, netAmount: 9, feeAmount: 1, refundedAmount: 0, paidAt: '2026-03-10' },
    })
    assertEquals(fake.calls[0].payload, {
        status: 'success',
        subscription_id: 'sub-1',
        mp_payment_id: '9',
        gross_amount: 10,
        net_amount: 9,
        fee_amount: 1,
        refunded_amount: 0,
        paid_at: '2026-03-10',
    })
})

Deno.test('updateBillingEvent only logs a failed update instead of throwing', async () => {
    const fake = createFakeSupabase({ 'subscription_billing_events.update': { error: { message: 'db down' } } })
    const original = console.error
    const logged: unknown[][] = []
    console.error = (...args) => { logged.push(args) }
    try {
        await updateBillingEvent(fake.client, 'evt-1', { status: 'success' })
    } finally {
        console.error = original
    }
    assertEquals(logged.length, 1)
})
