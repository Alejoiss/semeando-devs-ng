export type StubResult = { data?: unknown; error?: unknown; count?: number | null };

export type QueryStub = {
    query: any;
    spy: (method: string) => jasmine.Spy;
};

/** Query builder encadeável do Supabase: todo método devolve o próprio builder e o `await` resolve com `result`. */
export function createQueryStub(result: StubResult = {}): QueryStub {
    const spies = new Map<string, jasmine.Spy>();
    const resolved = { data: null, error: null, count: null, ...result };
    const query: any = new Proxy({}, {
        get(_t, prop) {
            if (prop === 'then') {
                return (ok: (v: unknown) => unknown, fail?: (e: unknown) => unknown) =>
                    Promise.resolve(resolved).then(ok, fail);
            }
            if (typeof prop === 'symbol') return undefined;
            if (!spies.has(prop)) {
                spies.set(prop, jasmine.createSpy(prop).and.callFake(() => query));
            }
            return spies.get(prop);
        },
    });
    return {
        query,
        spy: (method: string) => query[method] as jasmine.Spy,
    };
}
