import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminCoupons } from './coupons';
import { AdminCouponService } from '../../../../services/admin-coupon';
import { Coupon } from '../../../../../models/coupon/coupon';

describe('AdminCoupons', () => {
    let fixture: ComponentFixture<AdminCoupons>;
    let component: any;
    let service: jasmine.SpyObj<AdminCouponService>;

    const coupon = (over: object = {}) =>
        new Coupon({
            id: 'c1',
            code: 'NATAL20',
            discount_type: 'percentage',
            discount_value: 20,
            usage_limit: 50,
            used_count: 3,
            expiration_date: '2026-12-25T12:00:00',
            duration_months: 3,
            valid_for_plan_type: 'yearly',
            created_at: '2026-11-01T12:00:00',
            ...over,
        });

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const lastParams = () => service.getCoupons.calls.mostRecent().args[0];
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
    const dialog = () => fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

    async function settle() {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    // o evento `close` do <dialog> é disparado em uma tarefa posterior ao close()
    async function settleAfterClose() {
        await wait(30);
        await settle();
    }

    async function setup() {
        fixture = TestBed.createComponent(AdminCoupons);
        component = fixture.componentInstance;
        await settle();
    }

    beforeEach(() => {
        service = jasmine.createSpyObj('AdminCouponService', ['getCoupons', 'updateCoupon']);
        service.getCoupons.and.resolveTo({ coupons: [coupon(), coupon({ id: 'c2', code: 'FIXO10', discount_type: 'fixed', discount_value: 10, usage_limit: null, expiration_date: null, duration_months: null })], total: 2 });
        service.updateCoupon.and.resolveTo();
        TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AdminCouponService, useValue: service }] });
    });

    afterEach(() => {
        if (dialog()?.open) dialog().close();
    });

    describe('listing', () => {
        it('loads the first page with the default sort', async () => {
            await setup();

            expect(service.getCoupons).toHaveBeenCalledTimes(1);
            expect(lastParams()).toEqual({
                search: '', discountType: '', planType: '', sortField: 'created_at', sortDir: 'desc', page: 0, pageSize: 20,
            });
        });

        it('shows each coupon with discount, limits, expiration and tags', async () => {
            await setup();

            expect(text()).toContain('NATAL20');
            expect(text()).toContain('20%');
            expect(text()).toContain('25/12/2026');
            expect(text()).toContain('Sem expiração');
            expect(text()).toContain('Ilimitado');
            expect(text()).toMatch(/R\$\s10,00/);
        });

        it('shows the empty state', async () => {
            service.getCoupons.and.resolveTo({ coupons: [], total: 0 });
            await setup();

            expect(text()).toContain('Nenhum cupom encontrado.');
            expect(text()).toContain('0 cupons');
        });

        it('shows the range and total of the current page', async () => {
            service.getCoupons.and.resolveTo({ coupons: [coupon()], total: 45 });
            await setup();
            expect(text()).toContain('1–20 de 45 cupons');

            component.currentPage.set(2);
            await settle();
            expect(text()).toContain('41–45 de 45 cupons');
        });

        it('shows an error with a retry button', async () => {
            service.getCoupons.and.rejectWith(new Error('sem conexão'));
            await setup();

            expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('sem conexão');
            expect(component.coupons()).toEqual([]);

            service.getCoupons.and.resolveTo({ coupons: [coupon()], total: 1 });
            (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
            await settle();

            expect(text()).toContain('NATAL20');
        });

        it('uses a default error message', async () => {
            service.getCoupons.and.rejectWith({});
            await setup();
            expect(component.error()).toBe('Não foi possível carregar os cupons. Tente novamente.');
        });

        it('ignores the answer of an outdated request', async () => {
            let resolveFirst!: (v: any) => void;
            service.getCoupons.and.returnValues(
                new Promise(r => (resolveFirst = r)),
                Promise.resolve({ coupons: [coupon({ id: 'new', code: 'NOVO' })], total: 1 }),
            );
            fixture = TestBed.createComponent(AdminCoupons);
            component = fixture.componentInstance;
            fixture.detectChanges();

            component.currentPage.set(1);
            await settle();
            resolveFirst({ coupons: [coupon({ id: 'old', code: 'ANTIGO' })], total: 1 });
            await settle();

            expect(text()).toContain('NOVO');
            expect(text()).not.toContain('ANTIGO');
        });
    });

    describe('search and filters', () => {
        it('searches after a debounce and goes back to the first page', async () => {
            await setup();
            component.currentPage.set(3);
            await settle();

            component.searchControl.setValue('NATAL');
            await wait(100);
            expect(service.getCoupons).toHaveBeenCalledTimes(2);

            await wait(300);
            await settle();

            expect(lastParams().search).toBe('NATAL');
            expect(lastParams().page).toBe(0);
        });

        it('filters by discount type and plan type, resetting the page', async () => {
            await setup();
            component.currentPage.set(2);
            await settle();

            component.setDiscountTypeFilter('fixed');
            await settle();
            expect(lastParams().discountType).toBe('fixed');
            expect(lastParams().page).toBe(0);

            component.setPlanTypeFilter('monthly');
            await settle();
            expect(lastParams().planType).toBe('monthly');

            component.setPlanTypeFilter('');
            await settle();
            expect(lastParams().planType).toBe('');
        });
    });

    describe('sorting', () => {
        it('sorts a new column descending first', async () => {
            await setup();

            component.toggleSort('used_count');
            await settle();

            expect([lastParams().sortField, lastParams().sortDir]).toEqual(['used_count', 'desc']);
        });

        it('flips the direction when sorting the same column again', async () => {
            await setup();

            component.toggleSort('created_at');
            await settle();

            expect([lastParams().sortField, lastParams().sortDir]).toEqual(['created_at', 'asc']);
        });

        it('exposes the sort state for assistive technology', async () => {
            await setup();
            expect(component.ariaSort('created_at')).toBe('descending');
            expect(component.ariaSort('used_count')).toBe('none');

            component.toggleSort('created_at');
            expect(component.ariaSort('created_at')).toBe('ascending');
        });

        it('goes back to the first page when the sort changes', async () => {
            await setup();
            component.currentPage.set(2);
            await settle();

            component.toggleSort('discount_value');
            await settle();

            expect(lastParams().page).toBe(0);
        });
    });

    describe('pagination', () => {
        const nav = (label: string) => fixture.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;

        it('disables previous on the first page and next on the last', async () => {
            await setup();
            expect(nav('Página anterior').disabled).toBeTrue();
            expect(nav('Próxima página').disabled).toBeTrue();
        });

        it('moves between pages', async () => {
            service.getCoupons.and.resolveTo({ coupons: [coupon()], total: 45 });
            await setup();

            nav('Próxima página').click();
            await settle();
            expect(lastParams().page).toBe(1);

            nav('Página anterior').click();
            await settle();
            expect(lastParams().page).toBe(0);
        });
    });

    describe('editing a coupon', () => {
        const row = () => fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
        const submit = () => (dialog().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

        async function openFirst() {
            row().click();
            await settle();
        }

        it('opens a dialog filled with the usage limit and expiration', async () => {
            await setup();
            await openFirst();

            expect(dialog().open).toBeTrue();
            expect(dialog().textContent).toContain('NATAL20');
            expect(component.editForm.getRawValue()).toEqual({ usageLimit: 50, expirationDate: '2026-12-25' });
            expect((dialog().querySelector('#edit-usage-limit') as HTMLInputElement).value).toBe('50');
        });

        it('opens through the code button too, without opening twice', async () => {
            await setup();
            (fixture.nativeElement.querySelector('button[aria-label="Editar cupom NATAL20"]') as HTMLButtonElement).click();
            await settle();

            expect(dialog().open).toBeTrue();
            expect(component.editing().code).toBe('NATAL20');
        });

        it('saves the changes, closes and reloads the list', async () => {
            await setup();
            await openFirst();
            component.editForm.patchValue({ usageLimit: 100, expirationDate: '2027-01-31' });

            submit();
            await settle();
            await settleAfterClose();

            const [id, input] = service.updateCoupon.calls.mostRecent().args;
            expect(id).toBe('c1');
            expect(input.usageLimit).toBe(100);
            expect(input.expirationDate!.getFullYear()).toBe(2027);
            expect(input.expirationDate!.getDate()).toBe(31);
            expect(dialog().open).toBeFalse();
            expect(service.getCoupons).toHaveBeenCalledTimes(2);
            expect(component.editing()).toBeNull();
        });

        it('clears the limit and expiration when the fields are emptied', async () => {
            await setup();
            await openFirst();
            component.editForm.patchValue({ usageLimit: null, expirationDate: '' });

            submit();
            await settle();

            expect(service.updateCoupon).toHaveBeenCalledWith('c1', { usageLimit: null, expirationDate: null });
        });

        it('does not save an invalid limit and shows the validation message', async () => {
            await setup();
            await openFirst();
            component.editForm.patchValue({ usageLimit: 0 });

            submit();
            await settle();

            expect(service.updateCoupon).not.toHaveBeenCalled();
            expect(dialog().textContent).toContain('Informe um número inteiro maior que zero');
            expect(dialog().open).toBeTrue();
        });

        it('rejects decimals in the limit', async () => {
            await setup();
            await openFirst();
            component.editForm.patchValue({ usageLimit: 2.5 });
            expect(component.editForm.controls.usageLimit.invalid).toBeTrue();
        });

        it('keeps the dialog open and shows the error when saving fails', async () => {
            service.updateCoupon.and.rejectWith(new Error('Não foi possível atualizar o cupom.'));
            await setup();
            await openFirst();

            submit();
            await settle();

            expect(dialog().open).toBeTrue();
            expect(dialog().textContent).toContain('Não foi possível atualizar o cupom.');
            expect(component.isSaving()).toBeFalse();
        });

        it('cancels without saving and returns the focus to the trigger', async () => {
            await setup();
            const trigger = fixture.nativeElement.querySelector('button[aria-label="Editar cupom NATAL20"]') as HTMLButtonElement;
            trigger.click();
            await settle();

            (Array.from(dialog().querySelectorAll('button')).find(b => b.textContent!.includes('Cancelar')) as HTMLButtonElement).click();
            await settleAfterClose();

            expect(service.updateCoupon).not.toHaveBeenCalled();
            expect(dialog().open).toBeFalse();
            expect(component.editing()).toBeNull();
            expect(document.activeElement).toBe(trigger);
        });
    });
});
