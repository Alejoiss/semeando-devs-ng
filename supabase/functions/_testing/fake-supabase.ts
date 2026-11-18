export type Result = { data?: unknown; error?: unknown; count?: number | null }

export interface Call {
    table: string
    op: 'select' | 'insert' | 'update' | 'upsert' | 'delete'
    payload?: any
    filters: [string, ...unknown[]][]
}

type Resolver = Result | ((call: Call) => Result)

/** Keys are `table.op` (e.g. `xp.select`) or just `table`; unmatched calls resolve with empty data. */
export function createFakeSupabase(resolvers: Record<string, Resolver> = {}) {
    const calls: Call[] = []

    const from = (table: string) => {
        const call: Call = { table, op: 'select', filters: [] }
        let recorded = false
        const record = () => {
            if (!recorded) {
                recorded = true
                calls.push(call)
            }
        }
        const resolve = (): Result => {
            const r = resolvers[`${table}.${call.op}`] ?? resolvers[table] ?? {}
            const value = typeof r === 'function' ? r(call) : r
            return { data: null, error: null, count: null, ...value }
        }
        const builder: any = new Proxy({}, {
            get(_t, prop) {
                if (prop === 'then') {
                    record()
                    return (ok: (v: unknown) => unknown, fail?: (e: unknown) => unknown) =>
                        Promise.resolve(resolve()).then(ok, fail)
                }
                if (typeof prop === 'symbol') return undefined
                return (...args: unknown[]) => {
                    if (prop === 'insert' || prop === 'update' || prop === 'upsert' || prop === 'delete') {
                        call.op = prop
                        call.payload = args[0]
                    } else if (!['select', 'single', 'maybeSingle'].includes(prop)) {
                        call.filters.push([prop, ...args])
                    }
                    return builder
                }
            },
        })
        return builder
    }

    return {
        client: { from } as any,
        calls,
        callsFor: (table: string, op?: Call['op']) =>
            calls.filter((c) => c.table === table && (!op || c.op === op)),
    }
}
