import { assertEquals } from "jsr:@std/assert@1"
import { FakeTime } from "jsr:@std/testing@1/time"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { createHandler } from "./handler.ts"

const NOW = '2026-06-15T12:00:00Z'
const PLAN = { monthly_price: 10, yearly_price: 100 }

const sub = (over: Record<string, unknown> = {}) => ({
    id: 'sub-1',
    status: 'active',
    coupon_id: 'c-1',
    billing_cycle: 'monthly',
    mp_preapproval_id: 'mp-1',
    created_at: '2026-01-15T12:00:00Z',
    coupons: { duration_months: 3 },
    plans: PLAN,
    ...over,
})

type Opts = {
    subs?: unknown[]
    selectError?: unknown
    mp?: (url: string) => { status?: number; body: unknown }
    extra?: Parameters<typeof createFakeSupabase>[0]
    env?: Record<string, string | undefined>
}

async function call(o: Opts = {}) {
    const fake = createFakeSupabase({
        'subscriptions.select': o.selectError ? { error: o.selectError } : { data: o.subs ?? [sub()] },
        ...o.extra,
    })
    const handler = createHandler(() => fake.client)

    const mpCalls: { url: string; method?: string; headers: Headers; body: any }[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
        const url = String(input)
        mpCalls.push({ url, method: init?.method, headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) })
        const r = o.mp?.(url) ?? { body: { id: 'mp-1' } }
        return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status ?? 200 }))
    }) as typeof fetch

    const env = { MERCADO_PAGO_ACCESS_TOKEN: 'mp-token', ML_ACCESS_TOKEN: undefined, ...o.env }
    const before = Object.fromEntries(Object.keys(env).map((k) => [k, Deno.env.get(k)]))
    for (const [k, v] of Object.entries(env)) v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v)
    const err = console.error
    console.error = () => {}
    const time = new FakeTime(new Date(NOW))
    try {
        const res = await handler(new Request('http://x/cron-revert-coupon-discount', { method: 'POST' }))
        return { res, json: await res.json(), fake, mpCalls }
    } finally {
        time.restore()
        console.error = err
        globalThis.fetch = original
        for (const [k, v] of Object.entries(before)) v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v!)
    }
}

Deno.test('only reads active subscriptions that still carry a coupon', async () => {
    const { fake } = await call({ subs: [] })
    assertEquals(fake.callsFor('subscriptions', 'select')[0].filters, [
        ['eq', 'status', 'active'],
        ['not', 'coupon_id', 'is', null],
    ])
})

Deno.test('500 with the error message when the subscriptions query fails', async () => {
    const { res, json, mpCalls } = await call({ selectError: new Error('db down') })
    assertEquals(res.status, 500)
    assertEquals(json.error, 'db down')
    assertEquals(mpCalls.length, 0)
})

Deno.test('does nothing when there are no subscriptions', async () => {
    const { res, json } = await call({ subs: [] })
    assertEquals(res.status, 200)
    assertEquals(json, { message: 'Success', processed: [], errors: [] })
})

Deno.test('leaves a subscription alone while its coupon is still running', async () => {
    const { json, mpCalls, fake } = await call({ subs: [sub({ created_at: '2026-04-15T12:00:00Z' })] })
    assertEquals(json.processed, [])
    assertEquals(mpCalls.length, 0)
    assertEquals(fake.callsFor('subscriptions', 'update').length, 0)
})

Deno.test('reverts a subscription exactly when the coupon duration ends', async () => {
    const { json } = await call({ subs: [sub({ created_at: '2026-03-15T12:00:00Z' })] })
    assertEquals(json.processed, ['sub-1'])
})

Deno.test('one second before the duration ends it is still discounted', async () => {
    const { json } = await call({ subs: [sub({ created_at: '2026-03-15T12:00:01Z' })] })
    assertEquals(json.processed, [])
})

Deno.test('raises the preapproval back to the monthly list price in Mercado Pago', async () => {
    const { mpCalls } = await call()
    assertEquals(mpCalls.length, 1)
    assertEquals(mpCalls[0].url, 'https://api.mercadopago.com/preapproval/mp-1')
    assertEquals(mpCalls[0].method, 'PUT')
    assertEquals(mpCalls[0].headers.get('Authorization'), 'Bearer mp-token')
    assertEquals(mpCalls[0].body, { auto_recurring: { transaction_amount: 10 } })
})

Deno.test('uses the yearly list price for yearly subscriptions', async () => {
    const { mpCalls } = await call({ subs: [sub({ billing_cycle: 'yearly' })] })
    assertEquals(mpCalls[0].body.auto_recurring.transaction_amount, 100)
})

Deno.test('clears the coupon from the subscription after Mercado Pago accepts the new price', async () => {
    const { json, fake } = await call()
    const upd = fake.callsFor('subscriptions', 'update')[0]
    assertEquals(upd.payload, { coupon_id: null })
    assertEquals(upd.filters, [['eq', 'id', 'sub-1']])
    assertEquals(json.processed, ['sub-1'])
})

Deno.test('without a preapproval id it clears the coupon locally and skips Mercado Pago', async () => {
    const { json, mpCalls, fake } = await call({ subs: [sub({ mp_preapproval_id: null })] })
    assertEquals(mpCalls.length, 0)
    assertEquals(fake.callsFor('subscriptions', 'update').length, 1)
    assertEquals(json.processed, ['sub-1'])
})

Deno.test('skips subscriptions missing the coupon, the plan or a coupon duration', async () => {
    const { json, mpCalls, fake } = await call({
        subs: [
            sub({ id: 'a', coupons: null }),
            sub({ id: 'b', plans: null }),
            sub({ id: 'c', coupons: { duration_months: null } }),
        ],
    })
    assertEquals(json, { message: 'Success', processed: [], errors: [] })
    assertEquals(mpCalls.length, 0)
    assertEquals(fake.callsFor('subscriptions', 'update').length, 0)
})

Deno.test('a Mercado Pago refusal keeps the coupon, is reported, and does not stop the other subscriptions', async () => {
    const { res, json, fake } = await call({
        subs: [sub({ id: 'bad', mp_preapproval_id: 'mp-bad' }), sub({ id: 'good', mp_preapproval_id: 'mp-good' })],
        mp: (url) => url.endsWith('mp-bad') ? { status: 400, body: { message: 'nope' } } : { body: {} },
    })
    assertEquals(res.status, 200)
    assertEquals(json.processed, ['good'])
    assertEquals(json.errors.length, 1)
    assertEquals(json.errors[0].id, 'bad')
    assertEquals(json.errors[0].error.startsWith('MP API Error: 400'), true)
    const updated = fake.callsFor('subscriptions', 'update').map((c) => c.filters[0][2])
    assertEquals(updated, ['good'])
})

Deno.test('a failing coupon update is reported and the subscription is not counted as processed', async () => {
    const { json } = await call({ extra: { 'subscriptions.update': { error: new Error('rls denied') } } })
    assertEquals(json.processed, [])
    assertEquals(json.errors, [{ id: 'sub-1', error: 'rls denied' }])
})

Deno.test({
    ignore: true,
    name: 'the Mercado Pago call must use the same ML_ACCESS_TOKEN secret as the other billing functions (finding cron-mp-token-env-name)',
    fn: async () => {
        const { mpCalls } = await call({ env: { MERCADO_PAGO_ACCESS_TOKEN: undefined, ML_ACCESS_TOKEN: 'ml-token' } })
        assertEquals(mpCalls[0].headers.get('Authorization'), 'Bearer ml-token')
    },
})
