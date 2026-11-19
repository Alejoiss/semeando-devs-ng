import { assertEquals } from "jsr:@std/assert@1"
import { isoWeek } from "./iso-week.ts"

const at = (iso: string) => isoWeek(new Date(iso))

Deno.test('a mid-year date keeps its calendar year', () => {
    assertEquals(at('2026-06-15T12:00:00Z'), { week: 25, year: 2026 })
})

Deno.test('the last days of December that belong to week 1 use the next ISO year', () => {
    assertEquals(at('2025-12-29T12:00:00Z'), { week: 1, year: 2026 })
    assertEquals(at('2025-12-31T23:59:59Z'), { week: 1, year: 2026 })
})

Deno.test('the first days of January that belong to week 53 use the previous ISO year', () => {
    assertEquals(at('2021-01-01T12:00:00Z'), { week: 53, year: 2020 })
    assertEquals(at('2021-01-03T12:00:00Z'), { week: 53, year: 2020 })
    assertEquals(at('2021-01-04T00:00:00Z'), { week: 1, year: 2021 })
})

Deno.test('the week is taken in UTC, so an evening offset that is already Monday in UTC counts as the next week', () => {
    assertEquals(at('2026-01-04T23:30:00-03:00'), { week: 2, year: 2026 })
    assertEquals(at('2026-01-04T23:30:00Z'), { week: 1, year: 2026 })
})
