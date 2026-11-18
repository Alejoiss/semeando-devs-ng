import { TestBed } from '@angular/core/testing';
import { CouponService } from './coupon';
import { SupabaseService } from './supabase';
import { createQueryStub, StubResult } from '../../testing/query-stub';

describe('CouponService', () => {
    let service: CouponService;
    let fromSpy: jasmine.Spy;

    function respondWith(result: StubResult) {
        const stub = createQueryStub(result);
        fromSpy.and.returnValue(stub.query);
        return stub;
    }

    const futureDate = () => new Date(Date.now() + 86_400_000).toISOString();
    const pastDate = () => new Date(Date.now() - 86_400_000).toISOString();

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy } } }],
        });
        service = TestBed.inject(CouponService);
        spyOn(console, 'error');
        spyOn(console, 'warn');
    });

    it('looks the coupon up by code in the coupons table', async () => {
        const stub = respondWith({ data: { id: 'c1', code: 'PROMO10', discount_type: 'percentage', discount_value: '10' } });

        const coupon = await service.validateCoupon('PROMO10');

        expect(fromSpy).toHaveBeenCalledWith('coupons');
        expect(stub.spy('eq')).toHaveBeenCalledWith('code', 'PROMO10');
        expect(coupon?.id).toBe('c1');
        expect(coupon?.discountValue).toBe(10);
    });

    it('returns null when the coupon does not exist', async () => {
        respondWith({ error: { code: 'PGRST116', message: 'no rows' } });
        expect(await service.validateCoupon('NOPE')).toBeNull();
    });

    it('returns null when the coupon is expired', async () => {
        respondWith({ data: { id: 'c1', code: 'OLD', expiration_date: pastDate() } });
        expect(await service.validateCoupon('OLD')).toBeNull();
    });

    it('accepts a coupon that has not expired yet', async () => {
        respondWith({ data: { id: 'c1', code: 'NEW', expiration_date: futureDate() } });
        expect((await service.validateCoupon('NEW'))?.id).toBe('c1');
    });

    it('accepts a coupon without expiration date', async () => {
        respondWith({ data: { id: 'c1', code: 'FOREVER' } });
        expect((await service.validateCoupon('FOREVER'))?.id).toBe('c1');
    });

    it('returns null when the usage limit was reached', async () => {
        respondWith({ data: { id: 'c1', code: 'FULL', usage_limit: 5, used_count: 5 } });
        expect(await service.validateCoupon('FULL')).toBeNull();
    });

    it('returns null when usage already exceeds the limit', async () => {
        respondWith({ data: { id: 'c1', code: 'OVER', usage_limit: 5, used_count: 9 } });
        expect(await service.validateCoupon('OVER')).toBeNull();
    });

    it('accepts a coupon with remaining uses', async () => {
        respondWith({ data: { id: 'c1', code: 'OK', usage_limit: 5, used_count: 4 } });
        expect((await service.validateCoupon('OK'))?.id).toBe('c1');
    });

    it('treats a missing limit as unlimited', async () => {
        respondWith({ data: { id: 'c1', code: 'UNL', usage_limit: null, used_count: 9999 } });
        expect((await service.validateCoupon('UNL'))?.id).toBe('c1');
    });
});
