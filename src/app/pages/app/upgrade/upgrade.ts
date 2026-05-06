import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../../services/plan';
import { CouponService } from '../../../services/coupon';
import { Plan } from '../../../../models/plan/plan';
import { Coupon } from '../../../../models/coupon/coupon';

@Component({
    selector: 'app-upgrade',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './upgrade.html',
    styleUrl: './upgrade.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Upgrade {
    private readonly planService = inject(PlanService);
    private readonly couponService = inject(CouponService);

    protected readonly plan = signal<Plan | null>(null);
    protected readonly coupon = signal<Coupon | null>(null);
    protected readonly couponCode = signal('');
    protected readonly couponError = signal<string | null>(null);
    protected readonly isLoading = signal(true);

    protected readonly discountedMonthlyPrice = computed(() => {
        const p = this.plan();
        const c = this.coupon();
        if (!p) return 0;
        if (!c) return p.monthlyPrice;

        if (c.discountType === 'percentage') {
            return p.monthlyPrice * (1 - c.discountValue / 100);
        }
        return Math.max(0, p.monthlyPrice - c.discountValue);
    });

    protected readonly discountedYearlyPrice = computed(() => {
        const p = this.plan();
        const c = this.coupon();
        if (!p) return 0;
        if (!c) return p.yearlyPrice;

        if (c.discountType === 'percentage') {
            return p.yearlyPrice * (1 - c.discountValue / 100);
        }
        return Math.max(0, p.yearlyPrice - c.discountValue);
    });

    constructor() {
        this.loadPlan();
    }

    private async loadPlan() {
        this.isLoading.set(true);
        const plan = await this.planService.getMainPlan();
        this.plan.set(plan);
        this.isLoading.set(false);
    }

    async applyCoupon() {
        const code = this.couponCode().trim().toUpperCase();
        if (!code) {
            this.coupon.set(null);
            this.couponError.set(null);
            return;
        }

        const coupon = await this.couponService.validateCoupon(code);
        if (coupon) {
            this.coupon.set(coupon);
            this.couponError.set(null);
        } else {
            this.coupon.set(null);
            this.couponError.set('Cupom inválido ou expirado');
        }
    }
}
