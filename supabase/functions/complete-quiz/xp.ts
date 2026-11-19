import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { isoWeek } from "../_shared/iso-week.ts"

export interface XpEntry {
    amount: number
    reason: 'LESSON' | 'ACHIEVEMENT'
}

// Applies every XP entry with a single read/write round per table instead of one per entry.
export async function applyXp(supabase: SupabaseClient, userId: string, entries: XpEntry[]) {
    const validEntries = entries.filter(e => e.amount > 0)
    const total = validEntries.reduce((sum, e) => sum + e.amount, 0)
    if (total === 0) return

    const now = new Date()
    const nowIso = now.toISOString()
    const { week, year } = isoWeek(now)
    const month = now.getMonth() + 1

    const [logRes, xpRes, weekRes, monthRes] = await Promise.all([
        supabase.from('xp_log').insert(
            validEntries.map(e => ({ user_id: userId, amount: e.amount, reason: e.reason }))
        ),
        supabase.from('xp').select('id, total_xp').eq('user_id', userId).maybeSingle(),
        supabase.from('xp_week').select('id, xp_amount').eq('user_id', userId).eq('week', week).eq('year', year).maybeSingle(),
        supabase.from('xp_month').select('id, xp_amount').eq('user_id', userId).eq('month', month).eq('year', year).maybeSingle(),
    ])

    if (logRes.error) throw logRes.error
    if (xpRes.error) throw xpRes.error
    if (weekRes.error) throw weekRes.error
    if (monthRes.error) throw monthRes.error

    const xp = xpRes.data
    const weekXp = weekRes.data
    const monthXp = monthRes.data

    const writes = await Promise.all([
        xp
            ? supabase.from('xp').update({ total_xp: xp.total_xp + total, updated_at: nowIso }).eq('id', xp.id)
            : supabase.from('xp').insert({ user_id: userId, total_xp: total }),
        weekXp
            ? supabase.from('xp_week').update({ xp_amount: weekXp.xp_amount + total, updated_at: nowIso }).eq('id', weekXp.id)
            : supabase.from('xp_week').insert({ user_id: userId, week, year, xp_amount: total }),
        monthXp
            ? supabase.from('xp_month').update({ xp_amount: monthXp.xp_amount + total, updated_at: nowIso }).eq('id', monthXp.id)
            : supabase.from('xp_month').insert({ user_id: userId, month, year, xp_amount: total }),
    ])

    for (const { error } of writes) {
        if (error) throw error
    }
}

// ISO-8601 week number
