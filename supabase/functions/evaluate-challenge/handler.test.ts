import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1"
import { FakeTime } from "jsr:@std/testing@1/time"
import { createFakeSupabase, type Call } from "../_testing/fake-supabase.ts"
import { createHandler } from "./handler.ts"

const USER = { id: 'user-1' }
const NOW = '2026-03-10T15:00:00Z'
const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions'
const BODY = { lessonId: 'l-1', description: 'Some um e um', code: 'const r = 1 + 1', initial_code: '// start' }

type Resolvers = Parameters<typeof createFakeSupabase>[0]

type Opts = {
    body?: Record<string, unknown>
    headers?: Record<string, string>
    method?: string
    user?: typeof USER | null
    isPro?: boolean
    profileError?: unknown
    usageCount?: number | null
    usageError?: unknown
    logError?: unknown
    lesson?: { sub_module_id: string; xp: number; type: string } | null
    lessonError?: unknown
    progress?: { data?: unknown; error?: unknown }
    subModuleLessons?: { id: string }[]
    completedLessons?: { lesson_id: string }[]
    moduleSubModules?: { id: string }[]
    completedSubModules?: { sub_module_id: string }[]
    openRouter?: { status?: number; body?: unknown } | 'missing'
    models?: string[] | null
    failModels?: string[]
    now?: string
    userExtra?: Resolvers
    extra?: Resolvers
}

const filterValue = (c: Call, name: string, column?: string) =>
    c.filters.find((f) => f[0] === name && (column === undefined || f[1] === column))

async function call(o: Opts = {}) {
    const userFake = createFakeSupabase({
        'profiles.select': o.profileError ? { error: o.profileError } : { data: { is_pro: o.isPro ?? false } },
        'ai_usage_logs.select': o.usageError ? { error: o.usageError } : { count: o.usageCount === undefined ? 0 : o.usageCount },
        'ai_usage_logs.insert': o.logError ? { error: o.logError } : {},
        'ai_model_settings.select': o.models === null ? { error: { message: 'boom' } } : o.models ? { data: { models: o.models } } : {},
        ...o.userExtra,
    })
    const user = o.user === undefined ? USER : o.user
    const userClient = {
        ...userFake.client,
        auth: { getUser: () => Promise.resolve({ data: { user }, error: user ? null : new Error('bad') }) },
    }

    const svc = createFakeSupabase({
        'lessons.select': (c) => {
            if (filterValue(c, 'eq', 'sub_module_id')) return { data: o.subModuleLessons ?? [{ id: 'l-1' }, { id: 'l-2' }] }
            if (o.lessonError) return { error: o.lessonError }
            return { data: o.lesson === undefined ? { sub_module_id: 'sm-1', xp: 50, type: 'CHALLENGE' } : o.lesson }
        },
        'user_lessons.select': (c) => filterValue(c, 'in')
            ? { data: o.completedLessons ?? [{ lesson_id: 'l-1' }] }
            : o.progress ?? { data: null, error: { code: 'PGRST116' } },
        'submodules.select': (c) => filterValue(c, 'eq', 'module_id')
            ? { data: o.moduleSubModules ?? [{ id: 'sm-1' }, { id: 'sm-2' }] }
            : { data: { module_id: 'mod-1' } },
        'user_submodules.select': { data: o.completedSubModules ?? [{ sub_module_id: 'sm-1' }] },
        'xp.select': { data: null, error: { code: 'PGRST116' } },
        'xp_week.select': { data: null, error: { code: 'PGRST116' } },
        'xp_month.select': { data: null, error: { code: 'PGRST116' } },
        ...o.extra,
    })

    let n = 0
    const clients = [userClient, svc.client]
    const handler = createHandler(() => clients[n++] ?? svc.client)

    const aiCalls: { headers: Headers; body: any }[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit) => {
        const sent = JSON.parse(String(init?.body))
        aiCalls.push({ headers: new Headers(init?.headers), body: sent })
        if (o.failModels?.includes(sent.model)) return Promise.resolve(new Response('model gone', { status: 404 }))
        const r = o.openRouter === 'missing' || !o.openRouter
            ? { body: { choices: [{ message: { content: 'Bom trabalho!' } }] } }
            : o.openRouter
        return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status ?? 200 }))
    }) as typeof fetch

    const envBefore = Deno.env.get('OPENROUTER_API_KEY')
    if (o.openRouter === 'missing') Deno.env.delete('OPENROUTER_API_KEY')
    else Deno.env.set('OPENROUTER_API_KEY', 'or-key')
    const err = console.error
    console.error = () => {}
    const time = new FakeTime(new Date(o.now ?? NOW))
    try {
        const res = await handler(new Request('http://x/evaluate-challenge', {
            method: o.method ?? 'POST',
            headers: o.headers ?? { Authorization: 'Bearer t' },
            body: o.method === 'OPTIONS' ? undefined : JSON.stringify(o.body ?? BODY),
        }))
        return { res, json: await res.json().catch(() => null), userFake, svc, aiCalls }
    } finally {
        time.restore()
        console.error = err
        globalThis.fetch = original
        envBefore === undefined ? Deno.env.delete('OPENROUTER_API_KEY') : Deno.env.set('OPENROUTER_API_KEY', envBefore)
    }
}

const writes = (r: Awaited<ReturnType<typeof call>>) =>
    r.svc.calls.filter((c) => c.op !== 'select').map((c) => `${c.table}.${c.op}`)

Deno.test('answers the CORS preflight', async () => {
    const { res } = await call({ method: 'OPTIONS' })
    assertEquals(res.status, 200)
})

Deno.test('a request without authorization is refused before anything is read, called or written', async () => {
    const r = await call({ headers: {} })
    assert(r.res.status >= 400)
    assertEquals(r.aiCalls.length, 0)
    assertEquals(r.svc.calls.length, 0)
})

Deno.test('an invalid token is refused before the AI is called or anything is written', async () => {
    const r = await call({ user: null })
    assert(r.res.status >= 400)
    assertEquals(r.aiCalls.length, 0)
    assertEquals(r.svc.calls.length, 0)
})

Deno.test('400 when lessonId, description or code is missing', async () => {
    for (const missing of ['lessonId', 'description', 'code']) {
        const r = await call({ body: { ...BODY, [missing]: '' } })
        assertEquals(r.res.status, 400)
        assertEquals(r.aiCalls.length, 0)
    }
})

Deno.test('500 when the profile cannot be read', async () => {
    const r = await call({ profileError: { message: 'rls' } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'Erro ao buscar perfil do usuário')
    assertEquals(r.aiCalls.length, 0)
})

Deno.test('500 when the daily usage cannot be counted', async () => {
    const r = await call({ usageError: { message: 'rls' } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'Erro ao verificar limites de uso da IA')
    assertEquals(r.aiCalls.length, 0)
})

Deno.test('free users get 5 submissions a day', async () => {
    assertEquals((await call({ usageCount: 4 })).res.status, 200)
    const r = await call({ usageCount: 5 })
    assertEquals(r.res.status, 429)
    assertStringIncludes(r.json.error, '5 vezes por dia')
    assertEquals(r.aiCalls.length, 0)
    assertEquals(r.svc.calls.length, 0)
})

Deno.test('PRO users get 30 submissions a day', async () => {
    assertEquals((await call({ isPro: true, usageCount: 29 })).res.status, 200)
    const r = await call({ isPro: true, usageCount: 30 })
    assertEquals(r.res.status, 429)
    assertStringIncludes(r.json.error, '30 vezes por dia')
})

Deno.test('a null usage count does not block the submission', async () => {
    assertEquals((await call({ usageCount: null })).res.status, 200)
})

Deno.test('the limit counts only this user\'s code submissions since midnight in Brasília', async () => {
    const r = await call({ now: '2026-03-10T15:00:00Z' })
    const filters = r.userFake.callsFor('ai_usage_logs', 'select')[0].filters
    assertEquals(filters, [
        ['eq', 'user_id', 'user-1'],
        ['eq', 'action_type', 'submit_code'],
        ['gte', 'created_at', '2026-03-10T03:00:00.000Z'],
    ])
})

Deno.test('the daily window still belongs to the previous Brasília day until 03:00 UTC', async () => {
    const before = await call({ now: '2026-03-10T02:59:00Z' })
    assertEquals(filterValue(before.userFake.callsFor('ai_usage_logs', 'select')[0], 'gte')![2], '2026-03-09T03:00:00.000Z')
    const after = await call({ now: '2026-03-10T03:00:00Z' })
    assertEquals(filterValue(after.userFake.callsFor('ai_usage_logs', 'select')[0], 'gte')![2], '2026-03-10T03:00:00.000Z')
})

Deno.test('asks the model with the problem, the starting code and the student code', async () => {
    const r = await call()
    assertEquals(r.aiCalls.length, 1)
    assertEquals(r.aiCalls[0].headers.get('Authorization'), 'Bearer or-key')
    const [system, user] = r.aiCalls[0].body.messages
    assertEquals(system.role, 'system')
    assertStringIncludes(user.content, 'Some um e um')
    assertStringIncludes(user.content, '// start')
    assertStringIncludes(user.content, 'const r = 1 + 1')
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
    assertEquals(r.json.aiFeedback, 'Bom trabalho!')
    assertEquals(r.userFake.callsFor('ai_usage_logs', 'insert')[0].payload, { user_id: 'user-1', action_type: 'submit_code', lesson_id: 'l-1', model: 'openai/gpt-5-nano' })
})

Deno.test('an empty model answer becomes a placeholder and still counts as usage', async () => {
    const r = await call({ openRouter: { body: { choices: [] } } })
    assertEquals(r.json.aiFeedback, 'Feedback gerado indisponível.')
    assertEquals(r.userFake.callsFor('ai_usage_logs', 'insert').length, 1)
})

Deno.test('a model failure does not use up the daily allowance, but the challenge is still completed', async () => {
    const r = await call({ openRouter: { status: 500, body: { error: 'down' } } })
    assertEquals(r.res.status, 200)
    assertEquals(r.json.aiFeedback, 'Não foi possível gerar o feedback no momento.')
    assertEquals(r.userFake.callsFor('ai_usage_logs', 'insert').length, 0)
    assertEquals(r.svc.callsFor('user_lessons', 'upsert')[0].payload.completed, true)
})

Deno.test('uses the configured models and falls back to the next one when a model is gone', async () => {
    const r = await call({ models: ['old/removed', 'new/working'], failModels: ['old/removed'] })
    assertEquals(r.aiCalls.map((c) => c.body.model), ['old/removed', 'new/working'])
    assertEquals(r.json.aiFeedback, 'Bom trabalho!')
    assertEquals(r.userFake.callsFor('ai_usage_logs', 'insert')[0].payload.model, 'new/working')
})

Deno.test('when every configured model fails the challenge is still completed and nothing is logged as usage', async () => {
    const r = await call({ models: ['a/one', 'b/two'], failModels: ['a/one', 'b/two'] })
    assertEquals(r.aiCalls.length, 2)
    assertEquals(r.json.aiFeedback, 'Não foi possível gerar o feedback no momento.')
    assertEquals(r.userFake.callsFor('ai_usage_logs', 'insert').length, 0)
})

Deno.test('uses the default model when the settings cannot be read', async () => {
    const r = await call({ models: null })
    assertEquals(r.aiCalls.map((c) => c.body.model), ['openai/gpt-5-nano'])
})

Deno.test('without the OpenRouter key no model call is made and nothing is logged as usage', async () => {
    const r = await call({ openRouter: 'missing' })
    assertEquals(r.aiCalls.length, 0)
    assertEquals(r.json.aiFeedback, 'Configuração do agente de IA ausente.')
    assertEquals(r.userFake.callsFor('ai_usage_logs', 'insert').length, 0)
})

Deno.test('a failure to log usage does not fail the request', async () => {
    const r = await call({ logError: { message: 'rls' } })
    assertEquals(r.res.status, 200)
})

Deno.test('500 when the lesson does not load, before any write', async () => {
    const r = await call({ lessonError: { message: 'not found' } })
    assertEquals(r.res.status, 500)
    assertEquals(writes(r), [])
})

Deno.test('saves the submitted code and the feedback on the lesson progress', async () => {
    const r = await call()
    const up = r.svc.callsFor('user_lessons', 'upsert')[0].payload
    assertEquals(up.user_id, 'user-1')
    assertEquals(up.lesson_id, 'l-1')
    assertEquals(up.completed, true)
    assertEquals(up.completed_at, '2026-03-10T15:00:00.000Z')
    assertEquals(up.saved_code, 'const r = 1 + 1')
    assertEquals(up.submitted_code, 'const r = 1 + 1')
    assertEquals(up.ai_feedback, 'Bom trabalho!')
})

Deno.test('500 when reading the progress fails with anything but "no rows"', async () => {
    const r = await call({ progress: { error: { code: '42501', message: 'denied' } } })
    assertEquals(r.res.status, 500)
    assertEquals(writes(r), [])
})

Deno.test('the first completion awards the lesson XP to the total, the week and the month', async () => {
    const r = await call()
    assertEquals(r.json.xpAwarded, 50)
    assertEquals(r.svc.callsFor('xp_log', 'insert')[0].payload, { user_id: 'user-1', amount: 50, reason: 'CHALLENGE' })
    assertEquals(r.svc.callsFor('xp', 'insert')[0].payload, { user_id: 'user-1', total_xp: 50 })
    assertEquals(r.svc.callsFor('xp_week', 'insert')[0].payload, { user_id: 'user-1', week: 11, year: 2026, xp_amount: 50 })
    assertEquals(r.svc.callsFor('xp_month', 'insert')[0].payload, { user_id: 'user-1', month: 3, year: 2026, xp_amount: 50 })
})

Deno.test('adds to the existing XP totals instead of replacing them', async () => {
    const r = await call({
        extra: {
            'xp.select': { data: { id: 'x1', total_xp: 100 } },
            'xp_week.select': { data: { id: 'w1', xp_amount: 20 } },
            'xp_month.select': { data: { id: 'm1', xp_amount: 70 } },
        },
    })
    assertEquals(r.svc.callsFor('xp', 'update')[0].payload, { total_xp: 150 })
    assertEquals(r.svc.callsFor('xp_week', 'update')[0].payload, { xp_amount: 70 })
    assertEquals(r.svc.callsFor('xp_month', 'update')[0].payload, { xp_amount: 120 })
    assertEquals(r.svc.callsFor('xp', 'insert').length, 0)
})

Deno.test('resubmitting an already completed challenge updates the feedback but awards no XP', async () => {
    const r = await call({ progress: { data: { completed: true } } })
    assertEquals(r.json.xpAwarded, 0)
    assertEquals(r.svc.callsFor('xp_log').length, 0)
    assertEquals(r.svc.callsFor('user_lessons', 'upsert').length, 1)
})

Deno.test('a lesson worth no XP records no XP', async () => {
    const r = await call({ lesson: { sub_module_id: 'sm-1', xp: 0, type: 'CHALLENGE' } })
    assertEquals(r.json.xpAwarded, 0)
    assertEquals(r.svc.callsFor('xp_log').length, 0)
})

Deno.test('500 when an XP write fails', async () => {
    const r = await call({ extra: { 'xp_log.insert': { error: new Error('log failed') } } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'log failed')
})

Deno.test('does not complete the sub-module while lessons are still missing', async () => {
    const r = await call()
    assertEquals(r.json.subModuleCompleted, false)
    assertEquals(r.json.moduleCompleted, false)
    assertEquals(r.svc.callsFor('user_submodules', 'upsert').length, 0)
})

Deno.test('completes the sub-module when every lesson in it is done, but not the module while others remain', async () => {
    const r = await call({ completedLessons: [{ lesson_id: 'l-1' }, { lesson_id: 'l-2' }] })
    assertEquals(r.json.subModuleCompleted, true)
    assertEquals(r.json.moduleCompleted, false)
    assertEquals(r.svc.callsFor('user_submodules', 'upsert')[0].payload, {
        user_id: 'user-1', sub_module_id: 'sm-1', completed: true, completed_at: '2026-03-10T15:00:00.000Z',
    })
    assertEquals(r.svc.callsFor('user_modules', 'upsert').length, 0)
})

Deno.test('completes the module when its last sub-module is done', async () => {
    const r = await call({
        completedLessons: [{ lesson_id: 'l-1' }, { lesson_id: 'l-2' }],
        completedSubModules: [{ sub_module_id: 'sm-1' }, { sub_module_id: 'sm-2' }],
    })
    assertEquals(r.json.moduleCompleted, true)
    assertEquals(r.svc.callsFor('user_modules', 'upsert')[0].payload, {
        user_id: 'user-1', module_id: 'mod-1', completed: true, completed_at: '2026-03-10T15:00:00.000Z',
    })
})

Deno.test('500 when completing the sub-module fails', async () => {
    const r = await call({
        completedLessons: [{ lesson_id: 'l-1' }, { lesson_id: 'l-2' }],
        extra: { 'user_submodules.upsert': { error: new Error('cascade failed') } },
    })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'cascade failed')
})

Deno.test('achievement XP is added to the response together with the earned achievements', async () => {
    const first = { id: 'a1', identification: 'MEU_PRIMEIRO_DESAFIO', xp_amount: 20 }
    const r = await call({
        extra: {
            'achievements.select': { data: [first] },
            'user_achievements.select': { data: [{ achievement_id: 'a1', progress: 0, completed: false }] },
        },
    })
    assertEquals(r.json.xpAwarded, 70)
    assertEquals(r.json.earnedAchievements, [first])
})

Deno.test('the achievements are evaluated as a completed challenge', async () => {
    const mod = { id: 'a-mod', identification: 'MOD', xp_amount: 0, module_id: 'mod-1' }
    const r = await call({
        completedLessons: [{ lesson_id: 'l-1' }, { lesson_id: 'l-2' }],
        completedSubModules: [{ sub_module_id: 'sm-1' }, { sub_module_id: 'sm-2' }],
        extra: {
            'achievements.select': { data: [mod] },
            'user_achievements.select': { data: [{ achievement_id: 'a-mod', progress: 0, completed: false }] },
        },
    })
    assertEquals(r.json.earnedAchievements, [mod])
})

Deno.test('a missing or invalid token is answered with 401, not 500', async () => {
    assertEquals((await call({ headers: {} })).res.status, 401)
    assertEquals((await call({ user: null })).res.status, 401)
})

Deno.test('only challenge lessons can be completed through the challenge evaluator', async () => {
    for (const type of ['QUIZ', 'REVISION', 'LESSON']) {
        const r = await call({ lesson: { sub_module_id: 'sm-1', xp: 50, type } })
        assertEquals(r.res.status, 400)
        assertEquals(r.aiCalls.length, 0)
        assertEquals(writes(r), [])
    }
})

Deno.test('the weekly XP of the days that open a year belongs to the ISO year of their week', async () => {
    const r = await call({ now: '2021-01-03T12:00:00Z' })
    assertEquals(r.svc.callsFor('xp_week', 'insert')[0].payload, { user_id: 'user-1', week: 53, year: 2020, xp_amount: 50 })
})
