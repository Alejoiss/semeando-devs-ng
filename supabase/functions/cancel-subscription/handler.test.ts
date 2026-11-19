import { assertEquals } from "jsr:@std/assert@1"
import { FakeTime } from "jsr:@std/testing@1/time"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { calculateNextBillingDate, createHandler } from "./handler.ts"

const USER = { id: 'user-1' }
const MP_URL = 'https://api.mercadopago.com/preapproval/mp-1'

const sub = (over: Record<string, unknown> = {}) => ({
    id: 'sub-1',
    user_id: 'user-1',
    status: 'active',
    mp_preapproval_id: 'mp-1',
    billing_cycle: 'monthly',
    created_at: '2026-01-10T12:00:00Z',
    ...over,
})

type Opts = {
    body?: unknown
    headers?: Record<string, string>
    method?: string
    user?: typeof USER | null
    subscription?: unknown
    mp?: { status?: number; body: unknown }
    mlToken?: string
    extra?: Parameters<typeof createFakeSupabase>[0]
    now?: string
}

async function call(o: Opts = {}) {
    const fake = createFakeSupabase({
        'subscriptions.select': { data: o.subscription === undefined ? sub() : o.subscription },
        ...o.extra,
    })
    const user = o.user === undefined ? USER : o.user
    const userClient = { auth: { getUser: () => Promise.resolve({ data: { user }, error: user ? null : new Error('bad') }) } }
    let n = 0
    const handler = createHandler(() => (n++ === 0 ? userClient : fake.client))

    const mpCalls: { url: string; method?: string; headers: Headers; body: any }[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
        mpCalls.push({ url: String(input), method: init?.method, headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) })
        const r = o.mp ?? { body: { id: 'mp-1' } }
        return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status ?? 200 }))
    }) as typeof fetch

    const envBefore = Deno.env.get('ML_ACCESS_TOKEN')
    Deno.env.set('ML_ACCESS_TOKEN', o.mlToken ?? 'ml-token')
    if (o.mlToken === '') Deno.env.delete('ML_ACCESS_TOKEN')
    const err = console.error
    console.error = () => {}
    const time = new FakeTime(new Date(o.now ?? '2026-03-20T12:00:00Z'))
    try {
        const res = await handler(new Request('http://x/cancel-subscription', {
            method: o.method ?? 'POST',
            headers: o.headers ?? { Authorization: 'Bearer t' },
            body: o.method === 'OPTIONS' ? undefined : JSON.stringify(o.body ?? { subscriptionId: 'sub-1' }),
        }))
        return { res, json: await res.json().catch(() => null), fake, mpCalls }
    } finally {
        time.restore()
        console.error = err
        globalThis.fetch = original
        envBefore === undefined ? Deno.env.delete('ML_ACCESS_TOKEN') : Deno.env.set('ML_ACCESS_TOKEN', envBefore)
    }
}

Deno.test('answers the CORS preflight', async () => {
    const { res } = await call({ method: 'OPTIONS' })
    assertEquals(res.status, 200)
})

Deno.test('401 without an authorization header', async () => {
    const { res } = await call({ headers: {} })
    assertEquals(res.status, 401)
})

Deno.test('500 when the Mercado Pago token is not configured', async () => {
    const { res, json } = await call({ mlToken: '' })
    assertEquals(res.status, 500)
    assertEquals(json.error, 'ML_ACCESS_TOKEN not configured')
})

Deno.test('401 when the token does not resolve to a user', async () => {
    const { res, fake } = await call({ user: null })
    assertEquals(res.status, 401)
    assertEquals(fake.calls.length, 0)
})

Deno.test('400 when the subscription id is missing', async () => {
    const { res, fake } = await call({ body: {} })
    assertEquals(res.status, 400)
    assertEquals(fake.calls.length, 0)
})

Deno.test('looks the subscription up scoped to the authenticated user', async () => {
    const { fake } = await call()
    const filters = fake.callsFor('subscriptions', 'select')[0].filters
    assertEquals(filters, [['eq', 'id', 'sub-1'], ['eq', 'user_id', 'user-1']])
})

Deno.test('404 when the subscription does not exist or belongs to someone else', async () => {
    const { res, mpCalls } = await call({ subscription: null })
    assertEquals(res.status, 404)
    assertEquals(mpCalls.length, 0)
})

Deno.test('400 when the subscription is already cancelled, without touching Mercado Pago', async () => {
    const { res, mpCalls, fake } = await call({ subscription: sub({ status: 'cancelled' }) })
    assertEquals(res.status, 400)
    assertEquals(mpCalls.length, 0)
    assertEquals(fake.callsFor('subscriptions', 'update').length, 0)
})

Deno.test('cancels the preapproval in Mercado Pago with the bearer token', async () => {
    const { mpCalls } = await call()
    assertEquals(mpCalls.length, 1)
    assertEquals(mpCalls[0].url, MP_URL)
    assertEquals(mpCalls[0].method, 'PUT')
    assertEquals(mpCalls[0].headers.get('Authorization'), 'Bearer ml-token')
    assertEquals(mpCalls[0].body, { status: 'cancelled' })
})

Deno.test('skips Mercado Pago when the subscription has no preapproval id', async () => {
    const { res, mpCalls, fake } = await call({ subscription: sub({ mp_preapproval_id: '' }) })
    assertEquals(res.status, 200)
    assertEquals(mpCalls.length, 0)
    assertEquals(fake.callsFor('subscriptions', 'update').length, 1)
})

Deno.test('500 with the Mercado Pago message and no local change when the cancellation is refused', async () => {
    const { res, json, fake } = await call({ mp: { status: 400, body: { message: 'preapproval not found' } } })
    assertEquals(res.status, 500)
    assertEquals(json.details, 'preapproval not found')
    assertEquals(fake.callsFor('subscriptions', 'update').length, 0)
    assertEquals(fake.callsFor('profiles', 'update').length, 0)
})

Deno.test('falls back to the error field, then to a generic detail, for Mercado Pago failures', async () => {
    assertEquals((await call({ mp: { status: 400, body: { error: 'bad_request' } } })).json.details, 'bad_request')
    assertEquals((await call({ mp: { status: 400, body: {} } })).json.details, 'Erro desconhecido')
})

Deno.test('marks the subscription cancelled and keeps access until the paid period ends', async () => {
    const { res, json, fake } = await call()
    assertEquals(res.status, 200)
    assertEquals(json.access_until, '2026-04-10T12:00:00.000Z')
    const upd = fake.callsFor('subscriptions', 'update')[0]
    assertEquals(upd.payload, { status: 'cancelled', access_until: '2026-04-10T12:00:00.000Z' })
    assertEquals(upd.filters, [['eq', 'id', 'sub-1']])
})

Deno.test('sets pro_until on the profile instead of removing PRO right away', async () => {
    const { fake } = await call()
    const upd = fake.callsFor('profiles', 'update')[0]
    assertEquals(upd.payload, { pro_until: '2026-04-10T12:00:00.000Z' })
    assertEquals(upd.filters, [['eq', 'id', 'user-1']])
})

Deno.test('500 and no profile change when the subscription update fails', async () => {
    const { res, json, fake } = await call({ extra: { 'subscriptions.update': { error: { message: 'rls denied' } } } })
    assertEquals(res.status, 500)
    assertEquals(json.error, 'rls denied')
    assertEquals(fake.callsFor('profiles', 'update').length, 0)
})

Deno.test('calculateNextBillingDate: monthly before the billing day moves to this month', () => {
    const time = new FakeTime(new Date('2026-03-05T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2026-01-10T12:00:00Z', 'monthly').toISOString(), '2026-03-10T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('calculateNextBillingDate: monthly on or after the billing day moves to next month', () => {
    const time = new FakeTime(new Date('2026-03-10T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2026-01-10T12:00:00Z', 'monthly').toISOString(), '2026-04-10T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('calculateNextBillingDate: monthly across a year boundary', () => {
    const time = new FakeTime(new Date('2026-01-20T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2025-11-10T12:00:00Z', 'monthly').toISOString(), '2026-02-10T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('calculateNextBillingDate: first month of a brand-new monthly subscription is one month out', () => {
    const time = new FakeTime(new Date('2026-03-12T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2026-03-10T12:00:00Z', 'monthly').toISOString(), '2026-04-10T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('calculateNextBillingDate: yearly before the anniversary lands on this year', () => {
    const time = new FakeTime(new Date('2026-03-05T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2024-06-15T12:00:00Z', 'yearly').toISOString(), '2026-06-15T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('calculateNextBillingDate: yearly after the anniversary lands on next year', () => {
    const time = new FakeTime(new Date('2026-07-01T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2024-06-15T12:00:00Z', 'yearly').toISOString(), '2027-06-15T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('calculateNextBillingDate: first year of a brand-new yearly subscription is one year out', () => {
    const time = new FakeTime(new Date('2026-06-20T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2026-06-15T12:00:00Z', 'yearly').toISOString(), '2027-06-15T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('a subscription started on day 31 keeps access until the end of the shorter month, not the following one', () => {
    const time = new FakeTime(new Date('2026-01-31T15:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2026-01-31T12:00:00Z', 'monthly').toISOString(), '2026-02-28T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('a yearly subscription started on Feb 29 renews on Feb 28 in a non-leap year', () => {
    const time = new FakeTime(new Date('2026-03-01T12:00:00Z'))
    try {
        assertEquals(calculateNextBillingDate('2024-02-29T12:00:00Z', 'yearly').toISOString(), '2027-02-28T12:00:00.000Z')
    } finally {
        time.restore()
    }
})

Deno.test('a failing pro_until update is not reported as a successful cancellation', async () => {
    const { res } = await call({ extra: { 'profiles.update': { error: { message: 'rls denied' } } } })
    assertEquals(res.status, 500)
})
