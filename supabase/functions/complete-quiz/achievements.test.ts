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
    lessonType: 'QUIZ',
    score: 7,
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
    history?: { completed_at: string; score?: number; quiz_id?: string }[]
    retries?: number
    context?: Partial<Parameters<typeof evaluateAchievements>[2]>
    extra?: Parameters<typeof createFakeSupabase>[0]
}) {
    const time = new FakeTime(new Date(NOW))
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
            'quizzes.select': { data: { id: 'quiz-1' } },
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
    const { fake } = await run({
        achievements: [ach('A'), ach('B')],
        states: [state('A')],
    })
    assertEquals(fake.callsFor('user_achievements', 'insert')[0].payload, [
        { user_id: USER, achievement_id: 'a-B', progress: 0, completed: false, viewed: false },
    ])
})

Deno.test('does not insert anything when every achievement already has a row', async () => {
    const { fake } = await run({ achievements: [ach('A')] })
    assertEquals(fake.callsFor('user_achievements', 'insert'), [])
})

Deno.test('returns nothing when the achievements read fails', async () => {
    const { xpEntries, earnedAchievements } = await run({
        achievements: [],
        extra: { 'achievements.select': { error: new Error('down') } },
    })
    assertEquals(xpEntries, [])
    assertEquals(earnedAchievements, [])
})

Deno.test('completes the achievement of the module just finished and awards its XP', async () => {
    const m = ach('MOD_REACT', 200, { module_id: 'mod-1' })
    const { xpEntries, earnedAchievements, fake } = await run({
        achievements: [m, ach('OTHER', 5, { module_id: 'mod-2' })],
        context: { moduleCompleted: true },
    })
    assertEquals(updatesOf(fake), [{ id: m.id, updates: { completed: true } }])
    assertEquals(xpEntries, [{ amount: 200, reason: 'ACHIEVEMENT' }])
    assertEquals(earnedAchievements, [m])
})

Deno.test('ignores module achievements while the module is not completed', async () => {
    const { fake } = await run({ achievements: [ach('MOD_REACT', 200, { module_id: 'mod-1' })] })
    assertEquals(updatesOf(fake), [])
})

Deno.test('a perfect score advances SERIE_PERFEITA and COMBO_INSANO', async () => {
    const { fake } = await run({
        achievements: [ach('SERIE_PERFEITA'), ach('COMBO_INSANO')],
        states: [state('SERIE_PERFEITA', { progress: 2 }), state('COMBO_INSANO', { progress: 4 })],
        context: { score: 10 },
    })
    assertEquals(updatesOf(fake), [
        { id: 'a-SERIE_PERFEITA', updates: { progress: 3, completed: false } },
        { id: 'a-COMBO_INSANO', updates: { progress: 5, completed: false } },
    ])
})

Deno.test('SERIE_PERFEITA completes on the fifth perfect score', async () => {
    const { xpEntries, fake } = await run({
        achievements: [ach('SERIE_PERFEITA', 50)],
        states: [state('SERIE_PERFEITA', { progress: 4 })],
        context: { score: 10 },
    })
    assertEquals(updatesOf(fake), [{ id: 'a-SERIE_PERFEITA', updates: { progress: 5, completed: true } }])
    assertEquals(xpEntries, [{ amount: 50, reason: 'ACHIEVEMENT' }])
})

Deno.test('a non-perfect score resets the perfection progress', async () => {
    const { fake } = await run({
        achievements: [ach('SERIE_PERFEITA')],
        states: [state('SERIE_PERFEITA', { progress: 3 })],
        context: { score: 9 },
    })
    assertEquals(updatesOf(fake), [{ id: 'a-SERIE_PERFEITA', updates: { progress: 0 } }])
})

Deno.test('challenges do not touch perfection progress', async () => {
    const { fake } = await run({
        achievements: [ach('SERIE_PERFEITA')],
        states: [state('SERIE_PERFEITA', { progress: 3 })],
        context: { score: 10, lessonType: 'CHALLENGE' },
    })
    assertEquals(updatesOf(fake), [])
})

Deno.test('a streak continues when the last activity was yesterday', async () => {
    const { fake } = await run({
        achievements: [ach('MARATONISTA_DO_CODIGO')],
        states: [state('MARATONISTA_DO_CODIGO', { progress: 2, last_value: YESTERDAY })],
    })
    assertEquals(updatesOf(fake), [
        { id: 'a-MARATONISTA_DO_CODIGO', updates: { progress: 3, completed: false, last_value: TODAY } },
    ])
})

Deno.test('a streak restarts at 1 when a day was skipped', async () => {
    const { fake } = await run({
        achievements: [ach('IMPARAVEL')],
        states: [state('IMPARAVEL', { progress: 8, last_value: '2026-03-01' })],
    })
    assertEquals(updatesOf(fake), [{ id: 'a-IMPARAVEL', updates: { progress: 1, last_value: TODAY } }])
})

Deno.test('a streak is counted only once per day', async () => {
    const { fake } = await run({
        achievements: [ach('IMPARAVEL')],
        states: [state('IMPARAVEL', { progress: 4, last_value: TODAY })],
    })
    assertEquals(updatesOf(fake), [])
})

Deno.test('IMPARAVEL completes at ten consecutive days and MARATONISTA at five', async () => {
    const { earnedAchievements } = await run({
        achievements: [ach('IMPARAVEL'), ach('MARATONISTA_DO_CODIGO')],
        states: [
            state('IMPARAVEL', { progress: 9, last_value: YESTERDAY }),
            state('MARATONISTA_DO_CODIGO', { progress: 4, last_value: YESTERDAY }),
        ],
    })
    assertEquals(earnedAchievements.map((a) => a.identification).sort(), ['IMPARAVEL', 'MARATONISTA_DO_CODIGO'])
})

Deno.test('redoing a completed quiz earns PERFECCIONISTA_DO_CODIGO', async () => {
    const { earnedAchievements } = await run({ achievements: [ach('PERFECCIONISTA_DO_CODIGO')], retries: 2 })
    assertEquals(earnedAchievements.map((a) => a.identification), ['PERFECCIONISTA_DO_CODIGO'])
})

Deno.test('retries are counted by finished attempts, so a failed first attempt still counts', async () => {
    const { fake } = await run({ achievements: [ach('PERFECCIONISTA_DO_CODIGO')], retries: 2 })
    const filters = fake.callsFor('user_quizzes', 'select')
        .filter((c) => c.filters.some((f) => f[0] === 'eq' && f[1] === 'quiz_id'))
        .flatMap((c) => c.filters)
    assertEquals(filters.some((f) => f[0] === 'not' && f[1] === 'completed_at'), true)
    assertEquals(filters.some((f) => f[0] === 'eq' && f[1] === 'completed'), false)
})

Deno.test('the first completed attempt does not earn PERFECCIONISTA_DO_CODIGO', async () => {
    const { fake } = await run({ achievements: [ach('PERFECCIONISTA_DO_CODIGO')], retries: 1 })
    assertEquals(updatesOf(fake), [])
})

Deno.test('the very first completed quiz earns PRIMEIRO_PASSO_NO_CODIGO', async () => {
    const { earnedAchievements } = await run({
        achievements: [ach('PRIMEIRO_PASSO_NO_CODIGO')],
        history: [{ completed_at: NOW }],
    })
    assertEquals(earnedAchievements.length, 1)
})

Deno.test('PRIMEIRO_PASSO_NO_CODIGO is not earned with a longer history', async () => {
    const { fake } = await run({
        achievements: [ach('PRIMEIRO_PASSO_NO_CODIGO')],
        history: [{ completed_at: NOW }, { completed_at: YESTERDAY + 'T10:00:00Z' }],
    })
    assertEquals(updatesOf(fake), [])
})

Deno.test('lesson type unlocks the one-time milestones', async () => {
    const challenge = await run({ achievements: [ach('MEU_PRIMEIRO_DESAFIO')], context: { lessonType: 'CHALLENGE' } })
    const revision = await run({ achievements: [ach('MINHA_PRIMEIRA_REVISAO')], context: { lessonType: 'REVISION' } })
    assertEquals(challenge.earnedAchievements.map((a) => a.identification), ['MEU_PRIMEIRO_DESAFIO'])
    assertEquals(revision.earnedAchievements.map((a) => a.identification), ['MINHA_PRIMEIRA_REVISAO'])
})

Deno.test('MODO_FOGUETE needs ten quizzes completed today', async () => {
    const today = (n: number) => Array.from({ length: n }, () => ({ completed_at: `${TODAY}T09:00:00Z` }))
    const nine = await run({ achievements: [ach('MODO_FOGUETE')], history: [...today(9), { completed_at: `${YESTERDAY}T09:00:00Z` }] })
    const ten = await run({ achievements: [ach('MODO_FOGUETE')], history: today(10) })
    assertEquals(nine.earnedAchievements, [])
    assertEquals(ten.earnedAchievements.length, 1)
})

Deno.test('completed achievements are never updated again', async () => {
    const { fake } = await run({
        achievements: [ach('MEU_PRIMEIRO_DESAFIO')],
        states: [state('MEU_PRIMEIRO_DESAFIO', { completed: true })],
        context: { lessonType: 'CHALLENGE' },
    })
    assertEquals(updatesOf(fake), [])
})

Deno.test('achievements without XP are earned but add no XP entry', async () => {
    const { xpEntries, earnedAchievements } = await run({
        achievements: [ach('MEU_PRIMEIRO_DESAFIO', 0)],
        context: { lessonType: 'CHALLENGE' },
    })
    assertEquals(xpEntries, [])
    assertEquals(earnedAchievements.length, 1)
})

Deno.test('an achievement whose update fails is not reported as earned', async () => {
    const { xpEntries, earnedAchievements } = await run({
        achievements: [ach('MEU_PRIMEIRO_DESAFIO', 30), ach('MINHA_PRIMEIRA_REVISAO', 20)],
        context: { lessonType: 'CHALLENGE' },
        extra: { 'user_achievements.update': { error: new Error('nope') } },
    })
    assertEquals(xpEntries, [])
    assertEquals(earnedAchievements, [])
})
