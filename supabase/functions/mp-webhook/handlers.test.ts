import { assertEquals, assertRejects } from "jsr:@std/assert@1"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { handleAuthorizedPayment, handleClaim, handlePreapproval } from "./handlers.ts"

const TOKEN = 'mp-token'
const SUB = { id: 'sub-1', user_id: 'user-1' }

type Mp = Record<string, { status?: number; body: unknown }>

async function withMp<T>(responses: Mp, fn: (requested: { url: string; auth: string | null }[]) => Promise<T>) {
    const original = globalThis.fetch
    const requested: { url: string; auth: string | null }[] = []
    globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
        const url = String(input)
        requested.push({ url, auth: new Headers(init?.headers).get('Authorization') })
        const r = responses[url]
        if (!r) return Promise.reject(new Error(`unexpected fetch ${url}`))
        return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status ?? 200 }))
    }) as typeof fetch
    const log = [console.log, console.warn, console.error]
    console.log = console.warn = console.error = () => {}
    try {
        return await fn(requested)
    } finally {
        globalThis.fetch = original
        ;[console.log, console.warn, console.error] = log
    }
}

function setup(extra: Parameters<typeof createFakeSupabase>[0] = {}, subscription: unknown = SUB) {
    return createFakeSupabase({
        'subscription_billing_events.insert': { data: { id: 'evt-1' } },
        'subscriptions.select': { data: subscription },
        ...extra,
    })
}

const billingUpdate = (fake: ReturnType<typeof createFakeSupabase>) =>
    fake.callsFor('subscription_billing_events', 'update').at(-1)!.payload

const PAYMENT_URL = 'https://api.mercadopago.com/v1/payments/pay-1'
const PREAPPROVAL_URL = 'https://api.mercadopago.com/preapproval/pre-1'
const CLAIM_URL = 'https://api.mercadopago.com/v1/claims/claim-1'

const payment = (over: Record<string, unknown> = {}) => ({
    id: 'pay-1',
    status: 'approved',
    transaction_amount: 29.9,
    metadata: { preapproval_id: 'pre-1' },
    ...over,
})

Deno.test('authorized payment: ignores events without data.id', async () => {
    const fake = setup()
    await withMp({}, () => handleAuthorizedPayment(fake.client, {}, TOKEN))
    assertEquals(fake.calls, [])
})

Deno.test('authorized payment: skips duplicate events without calling Mercado Pago', async () => {
    const fake = setup({ 'subscription_billing_events.insert': { error: { code: '23505' } } })
    await withMp({}, async (requested) => {
        await handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN)
        assertEquals(requested, [])
    })
    assertEquals(fake.callsFor('subscriptions'), [])
})

Deno.test('authorized payment: approved payment activates the subscription and grants PRO', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { body: payment() } }, async (requested) => {
        await handleAuthorizedPayment(fake.client, { id: 77, data: { id: 'pay-1' } }, TOKEN)
        assertEquals(requested, [{ url: PAYMENT_URL, auth: `Bearer ${TOKEN}` }])
    })
    assertEquals(fake.callsFor('subscription_billing_events', 'insert')[0].payload.mp_event_id, '77')
    assertEquals(fake.callsFor('subscriptions', 'update')[0].payload, { status: 'active' })
    assertEquals(fake.callsFor('profiles', 'update')[0].payload, { is_pro: true })
    assertEquals(fake.callsFor('profiles', 'update')[0].filters, [['eq', 'id', 'user-1']])
    const update = billingUpdate(fake)
    assertEquals(update.status, 'success')
    assertEquals(update.subscription_id, 'sub-1')
    assertEquals(update.gross_amount, 29.9)
})

Deno.test('authorized payment: falls back to the payment id as event id', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { body: payment() } }, () => handleAuthorizedPayment(fake.client, { data: { id: 'pay-1' } }, TOKEN))
    assertEquals(fake.callsFor('subscription_billing_events', 'insert')[0].payload.mp_event_id, 'pay-1')
})

Deno.test('authorized payment: a rejected payment marks payment_failed and removes PRO', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { body: payment({ status: 'rejected' }) } }, () =>
        handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
    assertEquals(fake.callsFor('subscriptions', 'update')[0].payload, { status: 'payment_failed' })
    assertEquals(fake.callsFor('profiles', 'update')[0].payload, { is_pro: false })
})

for (const status of ['pending', 'in_process', 'authorized']) {
    Deno.test(`authorized payment: a ${status} payment leaves the subscription and PRO access unchanged`, async () => {
        const fake = setup()
        await withMp({ [PAYMENT_URL]: { body: payment({ status }) } }, () =>
            handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
        assertEquals(fake.callsFor('subscriptions', 'update'), [])
        assertEquals(fake.callsFor('profiles', 'update'), [])
        assertEquals(billingUpdate(fake).status, 'success')
    })
}

for (const status of ['cancelled', 'refunded', 'charged_back']) {
    Deno.test(`authorized payment: a ${status} payment removes PRO access`, async () => {
        const fake = setup()
        await withMp({ [PAYMENT_URL]: { body: payment({ status }) } }, () =>
            handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
        assertEquals(fake.callsFor('profiles', 'update')[0].payload, { is_pro: false })
    })
}

Deno.test('authorized payment: reads the preapproval from point_of_interaction', async () => {
    const fake = setup()
    await withMp({
        [PAYMENT_URL]: { body: payment({ metadata: {}, point_of_interaction: { transaction_data: { subscription_id: 'pre-9' } } }) },
    }, () => handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
    assertEquals(fake.callsFor('subscriptions', 'select')[0].filters, [['eq', 'mp_preapproval_id', 'pre-9']])
})

Deno.test('authorized payment: PIX payments use the payment id as preapproval id', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { body: payment({ metadata: {}, payment_method_id: 'pix' }) } }, () =>
        handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
    assertEquals(fake.callsFor('subscriptions', 'select')[0].filters, [['eq', 'mp_preapproval_id', 'pay-1']])
})

Deno.test('authorized payment: no preapproval makes the event an orphan and changes nothing', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { body: payment({ metadata: {} }) } }, () =>
        handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
    assertEquals(billingUpdate(fake).status, 'orphan')
    assertEquals(fake.callsFor('subscriptions'), [])
})

Deno.test('authorized payment: unknown subscription makes the event an orphan', async () => {
    const fake = setup({}, null)
    await withMp({ [PAYMENT_URL]: { body: payment() } }, () =>
        handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
    assertEquals(billingUpdate(fake).status, 'orphan')
    assertEquals(fake.callsFor('profiles', 'update'), [])
})

Deno.test('authorized payment: a Mercado Pago 5xx marks the event failed and throws so the webhook can be retried', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { status: 500, body: { message: 'oops' } } }, () =>
        assertRejects(() => handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN), Error, 'MP API error 500'))
    const update = billingUpdate(fake)
    assertEquals(update.status, 'failed')
    assertEquals(String(update.error_message).startsWith('MP API error 500'), true)
})

Deno.test('authorized payment: a Mercado Pago 404 is permanent, so it is marked failed without throwing', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { status: 404, body: { message: 'not found' } } }, () =>
        handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN))
    assertEquals(billingUpdate(fake).status, 'failed')
})

Deno.test('authorized payment: a Mercado Pago 429 is transient and throws', async () => {
    const fake = setup()
    await withMp({ [PAYMENT_URL]: { status: 429, body: {} } }, () =>
        assertRejects(() => handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN), Error, 'MP API error 429'))
    assertEquals(billingUpdate(fake).status, 'failed')
})

Deno.test('authorized payment: a subscription lookup error marks the event failed and throws', async () => {
    const fake = setup({ 'subscriptions.select': { error: new Error('db down') } })
    await withMp({ [PAYMENT_URL]: { body: payment() } }, () =>
        assertRejects(() => handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN), Error, 'db down'))
    assertEquals(billingUpdate(fake), { status: 'failed', error_message: 'db down' })
})

Deno.test('authorized payment: a failing profile update is not reported as success', async () => {
    const fake = setup({ 'profiles.update': { error: new Error('rls') } })
    await withMp({ [PAYMENT_URL]: { body: payment() } }, () =>
        assertRejects(() => handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN), Error, 'rls'))
    assertEquals(billingUpdate(fake), { status: 'failed', error_message: 'rls' })
})

Deno.test('authorized payment: a failing subscription update is not reported as success and skips the profile', async () => {
    const fake = setup({ 'subscriptions.update': { error: new Error('rls') } })
    await withMp({ [PAYMENT_URL]: { body: payment() } }, () =>
        assertRejects(() => handleAuthorizedPayment(fake.client, { id: 1, data: { id: 'pay-1' } }, TOKEN), Error, 'rls'))
    assertEquals(billingUpdate(fake).status, 'failed')
    assertEquals(fake.callsFor('profiles', 'update'), [])
})

Deno.test('preapproval: a database failure marks the event failed and throws', async () => {
    const fake = setup({ 'profiles.update': { error: new Error('rls') } })
    await withMp({ [PREAPPROVAL_URL]: { body: { id: 'pre-1', status: 'cancelled' } } }, () =>
        assertRejects(() => handlePreapproval(fake.client, { id: 2, data: { id: 'pre-1' } }, TOKEN), Error, 'rls'))
    assertEquals(billingUpdate(fake).status, 'failed')
})

Deno.test('claim: a Mercado Pago 5xx marks the event failed and throws', async () => {
    const fake = setup()
    await withMp({ [CLAIM_URL]: { status: 503, body: {} } }, () =>
        assertRejects(() => handleClaim(fake.client, { id: 3, data: { id: 'claim-1' } }, TOKEN), Error, 'MP API error 503'))
    assertEquals(billingUpdate(fake).status, 'failed')
})

Deno.test('preapproval: ignores events without data.id', async () => {
    const fake = setup()
    await withMp({}, () => handlePreapproval(fake.client, {}, TOKEN))
    assertEquals(fake.calls, [])
})

Deno.test('preapproval: skips duplicates', async () => {
    const fake = setup({ 'subscription_billing_events.insert': { error: { code: '23505' } } })
    await withMp({}, () => handlePreapproval(fake.client, { id: 1, data: { id: 'pre-1' } }, TOKEN))
    assertEquals(fake.callsFor('subscriptions'), [])
})

Deno.test('preapproval: cancelled removes PRO and marks the subscription cancelled', async () => {
    const fake = setup()
    await withMp({ [PREAPPROVAL_URL]: { body: { id: 'pre-1', status: 'cancelled' } } }, () =>
        handlePreapproval(fake.client, { id: 1, data: { id: 'pre-1' } }, TOKEN))
    assertEquals(fake.callsFor('subscriptions', 'update')[0].payload, { status: 'cancelled' })
    assertEquals(fake.callsFor('profiles', 'update')[0].payload, { is_pro: false })
    assertEquals(billingUpdate(fake), { status: 'success', subscription_id: 'sub-1' })
})

Deno.test('preapproval: paused is treated as payment_failed without PRO', async () => {
    const fake = setup()
    await withMp({ [PREAPPROVAL_URL]: { body: { id: 'pre-1', status: 'paused' } } }, () =>
        handlePreapproval(fake.client, { id: 1, data: { id: 'pre-1' } }, TOKEN))
    assertEquals(fake.callsFor('subscriptions', 'update')[0].payload, { status: 'payment_failed' })
    assertEquals(fake.callsFor('profiles', 'update')[0].payload, { is_pro: false })
})

Deno.test('preapproval: cancelled for an unknown subscription is an orphan', async () => {
    const fake = setup({}, null)
    await withMp({ [PREAPPROVAL_URL]: { body: { id: 'pre-1', status: 'cancelled' } } }, () =>
        handlePreapproval(fake.client, { id: 1, data: { id: 'pre-1' } }, TOKEN))
    assertEquals(billingUpdate(fake).status, 'orphan')
})

Deno.test('preapproval: informational statuses succeed without touching subscriptions', async () => {
    const fake = setup()
    await withMp({ [PREAPPROVAL_URL]: { body: { id: 'pre-1', status: 'authorized' } } }, () =>
        handlePreapproval(fake.client, { id: 1, data: { id: 'pre-1' } }, TOKEN))
    assertEquals(billingUpdate(fake), { status: 'success' })
    assertEquals(fake.callsFor('subscriptions'), [])
})

Deno.test('preapproval: API error marks the event failed', async () => {
    const fake = setup()
    await withMp({ [PREAPPROVAL_URL]: { status: 404, body: {} } }, () =>
        handlePreapproval(fake.client, { id: 1, data: { id: 'pre-1' } }, TOKEN))
    assertEquals(billingUpdate(fake).status, 'failed')
})

const claim = (status: string, reason?: string, preapproval: string | null = 'pre-1') => ({
    status,
    resolution: reason ? { reason } : undefined,
    payments: preapproval ? [{ preapproval_id: preapproval }] : [],
})

const runClaim = (fake: ReturnType<typeof setup>, body: unknown) =>
    withMp({ [CLAIM_URL]: { body } }, () => handleClaim(fake.client, { id: 1, data: { id: 'claim-1' } }, TOKEN))

Deno.test('claim: ignores events without data.id and skips duplicates', async () => {
    const empty = setup()
    await withMp({}, () => handleClaim(empty.client, {}, TOKEN))
    assertEquals(empty.calls, [])

    const dup = setup({ 'subscription_billing_events.insert': { error: { code: '23505' } } })
    await withMp({}, () => handleClaim(dup.client, { id: 1, data: { id: 'claim-1' } }, TOKEN))
    assertEquals(dup.callsFor('subscriptions'), [])
})

Deno.test('claim: an opened claim suspends PRO access', async () => {
    for (const status of ['opened', 'in_process']) {
        const fake = setup()
        await runClaim(fake, claim(status))
        assertEquals(fake.callsFor('subscriptions', 'update')[0].payload, { status: 'payment_failed' })
        assertEquals(fake.callsFor('profiles', 'update')[0].payload, { is_pro: false })
        assertEquals(billingUpdate(fake).status, 'success')
    }
})

Deno.test('claim: resolved for the seller restores PRO access', async () => {
    const fake = setup()
    await runClaim(fake, claim('resolved', 'seller'))
    assertEquals(fake.callsFor('subscriptions', 'update')[0].payload, { status: 'active' })
    assertEquals(fake.callsFor('profiles', 'update')[0].payload, { is_pro: true })
})

Deno.test('claim: resolved for the buyer changes nothing', async () => {
    const fake = setup()
    await runClaim(fake, claim('resolved', 'buyer'))
    assertEquals(fake.callsFor('subscriptions'), [])
    assertEquals(billingUpdate(fake), { status: 'success' })
})

Deno.test('claim: other statuses are informational', async () => {
    const fake = setup()
    await runClaim(fake, claim('closed'))
    assertEquals(fake.callsFor('subscriptions'), [])
    assertEquals(billingUpdate(fake), { status: 'success' })
})

Deno.test('claim: without a preapproval in the payments it is an orphan', async () => {
    const fake = setup()
    await runClaim(fake, claim('opened', undefined, null))
    assertEquals(billingUpdate(fake).status, 'orphan')
    assertEquals(fake.callsFor('subscriptions'), [])
})

Deno.test('claim: unknown subscription is an orphan', async () => {
    const fake = setup({}, null)
    await runClaim(fake, claim('opened'))
    assertEquals(billingUpdate(fake).status, 'orphan')
})
