import { TestBed } from '@angular/core/testing';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { SubscriptionService } from './subscription';
import { SupabaseService } from './supabase';
import { Coupon } from '../../models/coupon/coupon';
import { createQueryStub, StubResult } from '../../testing/query-stub';

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let client: any;

    const session = { access_token: 'tok-123', user: { id: 'user-1' } };

    beforeEach(() => {
        client = {
            auth: { getSession: jasmine.createSpy('getSession').and.resolveTo({ data: { session } }) },
            functions: { invoke: jasmine.createSpy('invoke').and.resolveTo({ data: { ok: true }, error: null }) },
            from: jasmine.createSpy('from'),
            rpc: jasmine.createSpy('rpc').and.resolveTo({ error: null }),
            channel: jasmine.createSpy('channel'),
        };
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client } }],
        });
        service = TestBed.inject(SubscriptionService);
    });

    function noSession() {
        client.auth.getSession.and.resolveTo({ data: { session: null } });
    }

    describe('createSubscription', () => {
        it('invokes create-subscription with the payload and the bearer token', async () => {
            const result = await service.createSubscription('plan-1', 'yearly', 'card', 'PROMO', 'card-tok', 'dev-sess');

            expect(client.functions.invoke).toHaveBeenCalledWith('create-subscription', {
                body: {
                    planId: 'plan-1',
                    billingCycle: 'yearly',
                    couponCode: 'PROMO',
                    paymentMethod: 'card',
                    cardTokenId: 'card-tok',
                    deviceSessionId: 'dev-sess',
                },
                headers: { Authorization: 'Bearer tok-123' },
            });
            expect(result).toEqual({ ok: true });
        });

        it('fails without calling the function when there is no session', async () => {
            noSession();
            await expectAsync(service.createSubscription('p', 'monthly', 'pix')).toBeRejectedWithError(
                'Sessão não encontrada. Faça login novamente.',
            );
            expect(client.functions.invoke).not.toHaveBeenCalled();
        });

        it('surfaces the error body of an HTTP error from the function', async () => {
            const httpError = new FunctionsHttpError({
                json: () => Promise.resolve({ error: 'Cupom inválido', code: 'invalid_coupon', details: { x: 1 } }),
            });
            client.functions.invoke.and.resolveTo({ data: null, error: httpError });

            await expectAsync(service.createSubscription('p', 'monthly', 'pix', 'BAD')).toBeRejectedWith({
                message: 'Cupom inválido',
                code: 'invalid_coupon',
                details: { x: 1 },
            });
        });

        it('defaults the code to unknown when the error body has none', async () => {
            const httpError = new FunctionsHttpError({ json: () => Promise.resolve({ error: 'Falhou' }) });
            client.functions.invoke.and.resolveTo({ data: null, error: httpError });

            await expectAsync(service.createSubscription('p', 'monthly', 'pix')).toBeRejectedWith(
                jasmine.objectContaining({ message: 'Falhou', code: 'unknown' }),
            );
        });

        it('falls back to a generic message when the HTTP error body is not JSON', async () => {
            const httpError = new FunctionsHttpError({ json: () => Promise.reject(new Error('not json')) });
            client.functions.invoke.and.resolveTo({ data: null, error: httpError });

            await expectAsync(service.createSubscription('p', 'monthly', 'pix')).toBeRejectedWith({
                message: 'Não foi possível concluir a assinatura. Tente novamente em instantes.',
                code: 'unknown',
            });
        });

        it('falls back to a generic message on a non-HTTP error', async () => {
            client.functions.invoke.and.resolveTo({ data: null, error: new Error('network') });

            await expectAsync(service.createSubscription('p', 'monthly', 'pix')).toBeRejectedWith(
                jasmine.objectContaining({ code: 'unknown' }),
            );
        });

        it('rejects when the function answers 200 with an error payload', async () => {
            client.functions.invoke.and.resolveTo({ data: { error: 'Pagamento recusado', code: 'rejected' }, error: null });

            await expectAsync(service.createSubscription('p', 'monthly', 'card', undefined, 't')).toBeRejectedWith(
                jasmine.objectContaining({ message: 'Pagamento recusado', code: 'rejected' }),
            );
        });
    });

    describe('getActiveSubscription', () => {
        function respondWith(result: StubResult) {
            const stub = createQueryStub(result);
            client.from.and.returnValue(stub.query);
            return stub;
        }

        it('queries the latest active or pending subscription of the logged user', async () => {
            const stub = respondWith({ data: { id: 'sub-1', status: 'active' } });

            const sub = await service.getActiveSubscription();

            expect(client.from).toHaveBeenCalledWith('subscriptions');
            expect(stub.spy('eq')).toHaveBeenCalledWith('user_id', 'user-1');
            expect(stub.spy('in')).toHaveBeenCalledWith('status', ['active', 'pending']);
            expect(stub.spy('order')).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(stub.spy('limit')).toHaveBeenCalledWith(1);
            expect(sub).toEqual({ id: 'sub-1', status: 'active' });
        });

        it('returns null when the user has no subscription (PGRST116)', async () => {
            respondWith({ data: null, error: { code: 'PGRST116' } });
            expect(await service.getActiveSubscription()).toBeNull();
        });

        it('throws any other database error', async () => {
            const dbError = { code: '42501', message: 'denied' };
            respondWith({ error: dbError });
            await expectAsync(service.getActiveSubscription()).toBeRejectedWith(dbError);
        });

        it('fails when there is no session', async () => {
            noSession();
            await expectAsync(service.getActiveSubscription()).toBeRejectedWithError(
                'Sessão não encontrada. Faça login novamente.',
            );
        });
    });

    describe('cancelSubscription', () => {
        it('invokes cancel-subscription with the id and the bearer token', async () => {
            await service.cancelSubscription('sub-9');

            expect(client.functions.invoke).toHaveBeenCalledWith('cancel-subscription', {
                body: { subscriptionId: 'sub-9' },
                headers: { Authorization: 'Bearer tok-123' },
            });
        });

        it('fails when there is no session', async () => {
            noSession();
            await expectAsync(service.cancelSubscription('sub-9')).toBeRejectedWithError(
                'Sessão não encontrada. Faça login novamente.',
            );
        });

        it('maps a function error to a message with unknown code', async () => {
            client.functions.invoke.and.resolveTo({ data: null, error: { message: 'boom' } });
            await expectAsync(service.cancelSubscription('s')).toBeRejectedWith({ message: 'boom', code: 'unknown' });
        });

        it('uses a default message when the error has none', async () => {
            client.functions.invoke.and.resolveTo({ data: null, error: {} });
            await expectAsync(service.cancelSubscription('s')).toBeRejectedWith({
                message: 'Erro ao cancelar assinatura',
                code: 'unknown',
            });
        });

        it('rejects with the payload error returned by the function', async () => {
            client.functions.invoke.and.resolveTo({ data: { error: 'Já cancelada', code: 'already', details: 'd' }, error: null });
            await expectAsync(service.cancelSubscription('s')).toBeRejectedWith({
                message: 'Já cancelada',
                code: 'already',
                details: 'd',
            });
        });
    });

    describe('activateProWithCoupon', () => {
        it('calls the activate_pro_with_coupon_id rpc with the coupon id', async () => {
            await service.activateProWithCoupon(new Coupon({ id: 'c-7' }));
            expect(client.rpc).toHaveBeenCalledWith('activate_pro_with_coupon_id', { p_coupon_id: 'c-7' });
        });

        it('throws the rpc error message', async () => {
            client.rpc.and.resolveTo({ error: { message: 'Cupom esgotado' } });
            await expectAsync(service.activateProWithCoupon(new Coupon({ id: 'c' }))).toBeRejectedWithError('Cupom esgotado');
        });

        it('throws a default message when the rpc error has none', async () => {
            client.rpc.and.resolveTo({ error: {} });
            await expectAsync(service.activateProWithCoupon(new Coupon({ id: 'c' }))).toBeRejectedWithError(
                'Erro ao ativar o plano Pró.',
            );
        });
    });

    describe('watchSubscriptionStatus', () => {
        let handler: (payload: any) => void;
        let channelObj: any;

        beforeEach(() => {
            channelObj = {
                on: jasmine.createSpy('on').and.callFake((_e: string, _f: unknown, cb: (p: any) => void) => {
                    handler = cb;
                    return channelObj;
                }),
                subscribe: jasmine.createSpy('subscribe').and.callFake(() => channelObj),
            };
            client.channel.and.returnValue(channelObj);
        });

        it('listens to updates of that subscription row', () => {
            const channel = service.watchSubscriptionStatus('sub-5', () => undefined);

            expect(client.channel).toHaveBeenCalledWith('subscription-status-sub-5');
            expect(channelObj.on).toHaveBeenCalledWith(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'subscriptions', filter: 'id=eq.sub-5' },
                jasmine.any(Function),
            );
            expect(channel).toBe(channelObj);
        });

        it('calls onActive only when the new status is active', () => {
            const onActive = jasmine.createSpy('onActive');
            service.watchSubscriptionStatus('sub-5', onActive);

            handler({ new: { status: 'pending' } });
            expect(onActive).not.toHaveBeenCalled();

            handler({ new: { status: 'active' } });
            expect(onActive).toHaveBeenCalledTimes(1);
        });
    });
});
