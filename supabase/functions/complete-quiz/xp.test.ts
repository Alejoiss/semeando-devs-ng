import { assertEquals, assertRejects } from "jsr:@std/assert@1"
import { FakeTime } from "jsr:@std/testing@1/time"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { applyXp } from "./xp.ts"

const USER = 'user-1'

async function run(
    now: string,
    entries: Parameters<typeof applyXp>[2],
    resolvers: Parameters<typeof createFakeSupabase>[0] = {},
) {
    const time = new FakeTime(new Date(now))
    try {
        const fake = createFakeSupabase(resolvers)
        await applyXp(fake.client, USER, entries)
        return fake
    } finally {
        time.restore()
    }
}

Deno.test('applyXp does nothing when there is no positive amount', async () => {
    const fake = await run('2026-03-10T12:00:00Z', [
        { amount: 0, reason: 'LESSON' },
        { amount: -5, reason: 'ACHIEVEMENT' },
    ])
    assertEquals(fake.calls, [])
})

Deno.test('applyXp logs only positive entries and creates the rows for a new user', async () => {
    const fake = await run('2026-03-10T12:00:00Z', [
        { amount: 100, reason: 'LESSON' },
        { amount: 0, reason: 'ACHIEVEMENT' },
        { amount: 50, reason: 'ACHIEVEMENT' },
    ])

    assertEquals(fake.callsFor('xp_log', 'insert')[0].payload, [
        { user_id: USER, amount: 100, reason: 'LESSON' },
        { user_id: USER, amount: 50, reason: 'ACHIEVEMENT' },
    ])
    assertEquals(fake.callsFor('xp', 'insert')[0].payload, { user_id: USER, total_xp: 150 })
    assertEquals(fake.callsFor('xp_week', 'insert')[0].payload, { user_id: USER, week: 11, year: 2026, xp_amount: 150 })
    assertEquals(fake.callsFor('xp_month', 'insert')[0].payload, { user_id: USER, month: 3, year: 2026, xp_amount: 150 })
    assertEquals(fake.callsFor('xp', 'update'), [])
})

Deno.test('applyXp adds the total to existing totals instead of replacing them', async () => {
    const fake = await run('2026-03-10T12:00:00Z', [{ amount: 30, reason: 'LESSON' }], {
        'xp.select': { data: { id: 'xp-1', total_xp: 200 } },
        'xp_week.select': { data: { id: 'w-1', xp_amount: 40 } },
        'xp_month.select': { data: { id: 'm-1', xp_amount: 90 } },
    })

    const [xp] = fake.callsFor('xp', 'update')
    assertEquals(xp.payload, { total_xp: 230, updated_at: '2026-03-10T12:00:00.000Z' })
    assertEquals(xp.filters, [['eq', 'id', 'xp-1']])
    assertEquals(fake.callsFor('xp_week', 'update')[0].payload, { xp_amount: 70, updated_at: '2026-03-10T12:00:00.000Z' })
    assertEquals(fake.callsFor('xp_month', 'update')[0].payload, { xp_amount: 120, updated_at: '2026-03-10T12:00:00.000Z' })
    assertEquals(fake.callsFor('xp', 'insert'), [])
})

Deno.test('applyXp looks the week and month rows up by the ISO week of the current date', async () => {
    const fake = await run('2026-01-01T12:00:00Z', [{ amount: 10, reason: 'LESSON' }])

    assertEquals(
        fake.callsFor('xp_week', 'select')[0].filters,
        [['eq', 'user_id', USER], ['eq', 'week', 1], ['eq', 'year', 2026]],
    )
    assertEquals(
        fake.callsFor('xp_month', 'select')[0].filters,
        [['eq', 'user_id', USER], ['eq', 'month', 1], ['eq', 'year', 2026]],
    )
})

Deno.test('applyXp files the days that open a year under the ISO year of their week', async () => {
    const fake = await run('2021-01-03T12:00:00Z', [{ amount: 10, reason: 'LESSON' }])
    assertEquals(
        fake.callsFor('xp_week', 'select')[0].filters,
        [['eq', 'user_id', USER], ['eq', 'week', 53], ['eq', 'year', 2020]],
    )
})

for (const [label, key] of [
    ['log insert', 'xp_log.insert'],
    ['xp read', 'xp.select'],
    ['week read', 'xp_week.select'],
    ['month read', 'xp_month.select'],
] as const) {
    Deno.test(`applyXp rejects when the ${label} fails`, async () => {
        await assertRejects(
            () => run('2026-03-10T12:00:00Z', [{ amount: 10, reason: 'LESSON' }], { [key]: { error: new Error('boom') } }),
            Error,
            'boom',
        )
    })
}

Deno.test('applyXp rejects when a write fails', async () => {
    await assertRejects(
        () => run('2026-03-10T12:00:00Z', [{ amount: 10, reason: 'LESSON' }], { 'xp_month.insert': { error: new Error('write failed') } }),
        Error,
        'write failed',
    )
})
