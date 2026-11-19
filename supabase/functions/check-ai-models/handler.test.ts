import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { buildAlertEmail, createHandler } from "./handler.ts"

const SERVICE_KEY = 'service-key'
const SETTINGS = [
    { feature: 'evaluate_challenge', models: ['good/model', 'expiring/model'] },
    { feature: 'evaluate_lesson_content', models: ['gone/model', 'broken/model', 'good/model'] },
]
const CATALOG = [
    { id: 'good/model', expiration_date: null },
    { id: 'expiring/model', expiration_date: '2026-12-31' },
    { id: 'broken/model', expiration_date: null },
]

type Opts = {
    token?: string | null
    role?: string
    settings?: unknown
    catalog?: unknown[] | 'down'
    brokenModels?: string[]
    alertEmails?: string[]
    admins?: { email: string }[]
    body?: Record<string, unknown>
    noKey?: boolean
    sendFails?: boolean
}

async function call(o: Opts = {}) {
    const fake = createFakeSupabase({
        'profiles.select': (c) => c.filters.some((f) => f[0] === 'maybeSingle' || f[1] === 'id')
            ? { data: { role: o.role ?? 'admin' } }
            : { data: o.admins ?? [{ email: 'admin@x.com' }] },
        'ai_model_settings.select': { data: o.settings ?? SETTINGS },
        'ai_alert_settings.select': { data: { emails: o.alertEmails ?? ['ops@x.com', 'dev@x.com'] } },
    })
    const client = {
        ...fake.client,
        auth: { getUser: () => Promise.resolve(o.token === 'bad'
            ? { data: { user: null }, error: new Error('bad') }
            : { data: { user: { id: 'u1' } }, error: null }) },
    }

    const sent: any[] = []
    const nodemailer = {
        createTransport: () => ({
            sendMail: (m: any) => o.sendFails ? Promise.reject(new Error('smtp down')) : (sent.push(m), Promise.resolve()),
        }),
    }

    const chatModels: string[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        const u = String(url)
        if (u.endsWith('/models')) {
            return Promise.resolve(o.catalog === 'down'
                ? new Response('x', { status: 503 })
                : new Response(JSON.stringify({ data: o.catalog ?? CATALOG })))
        }
        const body = JSON.parse(String(init?.body))
        chatModels.push(body.model)
        assertEquals(body.max_tokens, 16)
        return Promise.resolve(o.brokenModels?.includes(body.model)
            ? new Response('provider error', { status: 500 })
            : new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] })))
    }) as typeof fetch

    const keys = ['OPENROUTER_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']
    const before = keys.map((k) => Deno.env.get(k))
    Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY)
    Deno.env.delete('RESEND_API_KEY')
    if (o.noKey) Deno.env.delete('OPENROUTER_API_KEY')
    else Deno.env.set('OPENROUTER_API_KEY', 'or-key')
    const err = console.error
    console.error = () => {}
    try {
        const headers: Record<string, string> = {}
        if (o.token !== null) headers.Authorization = `Bearer ${o.token ?? SERVICE_KEY}`
        const res = await createHandler(() => client, nodemailer)(new Request('http://x/check-ai-models', {
            method: 'POST', headers, body: JSON.stringify(o.body ?? {}),
        }))
        return { res, json: await res.json().catch(() => null), sent, chatModels, fake }
    } finally {
        console.error = err
        globalThis.fetch = original
        keys.forEach((k, i) => before[i] === undefined ? Deno.env.delete(k) : Deno.env.set(k, before[i]!))
    }
}

Deno.test('401 without a token and 401 for an invalid session', async () => {
    assertEquals((await call({ token: null })).res.status, 401)
    assertEquals((await call({ token: 'bad' })).res.status, 401)
})

Deno.test('403 for a signed-in user who is not an admin', async () => {
    const r = await call({ token: 'user-jwt', role: 'student' })
    assertEquals(r.res.status, 403)
    assertEquals(r.chatModels.length, 0)
})

Deno.test('the cron job authenticates with the service role key', async () => {
    const r = await call()
    assertEquals(r.res.status, 200)
})

Deno.test('500 when the OpenRouter key is missing', async () => {
    assertEquals((await call({ noKey: true })).res.status, 500)
})

Deno.test('classifies removed, expiring, failing and healthy models, testing each model once', async () => {
    const r = await call({ brokenModels: ['broken/model'] })
    const byModel = (feature: string, model: string) => r.json.checks.find((c: any) => c.feature === feature && c.model === model)

    assertEquals(byModel('evaluate_challenge', 'good/model').status, 'ok')
    assertEquals(byModel('evaluate_challenge', 'expiring/model').status, 'expiring')
    assertEquals(byModel('evaluate_challenge', 'expiring/model').expiresAt, '2026-12-31')
    assertEquals(byModel('evaluate_lesson_content', 'gone/model').status, 'removed')
    assertEquals(byModel('evaluate_lesson_content', 'broken/model').status, 'failing')
    assertEquals(byModel('evaluate_lesson_content', 'good/model').status, 'ok')
    assertEquals([...r.chatModels].sort(), ['broken/model', 'expiring/model', 'good/model'])
})

Deno.test('emails every configured address when something is wrong', async () => {
    const r = await call()
    assertEquals(r.sent.length, 1)
    assertEquals(r.sent[0].to, 'ops@x.com, dev@x.com')
    assertStringIncludes(r.sent[0].html, 'gone/model')
    assertEquals(r.json.emailed, ['ops@x.com', 'dev@x.com'])
})

Deno.test('falls back to the admin profiles when no alert address is configured', async () => {
    const r = await call({ alertEmails: [] })
    assertEquals(r.sent[0].to, 'admin@x.com')
})

Deno.test('sends nothing when every model is healthy', async () => {
    const r = await call({ settings: [{ feature: 'evaluate_challenge', models: ['good/model'] }] })
    assertEquals(r.sent.length, 0)
    assertEquals(r.json.checks.map((c: any) => c.status), ['ok'])
})

Deno.test('notify: false reports the problems without sending an email', async () => {
    const r = await call({ body: { notify: false } })
    assert(r.json.checks.some((c: any) => c.status === 'removed'))
    assertEquals(r.sent.length, 0)
})

Deno.test('a failed email is reported but does not fail the check', async () => {
    const r = await call({ sendFails: true })
    assertEquals(r.res.status, 200)
    assertEquals(r.json.emailError, 'smtp down')
    assertEquals(r.json.emailed, [])
})

Deno.test('when the catalog is unreachable models are judged only by the test call', async () => {
    const r = await call({ catalog: 'down' })
    assertEquals(r.json.catalogAvailable, false)
    assertEquals(r.json.checks.find((c: any) => c.model === 'gone/model').status, 'ok')
})

Deno.test('the alert email escapes model names', () => {
    const { html, subject } = buildAlertEmail([
        { feature: 'evaluate_challenge', model: '<b>x</b>', status: 'removed', expiresAt: null, detail: null },
    ])
    assert(!html.includes('<b>x</b>'))
    assertEquals(subject, '[Semeando Devs] 1 modelo de IA com problema')
})
