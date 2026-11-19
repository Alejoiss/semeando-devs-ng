import { assertEquals } from "jsr:@std/assert@1"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { createHandler } from "./handler.ts"

const USER = { id: 'user-1' }
const BODY = { attemptId: 'att-1', lessonId: 'lesson-1', correctCount: 8, totalCount: 10, spentTime: 120 }

type Opts = {
    body?: Record<string, unknown>
    headers?: Record<string, string>
    method?: string
    user?: { id: string } | null
    lesson?: { sub_module_id: string; xp: number; type: string; submodules: { module_id: string } | null }
    lessonError?: unknown
    alreadyCompleted?: boolean
    lessonsTotal?: number
    lessonsDone?: number
    subModulesTotal?: number
    subModulesDone?: number
    extra?: Parameters<typeof createFakeSupabase>[0]
}

async function call(o: Opts = {}) {
    const fake = createFakeSupabase({
        lessons: (c) =>
            c.filters.some((f) => f[1] === 'id')
                ? { data: o.lesson ?? { sub_module_id: 'sub-1', xp: 100, type: 'QUIZ', submodules: { module_id: 'mod-1' } }, error: o.lessonError }
                : { count: o.lessonsTotal ?? 3 },
        'user_lessons.select': (c) =>
            c.filters.some((f) => f[1] === 'lesson_id') && !c.filters.some((f) => f[1] === 'lessons.sub_module_id')
                ? { data: { completed: o.alreadyCompleted ?? false } }
                : { count: o.lessonsDone ?? 1 },
        'submodules.select': { count: o.subModulesTotal ?? 2 },
        'user_submodules.select': { count: o.subModulesDone ?? 1 },
        ...o.extra,
    })
    const user = o.user === undefined ? USER : o.user
    const userClient = { auth: { getUser: () => Promise.resolve({ data: { user }, error: user ? null : new Error('bad') }) } }
    let n = 0
    const handler = createHandler(() => (n++ === 0 ? userClient : fake.client))
    const headers = o.headers ?? { Authorization: 'Bearer t' }
    const res = await handler(new Request('http://x/complete-quiz', {
        method: o.method ?? 'POST',
        headers,
        body: o.method === 'OPTIONS' ? undefined : JSON.stringify(o.body ?? BODY),
    }))
    return { res, json: await res.json().catch(() => null), fake }
}

const quiet = <T>(fn: () => Promise<T>) => async () => {
    const original = console.error
    console.error = () => {}
    try { await fn() } finally { console.error = original }
}

Deno.test('answers the CORS preflight without touching the database', async () => {
    const res = await createHandler(() => { throw new Error('unexpected') })(new Request('http://x', { method: 'OPTIONS' }))
    assertEquals(res.status, 200)
    assertEquals(res.headers.get('Access-Control-Allow-Origin'), '*')
})

Deno.test('rejects requests without an authorization header', quiet(async () => {
    const { res, json } = await call({ headers: {} })
    assertEquals(res.status, 500)
    assertEquals(json.error, 'No authorization header found')
}))

Deno.test('rejects an invalid token', quiet(async () => {
    const { res, json } = await call({ user: null })
    assertEquals(res.status, 500)
    assertEquals(json.error, 'Invalid user or token')
}))

Deno.test('returns 400 when a parameter is missing', async () => {
    const { res, json, fake } = await call({ body: { ...BODY, totalCount: 0 } })
    assertEquals(res.status, 400)
    assertEquals(json.error, 'Missing required parameters')
    assertEquals(fake.callsFor('user_quizzes', 'update'), [])
})

Deno.test('a score under 70% fails: no cascade, no lesson XP, lesson stays incomplete', async () => {
    const { json, fake } = await call({ body: { ...BODY, correctCount: 6 } })
    assertEquals(json, { passed: false, subModuleCompleted: false, moduleCompleted: false, xpAwarded: 0, earnedAchievements: [] })
    assertEquals(fake.callsFor('user_lessons', 'update')[0].payload, { completed: false, completed_at: null })
    assertEquals(fake.callsFor('user_submodules', 'upsert'), [])
    assertEquals(fake.callsFor('xp_log', 'insert'), [])
    assertEquals(fake.callsFor('user_quizzes', 'update')[0].payload.completed, false)
})

Deno.test('exactly 70% passes', async () => {
    const { json } = await call({ body: { ...BODY, correctCount: 7 } })
    assertEquals(json.passed, true)
})

Deno.test('the first pass awards the full lesson XP', async () => {
    const { json, fake } = await call()
    assertEquals(json.passed, true)
    assertEquals(json.xpAwarded, 100)
    assertEquals(fake.callsFor('xp_log', 'insert')[0].payload, [{ user_id: 'user-1', amount: 100, reason: 'LESSON' }])
})

Deno.test('redoing an already completed lesson awards 10% of the XP, rounded up', async () => {
    const { json } = await call({ alreadyCompleted: true, lesson: { sub_module_id: 's', xp: 45, type: 'QUIZ', submodules: { module_id: 'm' } } })
    assertEquals(json.xpAwarded, 5)
})

Deno.test('a lesson worth no XP awards none', async () => {
    const { json, fake } = await call({ lesson: { sub_module_id: 's', xp: 0, type: 'QUIZ', submodules: { module_id: 'm' } } })
    assertEquals(json.xpAwarded, 0)
    assertEquals(fake.callsFor('xp_log', 'insert'), [])
})

Deno.test('the attempt update is scoped to the authenticated user', async () => {
    const { fake } = await call()
    assertEquals(fake.callsFor('user_quizzes', 'update')[0].filters, [['eq', 'id', 'att-1'], ['eq', 'user_id', 'user-1']])
})

Deno.test('pending lessons leave the submodule open', async () => {
    const { json, fake } = await call({ lessonsTotal: 3, lessonsDone: 2 })
    assertEquals(json.subModuleCompleted, false)
    assertEquals(fake.callsFor('user_submodules', 'upsert'), [])
})

Deno.test('finishing the last lesson completes the submodule, but not the module while others are open', async () => {
    const { json, fake } = await call({ lessonsTotal: 3, lessonsDone: 3, subModulesTotal: 2, subModulesDone: 1 })
    assertEquals(json.subModuleCompleted, true)
    assertEquals(json.moduleCompleted, false)
    assertEquals(fake.callsFor('user_submodules', 'upsert')[0].payload.sub_module_id, 'sub-1')
    assertEquals(fake.callsFor('user_modules', 'upsert'), [])
})

Deno.test('finishing the last submodule completes the module', async () => {
    const { json, fake } = await call({ lessonsTotal: 3, lessonsDone: 3, subModulesTotal: 2, subModulesDone: 2 })
    assertEquals(json.moduleCompleted, true)
    assertEquals(fake.callsFor('user_modules', 'upsert')[0].payload.module_id, 'mod-1')
})

Deno.test('errors from the database become a 500 with the message', quiet(async () => {
    const { res, json } = await call({ lessonError: { message: 'lesson not found' } })
    assertEquals(res.status, 500)
    assertEquals(json.error, 'lesson not found')
}))

Deno.test('a failing XP write becomes a 500', quiet(async () => {
    const { res } = await call({ extra: { 'xp_log.insert': { error: new Error('xp down') } } })
    assertEquals(res.status, 500)
}))
