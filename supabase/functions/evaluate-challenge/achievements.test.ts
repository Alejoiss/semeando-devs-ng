import { assertEquals } from "jsr:@std/assert@1"
import { FakeTime } from "jsr:@std/testing@1/time"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { evaluateAchievements } from "./achievements.ts"

const USER = 'user-1'
const NOW = '2026-03-10T12:00:00Z'
const TODAY = '2026-03-10'
const YESTERDAY = '2026-03-09'

type Ach = { id: string; identification: string; xp_amount?: number; module_id?: string }
type State = { achievement_id: string; progress: number; completed: boolean; last_value?: string }

const ctx = (over: Partial<Parameters<typeof evaluateAchievements>[2]> = {}) => ({
    lessonId: 'lesson-1',
    subModuleId: 'sub-1',
    moduleId: 'mod-1',
    lessonType: 'CHALLENGE',
    score: 10,
    passed: true,
    subModuleCompleted: false,
    moduleCompleted: false,
    ...over,
})

const ach = (identification: string, xp = 10, extra: Partial<Ach> = {}): Ach => ({
    id: `a-${identification}`,
    identification,
    xp_amount: xp,
    ...extra,
})

const state = (identification: string, over: Partial<State> = {}): State => ({
    achievement_id: `a-${identification}`,
    progress: 0,
    completed: false,
    ...over,
})

async function run(opts: {
    achievements: Ach[]
    states?: State[]
    history?: { completed_at: string }[]
    retries?: number
    quiz?: boolean
    now?: string
    context?: Partial<Parameters<typeof evaluateAchievements>[2]>
    extra?: Parameters<typeof createFakeSupabase>[0]
}) {
    const time = new FakeTime(new Date(opts.now ?? NOW))
    const errors = console.error
    console.error = () => {}
    try {
        const fake = createFakeSupabase({
            'achievements.select': { data: opts.achievements },
            'user_achievements.select': { data: opts.states ?? opts.achievements.map((a) => state(a.identification)) },
            'user_quizzes.select': (call) =>
                call.filters.some((f) => f[0] === 'limit')
                    ? { data: opts.history ?? [] }
                    : { count: opts.retries ?? 1 },
            'quizzes.select': opts.quiz === false ? { data: null, error: { code: 'PGRST116' } } : { data: { id: 'quiz-1' } },
            ...opts.extra,
        })
        const result = await evaluateAchievements(fake.client, USER, ctx(opts.context))
        return { ...result, fake }
    } finally {
        console.error = errors
        time.restore()
    }
}

const updatesOf = (fake: ReturnType<typeof createFakeSupabase>) =>
    fake.callsFor('user_achievements', 'update').map((c) => ({
        id: (c.filters.find((f) => f[0] === 'match')![1] as Record<string, string>).achievement_id,
        updates: c.payload,
    }))

Deno.test('creates the missing user_achievements rows before evaluating', async () => {
    const { fake } = await run({ achievements: [ach('A'), ach('B')], states: [state('A')] })
    assertEquals(fake.callsFor('user_achievements', 'insert')[0].payload, [
        { user_id: USER, achievement_id: 'a-B', progress: 0, completed: false, viewed: false },
    ])
})

Deno.test('does not insert anything when every achievement already has a row', async () => {
    const { fake } = await run({ achievements: [ach('A')] })
    assertEquals(fake.callsFor('user_achievements', 'insert'), [])
})

Deno.test('a failing row initialization is tolerated, but those achievements are not evaluated', async () => {
    const { earnedAchievements } = await run({
        achievements: [ach('MEU_PRIMEIRO_DESAFIO')],
        states: [],
        extra: { 'user_achievements.insert': { error: new Error('insert failed') } },
    })
    assertEquals(earnedAchievements, [])
})

Deno.test('returns nothing when the achievements or the user state cannot be read', async () => {
    for (const key of ['achievements.select', 'user_achievements.select']) {
        const { totalXpAwarded, earnedAchievements } = await run({ achievements: [], extra: { [key]: { error: new Error('down') } } })
        assertEquals(totalXpAwarded, 0)
        assertEquals(earnedAchievements, [])
    }
})

Deno.test('completes the achievement of the module just finished and awards its XP', async () => {
    const m = ach('MOD_REACT', 200, { module_id: 'mod-1' })
    const { totalXpAwarded, earnedAchievements, fake } = await run({
        achievements: [m, ach('OTHER', 5, { module_id: 'mod-2' })],
        context: { moduleCompleted: true },
    })
    assertEquals(updatesOf(fake), [{ id: m.id, updates: { completed: true } }])
    assertEquals(totalXpAwarded, 200)
    assertEquals(earnedAchievements, [m])
})

Deno.test('ignores the module achievement while the module is not finished', async () => {
    const { fake } = await run({ achievements: [ach('MOD_REACT', 200, { module_id: 'mod-1' })] })
    assertEquals(updatesOf(fake), [])
})

Deno.test('a challenge earns MEU_PRIMEIRO_DESAFIO', async () => {
    const { earnedAchievements } = await run({ achievements: [ach('MEU_PRIMEIRO_DESAFIO')] })
    assertEquals(earnedAchievements.map((a) => a.identification), ['MEU_PRIMEIRO_DESAFIO'])
})

Deno.test('a revision earns MINHA_PRIMEIRA_REVISAO and a challenge does not', async () => {
    const a = await run({ achievements: [ach('MINHA_PRIMEIRA_REVISAO')], context: { lessonType: 'REVISION' } })
    assertEquals(a.earnedAchievements.length, 1)
    const b = await run({ achievements: [ach('MINHA_PRIMEIRA_REVISAO')] })
    assertEquals(b.earnedAchievements.length, 0)
})

Deno.test('perfection streaks never advance on a challenge', async () => {
    const { fake } = await run({ achievements: [ach('SERIE_PERFEITA'), ach('COMBO_INSANO')] })
    assertEquals(updatesOf(fake), [])
})

Deno.test('perfection streaks advance on a perfect quiz and complete at their threshold', async () => {
    const { fake, earnedAchievements } = await run({
        achievements: [ach('SERIE_PERFEITA'), ach('COMBO_INSANO')],
        states: [state('SERIE_PERFEITA', { progress: 4 }), state('COMBO_INSANO', { progress: 4 })],
        context: { lessonType: 'QUIZ', score: 10 },
    })
    assertEquals(updatesOf(fake), [
        { id: 'a-SERIE_PERFEITA', updates: { progress: 5, completed: true } },
        { id: 'a-COMBO_INSANO', updates: { progress: 5, completed: false } },
    ])
    assertEquals(earnedAchievements.map((a) => a.identification), ['SERIE_PERFEITA'])
})

Deno.test('an imperfect quiz resets a running perfection streak', async () => {
    const { fake } = await run({
        achievements: [ach('SERIE_PERFEITA')],
        states: [state('SERIE_PERFEITA', { progress: 3 })],
        context: { lessonType: 'QUIZ', score: 8 },
    })
    assertEquals(updatesOf(fake), [{ id: 'a-SERIE_PERFEITA', updates: { progress: 0 } }])
})

Deno.test('the day streak starts at 1 and records today', async () => {
    const { fake } = await run({ achievements: [ach('MARATONISTA_DO_CODIGO')] })
    assertEquals(updatesOf(fake), [{ id: 'a-MARATONISTA_DO_CODIGO', updates: { progress: 1, last_value: TODAY } }])
})

Deno.test('the day streak advances when yesterday was recorded and completes at its threshold', async () => {
    const { fake, earnedAchievements } = await run({
        achievements: [ach('MARATONISTA_DO_CODIGO'), ach('IMPARAVEL')],
        states: [
            state('MARATONISTA_DO_CODIGO', { progress: 4, last_value: YESTERDAY }),
            state('IMPARAVEL', { progress: 4, last_value: YESTERDAY }),
        ],
    })
    assertEquals(updatesOf(fake), [
        { id: 'a-MARATONISTA_DO_CODIGO', updates: { progress: 5, completed: true, last_value: TODAY } },
        { id: 'a-IMPARAVEL', updates: { progress: 5, completed: false, last_value: TODAY } },
    ])
    assertEquals(earnedAchievements.map((a) => a.identification), ['MARATONISTA_DO_CODIGO'])
})

Deno.test('the day streak counts a day only once', async () => {
    const { fake } = await run({
        achievements: [ach('IMPARAVEL')],
        states: [state('IMPARAVEL', { progress: 3, last_value: TODAY })],
    })
    assertEquals(updatesOf(fake), [])
})

Deno.test('a gap of more than one day restarts the day streak', async () => {
    const { fake } = await run({
        achievements: [ach('IMPARAVEL')],
        states: [state('IMPARAVEL', { progress: 7, last_value: '2026-03-05' })],
    })
    assertEquals(updatesOf(fake), [{ id: 'a-IMPARAVEL', updates: { progress: 1, last_value: TODAY } }])
})

Deno.test('redoing a quiz earns PERFECCIONISTA_DO_CODIGO, a first attempt does not', async () => {
    const a = await run({ achievements: [ach('PERFECCIONISTA_DO_CODIGO')], retries: 2 })
    assertEquals(a.earnedAchievements.length, 1)
    const b = await run({ achievements: [ach('PERFECCIONISTA_DO_CODIGO')], retries: 1 })
    assertEquals(b.earnedAchievements.length, 0)
})

Deno.test('a lesson without a quiz skips the retry check', async () => {
    const { fake } = await run({ achievements: [ach('PERFECCIONISTA_DO_CODIGO')], quiz: false, retries: 5 })
    assertEquals(updatesOf(fake), [])
})

Deno.test('the first completed quiz ever earns PRIMEIRO_PASSO_NO_CODIGO', async () => {
    const a = await run({ achievements: [ach('PRIMEIRO_PASSO_NO_CODIGO')], history: [{ completed_at: `${TODAY}T10:00:00Z` }] })
    assertEquals(a.earnedAchievements.length, 1)
    const b = await run({ achievements: [ach('PRIMEIRO_PASSO_NO_CODIGO')], history: [{ completed_at: `${TODAY}T10:00:00Z` }, { completed_at: `${YESTERDAY}T10:00:00Z` }] })
    assertEquals(b.earnedAchievements.length, 0)
})

Deno.test('ten quizzes today earn MODO_FOGUETE, nine do not', async () => {
    const day = (n: number) => Array.from({ length: n }, () => ({ completed_at: `${TODAY}T09:00:00Z` }))
    assertEquals((await run({ achievements: [ach('MODO_FOGUETE')], history: day(10) })).earnedAchievements.length, 1)
    assertEquals((await run({ achievements: [ach('MODO_FOGUETE')], history: day(9) })).earnedAchievements.length, 0)
})

Deno.test('an already completed achievement is left alone', async () => {
    const { fake, totalXpAwarded } = await run({
        achievements: [ach('MEU_PRIMEIRO_DESAFIO')],
        states: [state('MEU_PRIMEIRO_DESAFIO', { completed: true })],
    })
    assertEquals(updatesOf(fake), [])
    assertEquals(totalXpAwarded, 0)
})

Deno.test('a failed update neither awards XP nor reports the achievement', async () => {
    const { totalXpAwarded, earnedAchievements, fake } = await run({
        achievements: [ach('MEU_PRIMEIRO_DESAFIO', 50)],
        extra: { 'user_achievements.update': { error: new Error('update failed') } },
    })
    assertEquals(totalXpAwarded, 0)
    assertEquals(earnedAchievements, [])
    assertEquals(fake.callsFor('xp_log').length, 0)
})

Deno.test('an achievement worth no XP is reported without writing XP', async () => {
    const { totalXpAwarded, earnedAchievements, fake } = await run({ achievements: [ach('MEU_PRIMEIRO_DESAFIO', 0)] })
    assertEquals(totalXpAwarded, 0)
    assertEquals(earnedAchievements.length, 1)
    assertEquals(fake.callsFor('xp_log').length, 0)
})

Deno.test('achievement XP is logged and added to the total, the week and the month', async () => {
    const { fake } = await run({ achievements: [ach('MEU_PRIMEIRO_DESAFIO', 30)] })
    assertEquals(fake.callsFor('xp_log', 'insert')[0].payload, { user_id: USER, amount: 30, reason: 'ACHIEVEMENT' })
    assertEquals(fake.callsFor('xp', 'insert')[0].payload, { user_id: USER, total_xp: 30 })
    assertEquals(fake.callsFor('xp_week', 'insert')[0].payload, { user_id: USER, week: 11, year: 2026, xp_amount: 30 })
    assertEquals(fake.callsFor('xp_month', 'insert')[0].payload, { user_id: USER, month: 3, year: 2026, xp_amount: 30 })
})

Deno.test('achievement XP adds to existing totals', async () => {
    const { fake } = await run({
        achievements: [ach('MEU_PRIMEIRO_DESAFIO', 30)],
        extra: {
            'xp.select': { data: { id: 'x1', total_xp: 100 } },
            'xp_week.select': { data: { id: 'w1', xp_amount: 20 } },
            'xp_month.select': { data: { id: 'm1', xp_amount: 70 } },
        },
    })
    assertEquals(fake.callsFor('xp', 'update')[0].payload.total_xp, 130)
    assertEquals(fake.callsFor('xp_week', 'update')[0].payload.xp_amount, 50)
    assertEquals(fake.callsFor('xp_month', 'update')[0].payload.xp_amount, 100)
})

Deno.test({
    ignore: true,
    name: 'achievement XP of the days that open a year is filed under the ISO year of their week (finding xp-iso-year)',
    fn: async () => {
        const { fake } = await run({ achievements: [ach('MEU_PRIMEIRO_DESAFIO', 30)], now: '2021-01-03T12:00:00Z' })
        assertEquals(fake.callsFor('xp_week', 'insert')[0].payload, { user_id: USER, week: 53, year: 2020, xp_amount: 30 })
    },
})
