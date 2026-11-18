import { TestBed } from '@angular/core/testing';
import { PlanService } from './plan';
import { SupabaseService } from './supabase';
import { createQueryStub, StubResult } from '../../testing/query-stub';

describe('PlanService', () => {
    let service: PlanService;
    let fromSpy: jasmine.Spy;

    function respondWith(result: StubResult) {
        const stub = createQueryStub(result);
        fromSpy.and.returnValue(stub.query);
        return stub;
    }

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy } } }],
        });
        service = TestBed.inject(PlanService);
        spyOn(console, 'error');
    });

    it('fetches the plan flagged as main and maps its fields', async () => {
        const stub = respondWith({
            data: { id: 'p1', name: 'Pró', monthly_price: '29.9', yearly_price: '299', is_main: true },
        });

        const plan = await service.getMainPlan();

        expect(fromSpy).toHaveBeenCalledWith('plans');
        expect(stub.spy('eq')).toHaveBeenCalledWith('is_main', true);
        expect(plan?.name).toBe('Pró');
        expect(plan?.monthlyPrice).toBe(29.9);
        expect(plan?.yearlyPrice).toBe(299);
        expect(plan?.isMain).toBeTrue();
    });

    it('returns null on query error', async () => {
        respondWith({ error: { message: 'boom' } });
        expect(await service.getMainPlan()).toBeNull();
    });

    it('returns null when there is no data', async () => {
        respondWith({ data: null });
        expect(await service.getMainPlan()).toBeNull();
    });
});
