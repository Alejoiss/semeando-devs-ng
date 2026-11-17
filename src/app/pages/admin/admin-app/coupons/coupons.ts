import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import {
    Coupon,
    CouponDiscountType,
    CouponPlanType,
    CouponSortField,
} from '../../../../../models/coupon/coupon';
import { AdminCouponService } from '../../../../services/admin-coupon';
import { dateInputToExpiration, expirationToDateInput } from './coupon-dates';

interface SortableColumn {
    field: CouponSortField;
    label: string;
}

@Component({
    selector: 'app-admin-coupons',
    imports: [DatePipe, RouterLink, ReactiveFormsModule],
    templateUrl: './coupons.html',
    styleUrl: './coupons.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCoupons {
    private readonly couponService = inject(AdminCouponService);

    protected readonly pageSize = 20;

    readonly searchQuery = signal('');
    readonly discountTypeFilter = signal<CouponDiscountType | ''>('');
    readonly planTypeFilter = signal<CouponPlanType | ''>('');
    readonly sortField = signal<CouponSortField>('created_at');
    readonly sortDir = signal<'asc' | 'desc'>('desc');
    readonly currentPage = signal(0);

    readonly coupons = signal<Coupon[]>([]);
    readonly totalCount = signal(0);
    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);

    readonly editing = signal<Coupon | null>(null);
    readonly isSaving = signal(false);
    readonly editError = signal<string | null>(null);

    readonly searchControl = new FormControl('', { nonNullable: true });
    readonly editForm = new FormGroup({
        usageLimit: new FormControl<number | null>(null, [Validators.min(1), Validators.pattern(/^\d+$/)]),
        expirationDate: new FormControl('', { nonNullable: true }),
    });

    private readonly editDialog = viewChild<ElementRef<HTMLDialogElement>>('editDialog');
    private lastTrigger: HTMLElement | null = null;
    private requestId = 0;

    protected readonly discountTypes: CouponDiscountType[] = ['percentage', 'fixed'];
    protected readonly planTypes: CouponPlanType[] = ['all', 'monthly', 'yearly'];
    protected readonly sortableColumns: Record<string, SortableColumn> = {
        discountValue: { field: 'discount_value', label: 'Desconto' },
        usageLimit: { field: 'usage_limit', label: 'Limite de usos' },
        usedCount: { field: 'used_count', label: 'Usos' },
        expirationDate: { field: 'expiration_date', label: 'Expira em' },
        createdAt: { field: 'created_at', label: 'Criado em' },
    };

    constructor() {
        this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(value => {
            this.searchQuery.set(value);
            this.currentPage.set(0);
        });

        effect(() => {
            this.searchQuery();
            this.discountTypeFilter();
            this.planTypeFilter();
            this.sortField();
            this.sortDir();
            this.currentPage();
            untracked(() => this.loadCoupons());
        });
    }

    protected setDiscountTypeFilter(value: string) {
        this.discountTypeFilter.set(value as CouponDiscountType | '');
        this.currentPage.set(0);
    }

    protected setPlanTypeFilter(value: string) {
        this.planTypeFilter.set(value as CouponPlanType | '');
        this.currentPage.set(0);
    }

    protected toggleSort(field: CouponSortField) {
        if (this.sortField() === field) {
            this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortField.set(field);
            this.sortDir.set('desc');
        }
        this.currentPage.set(0);
    }

    protected ariaSort(field: CouponSortField): 'ascending' | 'descending' | 'none' {
        if (this.sortField() !== field) {
            return 'none';
        }
        return this.sortDir() === 'asc' ? 'ascending' : 'descending';
    }

    protected formatDiscount(coupon: Coupon): string {
        return coupon.discountType === 'percentage'
            ? `${coupon.discountValue}%`
            : coupon.discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    async loadCoupons() {
        const requestId = ++this.requestId;
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const result = await this.couponService.getCoupons({
                search: this.searchQuery(),
                discountType: this.discountTypeFilter(),
                planType: this.planTypeFilter(),
                sortField: this.sortField(),
                sortDir: this.sortDir(),
                page: this.currentPage(),
                pageSize: this.pageSize,
            });
            if (requestId !== this.requestId) {
                return;
            }
            this.coupons.set(result.coupons);
            this.totalCount.set(result.total);
        } catch (err: any) {
            if (requestId !== this.requestId) {
                return;
            }
            this.error.set(err.message || 'Não foi possível carregar os cupons. Tente novamente.');
            this.coupons.set([]);
            this.totalCount.set(0);
        } finally {
            if (requestId === this.requestId) {
                this.isLoading.set(false);
            }
        }
    }

    protected openEdit(coupon: Coupon, event: Event) {
        this.lastTrigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
        this.editing.set(coupon);
        this.editError.set(null);
        this.editForm.reset({
            usageLimit: coupon.usageLimit,
            expirationDate: expirationToDateInput(coupon.expirationDate),
        });
        this.editDialog()?.nativeElement.showModal();
    }

    protected closeEdit() {
        this.editDialog()?.nativeElement.close();
    }

    protected onEditClosed() {
        this.editing.set(null);
        this.lastTrigger?.focus();
    }

    protected async saveEdit() {
        const coupon = this.editing();
        if (!coupon || this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        const { usageLimit, expirationDate } = this.editForm.getRawValue();
        this.isSaving.set(true);
        this.editError.set(null);

        try {
            await this.couponService.updateCoupon(coupon.id, {
                usageLimit: usageLimit ?? null,
                expirationDate: dateInputToExpiration(expirationDate),
            });
            this.closeEdit();
            await this.loadCoupons();
        } catch (err: any) {
            this.editError.set(err.message || 'Não foi possível salvar as alterações.');
        } finally {
            this.isSaving.set(false);
        }
    }
}
