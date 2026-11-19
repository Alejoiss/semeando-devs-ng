import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { createHandler } from "./handler.ts"

const USER = { id: 'teacher-1' }
const BODY = { lesson_id: 'l-1', title: 'Variáveis', description: 'Introdução', markdowns: ['# Um', '# Dois'] }

type Opts = {
    body?: Record<string, unknown>
    headers?: Record<string, string>
    method?: string
    user?: typeof USER | null
    role?: string
    lessonExists?: boolean
    count?: number | null
    countError?: unknown
    logError?: unknown
    openRouter?: { status?: number; body?: unknown; text?: string }
    noKey?: boolean
    models?: string[]
    failModels?: string[]
}

async function call(o: Opts = {}) {
    const fake = createFakeSupabase({
        'ai_usage_logs.select': o.countError ? { error: o.countError } : { count: o.count === undefined ? 0 : o.count },
        'ai_usage_logs.insert': o.logError ? { error: o.logError } : {},
        'ai_model_settings.select': o.models ? { data: { models: o.models } } : {},
        'profiles.select': { data: { role: o.role ?? 'teacher' } },
        'lessons.select': { data: o.lessonExists === false ? null : { id: 'l-1' } },
    })
    const user = o.user === undefined ? USER : o.user
    const client = {
        ...fake.client,
        auth: { getUser: () => Promise.resolve({ data: { user }, error: user ? null : new Error('bad') }) },
    }
    const handler = createHandler(() => client)

    const aiCalls: { url: string; headers: Headers; body: any }[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        const sent = JSON.parse(String(init?.body))
        aiCalls.push({ url: String(url), headers: new Headers(init?.headers), body: sent })
        if (o.failModels?.includes(sent.model)) return Promise.resolve(new Response('model gone', { status: 404 }))
        const r = o.openRouter ?? { body: { choices: [{ message: { content: 'Ótimo conteúdo.' } }] } }
        return Promise.resolve(new Response(r.text ?? JSON.stringify(r.body), { status: r.status ?? 200 }))
    }) as typeof fetch

    const before = Deno.env.get('OPENROUTER_API_KEY')
    if (o.noKey) Deno.env.delete('OPENROUTER_API_KEY')
    else Deno.env.set('OPENROUTER_API_KEY', 'or-key')
    const log = console.log
    const err = console.error
    console.log = () => {}
    console.error = () => {}
    try {
        const res = await handler(new Request('http://x/evaluate-lesson-content', {
            method: o.method ?? 'POST',
            headers: o.headers ?? { Authorization: 'Bearer t' },
            body: o.method === 'OPTIONS' ? undefined : JSON.stringify(o.body ?? BODY),
        }))
        return { res, json: await res.json().catch(() => null), fake, aiCalls }
    } finally {
        console.log = log
        console.error = err
        globalThis.fetch = original
        before === undefined ? Deno.env.delete('OPENROUTER_API_KEY') : Deno.env.set('OPENROUTER_API_KEY', before)
    }
}

Deno.test('answers the CORS preflight', async () => {
    const { res } = await call({ method: 'OPTIONS' })
    assertEquals(res.status, 200)
})

Deno.test('401 without an authorization header', async () => {
    const r = await call({ headers: {} })
    assertEquals(r.res.status, 401)
    assertEquals(r.aiCalls.length, 0)
})

Deno.test('500 when the OpenRouter key is not configured', async () => {
    const r = await call({ noKey: true })
    assertEquals(r.res.status, 500)
    assertStringIncludes(r.json.error, 'OpenRouter API Key')
})

Deno.test('401 when the token does not resolve to a user', async () => {
    const r = await call({ user: null })
    assertEquals(r.res.status, 401)
    assertEquals(r.aiCalls.length, 0)
})

Deno.test('400 for missing or malformed parameters, without calling the model', async () => {
    const bad: Record<string, unknown>[] = [
        { ...BODY, lesson_id: '' },
        { ...BODY, title: '' },
        { ...BODY, description: '' },
        { ...BODY, markdowns: undefined },
        { ...BODY, markdowns: [] },
        { ...BODY, markdowns: 'not an array' },
    ]
    for (const body of bad) {
        const r = await call({ body })
        assertEquals(r.res.status, 400)
        assertEquals(r.aiCalls.length, 0)
    }
})

Deno.test('counts only this user\'s evaluations of this lesson', async () => {
    const { fake } = await call()
    assertEquals(fake.callsFor('ai_usage_logs', 'select')[0].filters, [
        ['eq', 'user_id', 'teacher-1'],
        ['eq', 'action_type', 'evaluate_content'],
        ['eq', 'lesson_id', 'l-1'],
    ])
})

Deno.test('allows up to 3 evaluations per lesson, the fourth is refused with 429', async () => {
    assertEquals((await call({ count: 2 })).res.status, 200)
    const r = await call({ count: 3 })
    assertEquals(r.res.status, 429)
    assertStringIncludes(r.json.error, 'no máximo 3 vezes')
    assertEquals(r.aiCalls.length, 0)
    assertEquals(r.fake.callsFor('ai_usage_logs', 'insert').length, 0)
})

Deno.test('a null usage count does not block the evaluation', async () => {
    assertEquals((await call({ count: null })).res.status, 200)
})

Deno.test('500 when the usage cannot be counted, without calling the model', async () => {
    const r = await call({ countError: { message: 'rls' } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'Erro ao verificar limites de uso da IA')
    assertEquals(r.aiCalls.length, 0)
})

Deno.test('sends the title, the description and every markdown block to the model', async () => {
    const r = await call()
    assertEquals(r.aiCalls.length, 1)
    assertEquals(r.aiCalls[0].url, 'https://openrouter.ai/api/v1/chat/completions')
    assertEquals(r.aiCalls[0].headers.get('Authorization'), 'Bearer or-key')
    const [system, user] = r.aiCalls[0].body.messages
    assertEquals(system.role, 'system')
    assertEquals(user.content,
        'Título da Lição: Variáveis\nDescrição da Lição: Introdução\n\nConteúdos para avaliação:\n' +
        '--- BLOCO DE CONTEÚDO 1 ---\n# Um\n\n--- BLOCO DE CONTEÚDO 2 ---\n# Dois')
})

Deno.test('the system prompt forbids offering next steps, since the conversation does not continue', async () => {
    const r = await call()
    const [system] = r.aiCalls[0].body.messages
    assertStringIncludes(system.content, 'a conversa NÃO continua')
    assertStringIncludes(system.content, 'Se quiser, posso')
    assert(system.content.trimEnd().endsWith('de forma direta.'))
})

Deno.test('returns the model feedback and records the usage against the lesson', async () => {
    const r = await call()
    assertEquals(r.res.status, 200)
    assertEquals(r.json, { aiFeedback: 'Ótimo conteúdo.' })
    assertEquals(r.fake.callsFor('ai_usage_logs', 'insert')[0].payload, {
        user_id: 'teacher-1', action_type: 'evaluate_content', lesson_id: 'l-1', model: 'inclusionai/ring-2.6-1t',
    })
})

Deno.test('uses the configured models and falls back to the next one when a model is gone', async () => {
    const r = await call({ models: ['old/removed', 'new/working'], failModels: ['old/removed'] })
    assertEquals(r.aiCalls.map((c) => c.body.model), ['old/removed', 'new/working'])
    assertEquals(r.json, { aiFeedback: 'Ótimo conteúdo.' })
    assertEquals(r.fake.callsFor('ai_usage_logs', 'insert')[0].payload.model, 'new/working')
})

Deno.test('500 with the last error when every configured model fails', async () => {
    const r = await call({ models: ['a/one', 'b/two'], failModels: ['a/one', 'b/two'] })
    assertEquals(r.aiCalls.length, 2)
    assertEquals(r.res.status, 500)
    assertStringIncludes(r.json.error, 'model gone')
    assertEquals(r.fake.callsFor('ai_usage_logs', 'insert').length, 0)
})

Deno.test('an empty model answer becomes a placeholder', async () => {
    const r = await call({ openRouter: { body: { choices: [] } } })
    assertEquals(r.json.aiFeedback, 'Não foi possível extrair o feedback.')
})

Deno.test('a model failure is reported with its message and does not use up an evaluation', async () => {
    const r = await call({ openRouter: { status: 502, text: 'bad gateway' } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'OpenRouter call failed: bad gateway')
    assertEquals(r.fake.callsFor('ai_usage_logs', 'insert').length, 0)
})

Deno.test('a failure to log usage does not fail the request', async () => {
    const r = await call({ logError: { message: 'rls' } })
    assertEquals(r.res.status, 200)
    assertEquals(r.json.aiFeedback, 'Ótimo conteúdo.')
})

Deno.test('500 with the message when the body is not valid JSON', async () => {
    const handler = createHandler(() => ({
        ...createFakeSupabase({ 'profiles.select': { data: { role: 'teacher' } } }).client,
        auth: { getUser: () => Promise.resolve({ data: { user: USER }, error: null }) },
    }))
    const before = Deno.env.get('OPENROUTER_API_KEY')
    Deno.env.set('OPENROUTER_API_KEY', 'or-key')
    const err = console.error
    console.error = () => {}
    try {
        const res = await handler(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer t' }, body: '{oops' }))
        assertEquals(res.status, 500)
    } finally {
        console.error = err
        before === undefined ? Deno.env.delete('OPENROUTER_API_KEY') : Deno.env.set('OPENROUTER_API_KEY', before)
    }
})

Deno.test('only teachers and admins may use the AI content review', async () => {
    for (const role of ['student', undefined]) {
        const r = await call({ role: role ?? 'x' })
        assertEquals(r.res.status, 403)
        assertEquals(r.aiCalls.length, 0)
    }
    assertEquals((await call({ role: 'admin' })).res.status, 200)
})

Deno.test('the per-lesson limit cannot be sidestepped by sending arbitrary lesson ids', async () => {
    const r = await call({ lessonExists: false, body: { ...BODY, lesson_id: 'not-a-real-lesson' } })
    assertEquals(r.res.status, 404)
    assertEquals(r.aiCalls.length, 0)
    assertEquals(r.fake.callsFor('ai_usage_logs').length, 0)
})
