import { TestBed } from '@angular/core/testing';
import { AdminNewsletterService } from './admin-newsletter';
import { SupabaseService } from './supabase';
import { NewNewsletterInput, NewsletterQueryParams } from '../../models/newsletter/newsletter';
import { createQueryStub, StubResult } from '../../testing/query-stub';

describe('AdminNewsletterService', () => {
    let service: AdminNewsletterService;
    let fromSpy: jasmine.Spy;
    let invoke: jasmine.Spy;

    function respondWith(result: StubResult) {
        const stub = createQueryStub(result);
        fromSpy.and.returnValue(stub.query);
        return stub;
    }

    const params = (over: Partial<NewsletterQueryParams> = {}): NewsletterQueryParams => ({
        search: '',
        sortDir: 'desc',
        page: 0,
        pageSize: 10,
        ...over,
    });

    const input: NewNewsletterInput = {
        subject: 'Novidades',
        body: '<p>Oi</p>',
        html: '<p>Oi</p>',
        ctaLabel: 'Ver',
        ctaUrl: 'https://semeandodevs.com.br',
    };

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        invoke = jasmine.createSpy('invoke');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy, functions: { invoke } } } }],
        });
        service = TestBed.inject(AdminNewsletterService);
    });

    describe('getNewsletters', () => {
        it('lists a page ordered by creation date with a stable tiebreaker', async () => {
            const stub = respondWith({ data: [{ id: 'n1' }], count: 7 });

            const result = await service.getNewsletters(params({ page: 2, pageSize: 5, sortDir: 'asc' }));

            expect(fromSpy).toHaveBeenCalledWith('newsletter');
            expect(stub.spy('select')).toHaveBeenCalledWith('id, subject, created_at', { count: 'exact' });
            expect(stub.spy('order').calls.allArgs()).toEqual([['created_at', { ascending: true }], ['id', { ascending: true }]]);
            expect(stub.spy('range')).toHaveBeenCalledWith(10, 14);
            expect(result).toEqual({ newsletters: [{ id: 'n1' }] as any, total: 7 });
        });

        it('searches the subject with a sanitized term', async () => {
            const stub = respondWith({ data: [], count: 0 });
            await service.getNewsletters(params({ search: ' 50%_off,(\\) ' }));
            expect(stub.spy('ilike')).toHaveBeenCalledWith('subject', '%50off%');
        });

        it('skips the search for a blank term and tolerates null data', async () => {
            const stub = respondWith({ data: null, count: null });
            expect(await service.getNewsletters(params({ search: '  ' }))).toEqual({ newsletters: [], total: 0 });
            expect(stub.spy('ilike')).not.toHaveBeenCalled();
        });

        it('throws the query error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.getNewsletters(params())).toBeRejectedWithError('boom');
        });
    });

    describe('getNewsletter', () => {
        it('fetches one newsletter by id', async () => {
            const stub = respondWith({ data: { id: 'n1' } });
            expect(await service.getNewsletter('n1')).toEqual({ id: 'n1' } as any);
            expect(stub.spy('eq')).toHaveBeenCalledWith('id', 'n1');
        });

        it('returns null when it does not exist', async () => {
            respondWith({ data: null });
            expect(await service.getNewsletter('x')).toBeNull();
        });

        it('throws the query error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.getNewsletter('x')).toBeRejectedWithError('boom');
        });
    });

    describe('createNewsletter', () => {
        it('inserts the mapped columns and returns the new id', async () => {
            const stub = respondWith({ data: { id: 'n9' } });

            expect(await service.createNewsletter(input)).toBe('n9');
            expect(stub.spy('insert')).toHaveBeenCalledWith({
                subject: 'Novidades',
                body: '<p>Oi</p>',
                html: '<p>Oi</p>',
                cta_label: 'Ver',
                cta_url: 'https://semeandodevs.com.br',
            });
        });

        it('throws the insert error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.createNewsletter(input)).toBeRejectedWithError('boom');
        });
    });

    describe('sendTest', () => {
        it('dispatches the draft to the test e-mail only', async () => {
            invoke.and.resolveTo({ data: { sent_count: 1, failed_count: 0, remaining: 0 }, error: null });

            await service.sendTest(input, 'me@x.dev');

            expect(invoke).toHaveBeenCalledWith('dispatch-newsletter', {
                body: {
                    test_email: 'me@x.dev',
                    draft: {
                        subject: 'Novidades',
                        body: '<p>Oi</p>',
                        html: '<p>Oi</p>',
                        cta_label: 'Ver',
                        cta_url: 'https://semeandodevs.com.br',
                    },
                },
            });
        });

        it('surfaces the error message from the function response body', async () => {
            invoke.and.resolveTo({
                data: null,
                error: { message: 'Edge Function returned a non-2xx', context: { json: () => Promise.resolve({ error: 'E-mail inválido' }) } },
            });
            await expectAsync(service.sendTest(input, 'bad')).toBeRejectedWithError('E-mail inválido');
        });

        it('keeps the generic message when the body has no error field', async () => {
            invoke.and.resolveTo({ data: null, error: { message: 'generic', context: { json: () => Promise.resolve({}) } } });
            await expectAsync(service.sendTest(input, 'x')).toBeRejectedWithError('generic');
        });

        it('keeps the generic message when the body is not JSON or there is no context', async () => {
            invoke.and.resolveTo({ data: null, error: { message: 'generic', context: { json: () => Promise.reject(new Error('x')) } } });
            await expectAsync(service.sendTest(input, 'x')).toBeRejectedWithError('generic');

            invoke.and.resolveTo({ data: null, error: { message: 'no context' } });
            await expectAsync(service.sendTest(input, 'x')).toBeRejectedWithError('no context');
        });
    });

    describe('sendToPending', () => {
        const batch = (sent: number, failed: number, remaining: number) => ({
            data: { sent_count: sent, failed_count: failed, remaining },
            error: null,
        });

        it('sends in batches of 100 until nothing is pending, reporting progress each time', async () => {
            invoke.and.returnValues(Promise.resolve(batch(100, 0, 50)), Promise.resolve(batch(50, 0, 0)));
            const onProgress = jasmine.createSpy('onProgress');

            const final = await service.sendToPending('n1', onProgress);

            expect(invoke).toHaveBeenCalledTimes(2);
            expect(invoke).toHaveBeenCalledWith('dispatch-newsletter', { body: { newsletter_id: 'n1', max_per_run: 100 } });
            expect(onProgress.calls.allArgs()).toEqual([
                [{ sent: 100, failed: 0, remaining: 50, total: 150 }],
                [{ sent: 150, failed: 0, remaining: 0, total: 150 }],
            ]);
            expect(final).toEqual({ sent: 150, failed: 0, remaining: 0, total: 150 });
        });

        it('finishes after one call when nobody is pending', async () => {
            invoke.and.resolveTo(batch(10, 0, 0));
            const final = await service.sendToPending('n1', () => undefined);
            expect(invoke).toHaveBeenCalledTimes(1);
            expect(final.total).toBe(10);
        });

        it('stops early when a batch delivers nothing, to avoid looping forever', async () => {
            invoke.and.resolveTo(batch(0, 20, 20));
            const final = await service.sendToPending('n1', () => undefined);
            expect(invoke).toHaveBeenCalledTimes(1);
            expect(final.remaining).toBe(20);
        });

        it('rejects when a batch fails', async () => {
            invoke.and.resolveTo({ data: null, error: { message: 'down' } });
            await expectAsync(service.sendToPending('n1', () => undefined)).toBeRejectedWithError('down');
        });
    });
});
