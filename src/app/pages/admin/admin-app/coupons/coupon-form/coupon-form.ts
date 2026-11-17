import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CouponDiscountType, CouponPlanType, NewCouponInput } from '../../../../../../models/coupon/coupon';
import { AdminCouponService } from '../../../../../services/admin-coupon';
import { dateInputToExpiration } from '../coupon-dates';

const MAX_BULK_COUPONS = 100;
const CODE_PATTERN = /^[A-Z0-9_-]+$/;

export function parseSuffixes(raw: string): string[] {
    return raw
        .replace(/^\s*\[/, '')
        .replace(/\]\s*$/, '')
        .split(/[,\n]/)
        .map(part => part.trim().replace(/^["']|["']$/g, '').trim())
        .filter(part => part.length > 0);
}

@Component({
    selector: 'app-admin-coupon-form',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './coupon-form.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        dialog::backdrop {
            background: rgb(0 0 0 / 0.6);
            backdrop-filter: blur(4px);
        }
    `,
})
export class AdminCouponForm {
    private readonly couponService = inject(AdminCouponService);
    private readonly router = inject(Router);

    protected readonly discountTypes: CouponDiscountType[] = ['percentage', 'fixed'];
    protected readonly planTypes: CouponPlanType[] = ['all', 'monthly', 'yearly'];
    protected readonly maxBulk = MAX_BULK_COUPONS;

    readonly form = new FormGroup({
        code: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.pattern(CODE_PATTERN)],
        }),
        discountType: new FormControl<CouponDiscountType>('percentage', { nonNullable: true }),
        discountValue: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
        durationMonths: new FormControl<number | null>(null, [Validators.min(1), Validators.pattern(/^\d+$/)]),
        validForPlanType: new FormControl<CouponPlanType>('all', { nonNullable: true }),
        expirationDate: new FormControl('', { nonNullable: true }),
    });

    readonly isSaving = signal(false);
    readonly saveError = signal<string | null>(null);

    readonly suffixesControl = new FormControl('', { nonNullable: true });
    readonly suffixesInput = signal('');
    readonly suffixes = computed(() => parseSuffixes(this.suffixesInput()));
    readonly bulkError = signal<string | null>(null);

    private readonly bulkDialog = viewChild<ElementRef<HTMLDialogElement>>('bulkDialog');

    constructor() {
        this.suffixesControl.valueChanges.subscribe(value => {
            this.suffixesInput.set(value);
            this.bulkError.set(null);
        });
    }

    protected onCodeInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const upper = input.value.toUpperCase();
        if (upper !== input.value) {
            input.value = upper;
        }
        this.form.controls.code.setValue(upper);
    }

    protected showError(name: 'code' | 'discountValue' | 'durationMonths'): boolean {
        const control = this.form.controls[name];
        return control.touched && control.invalid;
    }

    protected async save() {
        const input = this.buildInput(this.form.controls.code.value);
        if (!input) {
            return;
        }
        await this.submit([input]);
    }

    protected openBulk() {
        if (!this.buildInput(this.form.controls.code.value)) {
            return;
        }
        this.bulkError.set(null);
        this.bulkDialog()?.nativeElement.showModal();
    }

    protected closeBulk() {
        this.bulkDialog()?.nativeElement.close();
    }

    protected async saveBulk() {
        const suffixes = this.suffixes();
        const base = this.form.controls.code.value;

        if (suffixes.length === 0) {
            this.bulkError.set('Informe ao menos um valor na lista.');
            return;
        }
        if (suffixes.length > MAX_BULK_COUPONS) {
            this.bulkError.set(`O máximo é de ${MAX_BULK_COUPONS} cupons por vez.`);
            return;
        }

        const codes = suffixes.map(suffix => `${base}${suffix}`.toUpperCase());
        if (codes.some(code => !CODE_PATTERN.test(code))) {
            this.bulkError.set('Os valores só podem conter letras, números, hífen e underscore.');
            return;
        }
        if (new Set(codes).size !== codes.length) {
            this.bulkError.set('A lista contém valores repetidos.');
            return;
        }

        const inputs = codes.map(code => this.buildInput(code));
        if (inputs.some(input => !input)) {
            this.closeBulk();
            return;
        }

        await this.submit(inputs as NewCouponInput[], this.bulkError);
    }

    private buildInput(code: string): NewCouponInput | null {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return null;
        }

        const value = this.form.getRawValue();
        if (value.discountType === 'percentage' && (value.discountValue ?? 0) > 100) {
            this.form.controls.discountValue.setErrors({ max: true });
            this.form.controls.discountValue.markAsTouched();
            return null;
        }

        return {
            code,
            discountType: value.discountType,
            discountValue: value.discountValue as number,
            validForPlanType: value.validForPlanType,
            durationMonths: value.durationMonths ?? null,
            expirationDate: dateInputToExpiration(value.expirationDate),
        };
    }

    private async submit(inputs: NewCouponInput[], errorTarget = this.saveError): Promise<void> {
        this.isSaving.set(true);
        this.saveError.set(null);
        this.bulkError.set(null);

        try {
            await this.couponService.createCoupons(inputs);
            await this.router.navigate(['/admin/cadastro-de-cupons']);
            return;
        } catch (err: any) {
            errorTarget.set(err.message || 'Não foi possível salvar o cupom.');
        } finally {
            this.isSaving.set(false);
        }
    }
}
