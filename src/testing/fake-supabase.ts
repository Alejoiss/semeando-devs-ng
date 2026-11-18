import { SupabaseService } from '../app/services/supabase';

export type FakeResult = { data: unknown; error: unknown; count?: number | null };

const EMPTY: FakeResult = { data: null, error: null, count: null };

function createQuery(result: () => FakeResult): unknown {
    const target = () => undefined;
    const proxy: unknown = new Proxy(target, {
        get(_t, prop) {
            if (prop === 'then') {
                return (resolve: (v: FakeResult) => unknown, reject?: (e: unknown) => unknown) =>
                    Promise.resolve(result()).then(resolve, reject);
            }
            if (typeof prop === 'symbol') return undefined;
            return () => proxy;
        },
        apply() {
            return proxy;
        },
    });
    return proxy;
}

export function createFakeSupabaseClient(result: () => FakeResult = () => EMPTY) {
    const query = () => createQuery(result);
    return {
        from: query,
        rpc: query,
        functions: { invoke: () => Promise.resolve(result()) },
        storage: { from: () => ({ upload: () => Promise.resolve(EMPTY), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
        channel: () => ({ on() { return this; }, subscribe() { return this; }, unsubscribe: () => Promise.resolve('ok') }),
        removeChannel: () => Promise.resolve('ok'),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
            signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
            signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
            signOut: () => Promise.resolve({ error: null }),
            resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
            updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
        },
    };
}

export class FakeSupabaseService {
    public readonly client = createFakeSupabaseClient() as unknown as SupabaseService['client'];
}
