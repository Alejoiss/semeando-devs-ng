import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1"
import { FakeTime } from "jsr:@std/testing@1/time"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { buildDefaultHtml, createHandler, renderHtml, renderText } from "./handler.ts"

const ADMIN = { id: 'admin-1' }
const NEWSLETTER = {
    id: 'nl-1',
    subject: 'Assunto',
    body: 'Olá{{nome_virgula}}!\nNovidade.',
    html: null as string | null,
    cta_url: null as string | null,
    cta_label: null as string | null,
}
const person = (n: number, name: string | null = `Pessoa ${n}`) => ({ id: `u${n}`, email: `u${n}@example.com`, name })

type Sent = { to: string; subject: string; html: string; text: string; from: string }

type Opts = {
    body?: Record<string, unknown>
    headers?: Record<string, string>
    method?: string
    user?: typeof ADMIN | null
    role?: string | null
    newsletter?: unknown
    profiles?: unknown[] | ((from: number) => unknown[])
    alreadySent?: { user_id: string }[]
    sendFails?: (to: string) => boolean
    resendStatus?: (to: string) => number
    env?: Record<string, string | undefined>
    extra?: Parameters<typeof createFakeSupabase>[0]
}

async function call(o: Opts = {}) {
    const profiles = o.profiles ?? []
    const fake = createFakeSupabase({
        'profiles.select': (c) => {
            if (c.filters.some((f) => f[0] === 'maybeSingle' || (f[0] === 'eq' && f[1] === 'id'))) {
                return { data: o.role === null ? null : { role: o.role ?? 'admin' } }
            }
            const range = c.filters.find((f) => f[0] === 'range')
            const from = range ? Number(range[1]) : 0
            return { data: typeof profiles === 'function' ? profiles(from) : profiles.slice(from, from + 1000) }
        },
        'newsletter.select': { data: o.newsletter === undefined ? NEWSLETTER : o.newsletter },
        'user_newsletter.select': { data: o.alreadySent ?? [] },
        'user_newsletter.upsert': {},
        ...o.extra,
    })
    const user = o.user === undefined ? ADMIN : o.user
    const client = {
        ...fake.client,
        auth: { getUser: () => Promise.resolve({ data: { user }, error: user ? null : new Error('bad') }) },
    }

    const sent: Sent[] = []
    const transports: any[] = []
    const mailer = {
        createTransport: (options: unknown) => {
            transports.push(options)
            return {
                sendMail: (mail: Sent) => {
                    if (o.sendFails?.(mail.to)) return Promise.reject(new Error('smtp refused'))
                    sent.push(mail)
                    return Promise.resolve({})
                },
            }
        },
    }
    const handler = createHandler(() => client, mailer)

    const resendCalls: { headers: Headers; body: any }[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body))
        resendCalls.push({ headers: new Headers(init?.headers), body })
        const status = o.resendStatus?.(body.to) ?? 200
        if (status === 200) sent.push(body)
        return Promise.resolve(new Response(status === 200 ? '{}' : 'rejected', { status }))
    }) as typeof fetch

    const env = {
        SUPABASE_URL: 'http://db', SUPABASE_SERVICE_ROLE_KEY: 'key',
        RESEND_API_KEY: undefined, SMTP_HOST: undefined, SMTP_PORT: undefined, SMTP_USER: undefined, SMTP_PASS: undefined, SMTP_SENDER: undefined,
        ...o.env,
    }
    const before = Object.fromEntries(Object.keys(env).map((k) => [k, Deno.env.get(k)]))
    for (const [k, v] of Object.entries(env)) v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v)
    const log = console.log
    const err = console.error
    console.log = () => {}
    console.error = () => {}
    const time = new FakeTime()
    try {
        const pending = handler(new Request('http://x/dispatch-newsletter', {
            method: o.method ?? 'POST',
            headers: o.headers ?? { Authorization: 'Bearer admin-token' },
            body: o.method === 'OPTIONS' ? undefined : JSON.stringify(o.body ?? { newsletter_id: 'nl-1' }),
        }))
        let done = false
        pending.finally(() => { done = true }).catch(() => {})
        while (!done) await time.tickAsync(1000)
        const res = await pending
        return { res, json: await res.json().catch(() => null), fake, sent, transports, resendCalls }
    } finally {
        time.restore()
        console.log = log
        console.error = err
        globalThis.fetch = original
        for (const [k, v] of Object.entries(before)) v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v!)
    }
}

const upserted = (r: Awaited<ReturnType<typeof call>>) => r.fake.callsFor('user_newsletter', 'upsert')[0]?.payload

Deno.test('answers the CORS preflight', async () => {
    const { res } = await call({ method: 'OPTIONS' })
    assertEquals(res.status, 200)
})

Deno.test('401 without a token or with an invalid one', async () => {
    assertEquals((await call({ headers: {} })).res.status, 401)
    assertEquals((await call({ user: null })).res.status, 401)
})

Deno.test('403 for a caller that is not an admin, and nothing is sent', async () => {
    for (const role of ['student', 'teacher', null]) {
        const { res, sent } = await call({ role, profiles: [person(1)] })
        assertEquals(res.status, 403)
        assertEquals(sent.length, 0)
    }
})

Deno.test('400 when neither a newsletter id nor a test draft is given', async () => {
    const { res, json } = await call({ body: {} })
    assertEquals(res.status, 400)
    assertEquals(json.error, 'newsletter_id is required')
})

Deno.test('404 when the newsletter does not exist', async () => {
    const { res } = await call({ newsletter: null })
    assertEquals(res.status, 404)
})

Deno.test('sends to every active subscriber over SMTP and records each delivery', async () => {
    const r = await call({ profiles: [person(1), person(2)] })
    assertEquals(r.json, { success: true, sent_count: 2, failed_count: 0, remaining: 0 })
    assertEquals(r.sent.map((m) => m.to), ['u1@example.com', 'u2@example.com'])
    assertEquals(upserted(r), [
        { user_id: 'u1', newsletter_id: 'nl-1', email_sent: true },
        { user_id: 'u2', newsletter_id: 'nl-1', email_sent: true },
    ])
})

Deno.test('only active profiles with an email are queried', async () => {
    const { fake } = await call({ profiles: [person(1)] })
    const filters = fake.callsFor('profiles', 'select').find((c) => c.filters.some((f) => f[0] === 'range'))!.filters
    assert(filters.some((f) => f[0] === 'eq' && f[1] === 'newsletter_active' && f[2] === true))
    assert(filters.some((f) => f[0] === 'not' && f[1] === 'email'))
})

Deno.test('skips profiles that already received this newsletter', async () => {
    const r = await call({ profiles: [person(1), person(2), person(3)], alreadySent: [{ user_id: 'u1' }, { user_id: 'u3' }] })
    assertEquals(r.sent.map((m) => m.to), ['u2@example.com'])
    assertEquals(r.json.remaining, 0)
})

Deno.test('only already-sent rows of this newsletter count as delivered', async () => {
    const { fake } = await call({ profiles: [person(1)] })
    const c = fake.callsFor('user_newsletter', 'select')[0]
    assertEquals(c.filters, [['eq', 'newsletter_id', 'nl-1'], ['eq', 'email_sent', true]])
})

Deno.test('does nothing and writes nothing when everyone already received it', async () => {
    const r = await call({ profiles: [person(1)], alreadySent: [{ user_id: 'u1' }] })
    assertEquals(r.json, { success: true, sent_count: 0, failed_count: 0, remaining: 0 })
    assertEquals(r.fake.callsFor('user_newsletter', 'upsert').length, 0)
})

Deno.test('respects max_per_run and reports how many are left', async () => {
    const r = await call({ profiles: [person(1), person(2), person(3)], body: { newsletter_id: 'nl-1', max_per_run: 2 } })
    assertEquals(r.sent.length, 2)
    assertEquals(r.json, { success: true, sent_count: 2, failed_count: 0, remaining: 1 })
})

Deno.test('falls back to the default batch size of 200 for a missing or invalid max_per_run', async () => {
    const many = Array.from({ length: 205 }, (_, i) => person(i))
    for (const max_per_run of [undefined, 0, -5, 1.5, 'x']) {
        const r = await call({ profiles: many, body: { newsletter_id: 'nl-1', max_per_run } })
        assertEquals(r.json.sent_count, 200)
        assertEquals(r.json.remaining, 5)
    }
})

Deno.test('reads the subscriber list page by page', async () => {
    const r = await call({
        profiles: (from) => from === 0 ? Array.from({ length: 1000 }, (_, i) => person(i)) : [person(1000), person(1001)],
        body: { newsletter_id: 'nl-1', max_per_run: 5000 },
    })
    assertEquals(r.json.sent_count, 1002)
    const ranges = r.fake.callsFor('profiles', 'select').flatMap((c) => c.filters.filter((f) => f[0] === 'range'))
    assertEquals(ranges, [['range', 0, 999], ['range', 1000, 1999]])
})

Deno.test('a failed delivery is counted, recorded as not sent, and does not stop the others', async () => {
    const r = await call({ profiles: [person(1), person(2), person(3)], sendFails: (to) => to === 'u2@example.com' })
    assertEquals(r.json, { success: true, sent_count: 2, failed_count: 1, remaining: 0 })
    assertEquals(upserted(r).map((x: any) => [x.user_id, x.email_sent]), [['u1', true], ['u2', false], ['u3', true]])
})

Deno.test('500 when the already-sent lookup or the subscriber query fails', async () => {
    const a = await call({ profiles: [person(1)], extra: { 'user_newsletter.select': { error: new Error('sent lookup failed') } } })
    assertEquals(a.res.status, 500)
    assertEquals(a.json.error, 'sent lookup failed')
    assertEquals(a.sent.length, 0)

    const b = await call({
        extra: { 'profiles.select': (c) => c.filters.some((f) => f[0] === 'range') ? { error: new Error('profiles down') } : { data: { role: 'admin' } } },
    })
    assertEquals(b.res.status, 500)
    assertEquals(b.json.error, 'profiles down')
})

Deno.test('500 when the delivery records cannot be saved', async () => {
    const r = await call({ profiles: [person(1)], extra: { 'user_newsletter.upsert': { error: new Error('insert failed') } } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'insert failed')
})

Deno.test('SMTP transport: local defaults without configuration, TLS only on port 465, auth only with credentials', async () => {
    const a = await call({ profiles: [person(1)] })
    assertEquals(a.transports[0].host, 'host.docker.internal')
    assertEquals(a.transports[0].port, 54325)
    assertEquals(a.transports[0].secure, false)
    assertEquals(a.transports[0].auth, undefined)
    assertEquals(a.sent[0].from, 'Semeando Devs <noreply@semeandodevs.com.br>')

    const b = await call({
        profiles: [person(1)],
        env: { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_USER: 'me', SMTP_PASS: 'pw', SMTP_SENDER: 'Eu <eu@example.com>' },
    })
    assertEquals(b.transports[0].host, 'smtp.example.com')
    assertEquals(b.transports[0].secure, true)
    assertEquals(b.transports[0].auth, { user: 'me', pass: 'pw' })
    assertEquals(b.sent[0].from, 'Eu <eu@example.com>')
})

Deno.test('Resend: used instead of SMTP when the API key is set, with the bearer key', async () => {
    const r = await call({ profiles: [person(1)], env: { RESEND_API_KEY: 're_123' } })
    assertEquals(r.transports.length, 0)
    assertEquals(r.resendCalls.length, 1)
    assertEquals(r.resendCalls[0].headers.get('Authorization'), 'Bearer re_123')
    assertEquals(r.resendCalls[0].body.to, 'u1@example.com')
    assertEquals(r.resendCalls[0].body.subject, 'Assunto')
    assertEquals(r.json.sent_count, 1)
})

Deno.test('Resend: a rejected email counts as failed and stays pending', async () => {
    const r = await call({
        profiles: [person(1), person(2)],
        env: { RESEND_API_KEY: 're_123' },
        resendStatus: (to) => to === 'u1@example.com' ? 422 : 200,
    })
    assertEquals(r.json, { success: true, sent_count: 1, failed_count: 1, remaining: 0 })
    assertEquals(upserted(r).map((x: any) => x.email_sent), [false, true])
})

Deno.test('uses a default subject when the newsletter has none', async () => {
    const r = await call({ profiles: [person(1)], newsletter: { ...NEWSLETTER, subject: null } })
    assertEquals(r.sent[0].subject, 'Novidades do Semeando Devs!')
})

Deno.test('personalizes the greeting with the first name only, and drops it when there is no name', async () => {
    const r = await call({ profiles: [person(1, 'Maria da Silva'), person(2, null), person(3, '   ')] })
    assertEquals(r.sent[0].text.startsWith('Olá, Maria!'), true)
    assertStringIncludes(r.sent[0].html, 'Olá, Maria!')
    assertEquals(r.sent[1].text.startsWith('Olá!'), true)
    assertEquals(r.sent[2].text.startsWith('Olá!'), true)
})

Deno.test('escapes the recipient name inside the HTML but not inside the plain text', async () => {
    const r = await call({ profiles: [person(1, '<b>Zé</b>')] })
    assertStringIncludes(r.sent[0].html, '&lt;b&gt;Zé&lt;/b&gt;')
    assertEquals(r.sent[0].html.includes('<b>Zé</b>'), false)
})

Deno.test('test mode sends one email to the given address, records nothing and ignores subscribers', async () => {
    const r = await call({ body: { newsletter_id: 'nl-1', test_email: 'me@example.com' }, profiles: [person(1), person(2)] })
    assertEquals(r.json, { success: true, test: true, to: 'me@example.com' })
    assertEquals(r.sent.map((m) => m.to), ['me@example.com'])
    assertStringIncludes(r.sent[0].html, 'Olá, Teste!')
    assertEquals(r.fake.callsFor('user_newsletter').length, 0)
})

Deno.test('test mode can send an unsaved draft without reading the newsletter table', async () => {
    const r = await call({
        body: { test_email: 'me@example.com', draft: { subject: 'Rascunho', body: 'Texto', html: '<p>Oi{{nome_virgula}}</p>', cta_url: null, cta_label: null } },
    })
    assertEquals(r.res.status, 200)
    assertEquals(r.sent[0].subject, 'Rascunho')
    assertEquals(r.sent[0].html, '<p>Oi, Teste</p>')
    assertEquals(r.fake.callsFor('newsletter').length, 0)
})

Deno.test('a draft is ignored outside test mode, which then requires a newsletter id', async () => {
    const r = await call({ body: { draft: { body: 'x' } } })
    assertEquals(r.res.status, 400)
})

Deno.test('test mode surfaces a delivery failure as a 500', async () => {
    const r = await call({ body: { newsletter_id: 'nl-1', test_email: 'me@example.com' }, sendFails: () => true })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'smtp refused')
})

Deno.test('buildDefaultHtml keeps line breaks, adds the CTA button and escapes its attributes', () => {
    const html = buildDefaultHtml({ ...NEWSLETTER, body: 'a\nb', cta_url: 'https://x.com/?a=1&b="2"', cta_label: 'Veja <agora>' })
    assertStringIncludes(html, 'a<br>b')
    assertStringIncludes(html, 'href="https://x.com/?a=1&amp;b=&quot;2&quot;"')
    assertStringIncludes(html, 'Veja &lt;agora&gt;')
})

Deno.test('buildDefaultHtml omits the button without a CTA url and labels it "Acesse" without a label', () => {
    assertEquals(buildDefaultHtml(NEWSLETTER).includes('<a href'), false)
    assertStringIncludes(buildDefaultHtml({ ...NEWSLETTER, cta_url: 'https://x.com' }), 'Acesse')
})

Deno.test('renderHtml sends a designed html as is, without the default card', () => {
    const html = renderHtml({ ...NEWSLETTER, html: '<h1>Oi{{nome_virgula}}</h1>' }, person(1, 'Ana Maria'))
    assertEquals(html, '<h1>Oi, Ana</h1>')
})

Deno.test('renderText appends the CTA as a line of text', () => {
    assertEquals(renderText({ ...NEWSLETTER, body: 'Oi', cta_url: 'https://x.com', cta_label: 'Veja' }, person(1)), 'Oi\n\nVeja: https://x.com')
    assertEquals(renderText({ ...NEWSLETTER, body: 'Oi', cta_url: 'https://x.com' }, person(1)), 'Oi\n\nAcesse: https://x.com')
})

Deno.test('renderText turns an HTML body into readable plain text', () => {
    const text = renderText({ ...NEWSLETTER, body: '<p>Primeiro</p><p>Segundo&nbsp;item<br>fim</p><ul><li>um</li></ul>' }, person(1))
    assertEquals(text, 'Primeiro\nSegundo item\nfim\num')
})

Deno.test({
    ignore: true,
    name: 'recipients whose delivery keeps failing must not block the queue behind them (finding newsletter-failed-recipients-block-queue)',
    fn: async () => {
        const people = [person(1), person(2), person(3)]
        const records: { user_id: string; email_sent: boolean }[] = []
        const state = {
            'user_newsletter.select': () => ({ data: records.filter((r) => r.email_sent).map((r) => ({ user_id: r.user_id }) ) }),
            'user_newsletter.upsert': (c: { payload?: typeof records }) => {
                records.push(...(c.payload ?? []))
                return {}
            },
        }
        const body = { newsletter_id: 'nl-1', max_per_run: 1 }
        const opts = { profiles: people, body, sendFails: (to: string) => to === 'u1@example.com', extra: state }
        await call(opts)
        const second = await call(opts)
        assertEquals(second.sent.map((m) => m.to), ['u2@example.com'])
    },
})
