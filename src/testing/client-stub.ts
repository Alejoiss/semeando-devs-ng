import { createQueryStub, QueryStub, StubResult } from './query-stub';

/** Cliente Supabase falso: cada `from`/`rpc` consome o próximo resultado da fila (o último se repete). */
export function createClientStub(...results: StubResult[]) {
    const queue = results.length ? results : [{}];
    const stubs: QueryStub[] = [];
    const next = () => {
        const stub = createQueryStub(queue[Math.min(stubs.length, queue.length - 1)]);
        stubs.push(stub);
        return stub.query;
    };
    const client = {
        from: jasmine.createSpy('from').and.callFake(next),
        rpc: jasmine.createSpy('rpc').and.callFake(next),
        functions: { invoke: jasmine.createSpy('invoke').and.callFake(() => Promise.resolve(queue[0])) },
    };
    return { client, stubs, spy: (call: number, method: string) => stubs[call].spy(method) };
}
