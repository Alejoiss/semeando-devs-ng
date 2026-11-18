import { TestBed } from '@angular/core/testing';
import { AdminCouponService } from './admin-coupon';
import { SupabaseService } from './supabase';
import { CouponQueryParams, NewCouponInput } from '../../models/coupon/coupon';
import { createQueryStub, StubResult } from '../../testing/query-stub';

describe('AdminCouponService', () => {
    let service: AdminCouponService;
    let fromSpy: jasmine.Spy;

    function respondWith(result: StubResult) {
        const stub = createQueryStub(result);
        fromSpy.and.returnValue(stub.query);
        return stub;
    }

    const params = (over: Partial<CouponQueryParams> = {}): CouponQueryParams => ({
        search: '',
        discountType: '',
        planType: '',
        sortField: 'created_at',
        sortDir: 'desc',
        page: 0,
        pageSize: 10,
        ...over,
    });

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy } } }],
        });
        service = TestBed.inject(AdminCouponService);
    });

    describe('getCoupons', () => {
        it('requests the first page ordered with a stable tiebreaker and maps rows to Coupon', async () => {
            const stub = respondWith({ data: [{ id: 'c1', code: 'A', discount_value: '15' }], count: 42 });

            const result = await service.getCoupons(params());

            expect(fromSpy).toHaveBeenCalledWith('coupons');
            expect(stub.spy('select')).toHaveBeenCalledWith('*', { count: 'exact' });
            expect(stub.spy('order').calls.allArgs()).toEqual([
                ['created_at', { ascending: false, nullsFirst: false }],
                ['id', { ascending: true }],
            ]);
            expect(stub.spy('range')).toHaveBeenCalledWith(0, 9);
            expect(result.total).toBe(42);
            expect(result.coupons[0].discountValue).toBe(15);
        });

        it('computes the range from page and page size', async () => {
            const stub = respondWith({ data: [], count: 0 });
            await service.getCoupons(params({ page: 3, pageSize: 25 }));
            expect(stub.spy('range')).toHaveBeenCalledWith(75, 99);
        });

        it('sorts ascending when asked', async () => {
            const stub = respondWith({ data: [], count: 0 });
            await service.getCoupons(params({ sortField: 'used_count', sortDir: 'asc' }));
            expect(stub.spy('order').calls.argsFor(0)).toEqual(['used_count', { ascending: true, nullsFirst: false }]);
        });

        it('applies no filter when the params are empty', async () => {
            const stub = respondWith({ data: [], count: 0 });
            await service.getCoupons(params({ search: '   ' }));
            expect(stub.spy('ilike')).not.toHaveBeenCalled();
            expect(stub.spy('eq')).not.toHaveBeenCalled();
        });

        it('filters by code with a sanitized search term', async () => {
            const stub = respondWith({ data: [], count: 0 });
            await service.getCoupons(params({ search: '  BL%ACK_(50),  ' }));
            expect(stub.spy('ilike')).toHaveBeenCalledWith('code', '%BLACK50%');
        });

        it('filters by discount type and plan type', async () => {
            const stub = respondWith({ data: [], count: 0 });
            await service.getCoupons(params({ discountType: 'fixed', planType: 'yearly' }));
            expect(stub.spy('eq')).toHaveBeenCalledWith('discount_type', 'fixed');
            expect(stub.spy('eq')).toHaveBeenCalledWith('valid_for_plan_type', 'yearly');
        });

        it('returns an empty result when there is no data', async () => {
            respondWith({ data: null, count: null });
            expect(await service.getCoupons(params())).toEqual({ coupons: [], total: 0 });
        });

        it('throws the query error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.getCoupons(params())).toBeRejectedWithError('boom');
        });
    });

    describe('createCoupons', () => {
        const input = (over: Partial<NewCouponInput> = {}): NewCouponInput => ({
            code: 'NATAL',
            discountType: 'percentage',
            discountValue: 20,
            validForPlanType: 'all',
            durationMonths: 3,
            expirationDate: new Date('2026-12-25T23:59:59.000Z'),
            ...over,
        });

        it('inserts all coupons in one call mapped to column names', async () => {
            const stub = respondWith({});

            await service.createCoupons([input(), input({ code: 'SEM-DATA', expirationDate: null })]);

            expect(stub.spy('insert')).toHaveBeenCalledWith([
                {
                    code: 'NATAL',
                    discount_type: 'percentage',
                    discount_value: 20,
                    valid_for_plan_type: 'all',
                    duration_months: 3,
                    expiration_date: '2026-12-25T23:59:59.000Z',
                },
                jasmine.objectContaining({ code: 'SEM-DATA', expiration_date: null }),
            ]);
        });

        it('names the duplicated code on a unique violation', async () => {
            respondWith({ error: { code: '23505', details: 'Key (code)=(NATAL) already exists.' } });
            await expectAsync(service.createCoupons([input()])).toBeRejectedWithError(
                'Já existe um cupom com o código NATAL. Nenhum cupom foi criado.',
            );
        });

        it('uses a generic duplicate message when the code cannot be extracted', async () => {
            respondWith({ error: { code: '23505', details: null } });
            await expectAsync(service.createCoupons([input()])).toBeRejectedWithError(
                'Já existe um cupom com um dos códigos informados. Nenhum cupom foi criado.',
            );
        });

        it('throws other errors with their own message', async () => {
            respondWith({ error: { code: '42501', message: 'denied' } });
            await expectAsync(service.createCoupons([input()])).toBeRejectedWithError('denied');
        });
    });

    describe('updateCoupon', () => {
        it('updates usage limit and expiration of that coupon', async () => {
            const stub = respondWith({ data: [{ id: 'c1' }] });

            await service.updateCoupon('c1', { usageLimit: 50, expirationDate: new Date('2027-01-01T00:00:00.000Z') });

            expect(stub.spy('update')).toHaveBeenCalledWith({ usage_limit: 50, expiration_date: '2027-01-01T00:00:00.000Z' });
            expect(stub.spy('eq')).toHaveBeenCalledWith('id', 'c1');
        });

        it('clears the expiration when no date is given', async () => {
            const stub = respondWith({ data: [{ id: 'c1' }] });
            await service.updateCoupon('c1', { usageLimit: null, expirationDate: null });
            expect(stub.spy('update')).toHaveBeenCalledWith({ usage_limit: null, expiration_date: null });
        });

        it('fails when no row was updated (blocked by permissions or missing id)', async () => {
            respondWith({ data: [] });
            await expectAsync(service.updateCoupon('c1', { usageLimit: 1, expirationDate: null })).toBeRejectedWithError(
                'Não foi possível atualizar o cupom.',
            );
        });

        it('throws the update error', async () => {
            respondWith({ error: { message: 'boom' } });
            await expectAsync(service.updateCoupon('c1', { usageLimit: 1, expirationDate: null })).toBeRejectedWithError('boom');
        });
    });
});
