import { assertEquals } from "jsr:@std/assert@1"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { createHandler } from "./handler.ts"

const SECRET = 'whsec'
const REQUEST_ID = 'req-1'
const TS = '1690000000'

async function sign(dataId: string, secret = SECRET, requestId = REQUEST_ID, ts = TS) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`id:${dataId};request-id:${requestId};ts:${ts};`))
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

type Opts = {
    method?: string
    body?: unknown
    rawBody?: string
    signature?: string | null
    requestId?: string | null
    env?: Record<string, string | undefined>
    mp?: Record<string, { status?: number; body: unknown }>
    resendOk?: boolean
    extra?: Parameters<typeof createFakeSupabase>[0]
}

async function call(o: Opts = {}) {
    const body = o.body ?? { id: 5, type: 'payment', data: { id: 'pay-1' } }
    const rawBody = o.rawBody ?? JSON.stringify(body)
    const dataId = (body as any)?.data?.id || (body as any)?.id || ''
    const signature = o.signature === undefined ? `ts=${TS},v1=${await sign(dataId)}` : o.signature
    const headers = new Headers()
    if (signature) headers.set('x-signature', signature)
    if (o.requestId !== null) headers.set('x-request-id', o.requestId ?? REQUEST_ID)

    const fake = createFakeSupabase({
        'webhooks_log_mp.insert': { data: { id: 'log-1' } },
        'subscription_billing_events.insert': { data: { id: 'evt-1' } },
        'subscriptions.select': { data: { id: 'sub-1', user_id: 'user-1' } },
        ...o.extra,
    })

    const fetched: { url: string; init?: RequestInit }[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
        const url = String(input)
        fetched.push({ url, init })
        if (url === 'https://api.resend.com/emails') {
            return Promise.resolve(new Response('resend', { status: o.resendOk === false ? 500 : 200 }))
        }
        const r = o.mp?.[url]
        if (!r) return Promise.reject(new Error(`unexpected fetch ${url}`))
        return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status ?? 200 }))
    }) as typeof fetch

    const env = { MP_WEBHOOK_SECRET: SECRET, ML_ACCESS_TOKEN: 'tok', RESEND_API_KEY: undefined, SMTP_HOST: undefined, SMTP_PORT: undefined, ...o.env }
    const previous: Record<string, string | undefined> = {}
    for (const [k, v] of Object.entries(env)) {
        previous[k] = Deno.env.get(k)
        v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v)
    }

    const transports: { options: any; sent: any[] }[] = []
    const handler = createHandler(() => fake.client, (options) => {
        const t = { options, sent: [] as any[] }
        transports.push(t)
        return { sendMail: (m) => { t.sent.push(m); return Promise.resolve() } }
    })

    const log = [console.log, console.warn, console.error]
    console.log = console.warn = console.error = () => {}
    try {
        const res = await handler(new Request('http://x/mp-webhook', {
            method: o.method ?? 'POST',
            headers,
            body: (o.method ?? 'POST') === 'POST' ? rawBody : undefined,
        }))
        return { res, json: await res.json().catch(() => null), fake, fetched, transports }
    } finally {
        ;[console.log, console.warn, console.error] = log
        globalThis.fetch = original
        for (const [k, v] of Object.entries(previous)) v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v)
    }
}

const logStatuses = (fake: ReturnType<typeof createFakeSupabase>) =>
    fake.callsFor('webhooks_log_mp', 'update').map((c) => c.payload.status)

Deno.test('answers the CORS preflight', async () => {
    assertEquals((await call({ method: 'OPTIONS' })).res.status, 200)
})

Deno.test('rejects methods other than POST', async () => {
    const { res } = await call({ method: 'GET' })
    assertEquals(res.status, 405)
})

Deno.test('400 when the signature headers are missing', async () => {
    assertEquals((await call({ signature: null })).res.status, 400)
    assertEquals((await call({ requestId: null })).res.status, 400)
})

Deno.test('401 for a bad signature and nothing is logged or processed', async () => {
    const cases: Opts[] = [
        { signature: `ts=${TS},v1=${'0'.repeat(64)}` },
        { signature: `ts=${TS}` },
        { signature: `v1=${await sign('pay-1')}` },
        { signature: `ts=${TS},v1=${await sign('pay-1', 'other-secret')}` },
        { signature: `ts=${TS},v1=${await sign('pay-1', SECRET, 'other-request')}` },
        { signature: `ts=${TS},v1=${await sign('pay-1', SECRET, REQUEST_ID, '1')}` },
        { rawBody: 'not json' },
    ]
    for (const c of cases) {
        const r = await call(c)
        assertEquals(r.res.status, 401)
        assertEquals(r.fake.calls, [])
        assertEquals(r.fetched, [])
    }
})

Deno.test('a signature for another data.id is rejected (tampered body)', async () => {
    const forged = { id: 5, type: 'payment', data: { id: 'pay-OTHER' } }
    const r = await call({ rawBody: JSON.stringify(forged), signature: `ts=${TS},v1=${await sign('pay-1')}` })
    assertEquals(r.res.status, 401)
})

Deno.test('the signature uses the top-level id when data.id is absent', async () => {
    const r = await call({ body: { id: 'top-1', type: 'unknown_topic' } })
    assertEquals(r.res.status, 200)
})

Deno.test('500 when the initial log cannot be written, without processing the event', async () => {
    const r = await call({ extra: { 'webhooks_log_mp.insert': { error: new Error('db down') } } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'Failed to initialize webhook log')
    assertEquals(r.fetched, [])
})

Deno.test('payment events are processed and the log ends as success', async () => {
    const r = await call({ mp: { 'https://api.mercadopago.com/v1/payments/pay-1': { body: { id: 'pay-1', status: 'approved', metadata: { preapproval_id: 'pre-1' } } } } })
    assertEquals(r.res.status, 200)
    assertEquals(r.json, { received: true })
    assertEquals(r.fake.callsFor('profiles', 'update')[0].payload, { is_pro: true })
    assertEquals(r.fake.callsFor('webhooks_log_mp', 'insert')[0].payload.status, 'pending')
    assertEquals(logStatuses(r.fake), ['success'])
    assertEquals(r.fetched[0].init?.headers, { Authorization: 'Bearer tok' })
})

Deno.test('subscription_authorized_payment is routed like payment', async () => {
    const r = await call({
        body: { id: 6, type: 'subscription_authorized_payment', data: { id: 'pay-1' } },
        mp: { 'https://api.mercadopago.com/v1/payments/pay-1': { body: { id: 'pay-1', status: 'rejected', metadata: { preapproval_id: 'pre-1' } } } },
    })
    assertEquals(r.fake.callsFor('profiles', 'update')[0].payload, { is_pro: false })
})

Deno.test('the topic field is used when type is absent', async () => {
    const r = await call({
        body: { id: 7, topic: 'subscription_preapproval', data: { id: 'pre-1' } },
        mp: { 'https://api.mercadopago.com/preapproval/pre-1': { body: { id: 'pre-1', status: 'cancelled' } } },
    })
    assertEquals(r.fake.callsFor('subscriptions', 'update')[0].payload, { status: 'cancelled' })
})

Deno.test('claim events are routed to the claim handler', async () => {
    const r = await call({
        body: { id: 8, type: 'topic_claims_integration_wh', data: { id: 'claim-1' } },
        mp: { 'https://api.mercadopago.com/v1/claims/claim-1': { body: { status: 'opened', payments: [{ preapproval_id: 'pre-1' }] } } },
    })
    assertEquals(r.fake.callsFor('subscriptions', 'update')[0].payload, { status: 'payment_failed' })
})

Deno.test('unhandled topics are acknowledged without calling Mercado Pago', async () => {
    const r = await call({ body: { id: 9, type: 'merchant_order', data: { id: 'm-1' } } })
    assertEquals(r.res.status, 200)
    assertEquals(r.fetched, [])
    assertEquals(logStatuses(r.fake), ['success'])
})

Deno.test('a transient Mercado Pago failure is recorded on the billing event and answers 500 so Mercado Pago retries', async () => {
    const r = await call({ mp: { 'https://api.mercadopago.com/v1/payments/pay-1': { status: 500, body: {} } } })
    assertEquals(r.res.status, 500)
    assertEquals(r.fake.callsFor('subscription_billing_events', 'update').at(-1)!.payload.status, 'failed')
    assertEquals(logStatuses(r.fake), ['error'])
})

Deno.test('a permanent Mercado Pago failure is recorded on the billing event and answers 200 so Mercado Pago stops retrying', async () => {
    const r = await call({ mp: { 'https://api.mercadopago.com/v1/payments/pay-1': { status: 404, body: {} } } })
    assertEquals(r.res.status, 200)
    assertEquals(r.fake.callsFor('subscription_billing_events', 'update').at(-1)!.payload.status, 'failed')
    assertEquals(logStatuses(r.fake), ['success'])
})

const crash = { 'subscription_billing_events.insert': { error: { code: '42501', message: 'denied' } } }

Deno.test('an unexpected handler error marks the log as error, alerts by Resend and answers 500', async () => {
    const r = await call({ extra: crash, env: { RESEND_API_KEY: 'rk' } })
    assertEquals(r.res.status, 500)
    assertEquals(logStatuses(r.fake), ['error'])
    const mail = r.fetched.find((f) => f.url === 'https://api.resend.com/emails')!
    assertEquals((mail.init!.headers as Record<string, string>).Authorization, 'Bearer rk')
    const sent = JSON.parse(String(mail.init!.body))
    assertEquals(sent.subject, 'ERRO WEBHOOK MERCADO PAGO')
    assertEquals(sent.html.includes('log-1'), true)
    assertEquals(r.transports, [])
})

Deno.test('without a Resend key the alert goes through SMTP with the configured host and port', async () => {
    const r = await call({ extra: crash, env: { SMTP_HOST: 'smtp.local', SMTP_PORT: '465', SMTP_USER: 'u', SMTP_PASS: 'p' } })
    assertEquals(r.res.status, 500)
    assertEquals(r.transports.length, 1)
    assertEquals(r.transports[0].options, { host: 'smtp.local', port: 465, secure: true, auth: { user: 'u', pass: 'p' }, tls: { rejectUnauthorized: false } })
    assertEquals(r.transports[0].sent[0].subject, 'ERRO WEBHOOK MERCADO PAGO')
    assertEquals(r.fetched.some((f) => f.url.includes('resend')), false)
})

Deno.test('a failing alert does not change the 500 answer', async () => {
    const r = await call({ extra: crash, env: { RESEND_API_KEY: 'rk' }, resendOk: false })
    assertEquals(r.res.status, 500)
    assertEquals(r.json, { error: 'Webhook processing failed' })
})
