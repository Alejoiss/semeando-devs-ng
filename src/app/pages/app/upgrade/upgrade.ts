import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../../services/plan';
import { CouponService } from '../../../services/coupon';
import { SubscriptionService } from '../../../services/subscription';
import { UserService } from '../../../services/user';
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
    private readonly subscriptionService = inject(SubscriptionService);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    protected readonly plan = signal<Plan | null>(null);
    protected readonly coupon = signal<Coupon | null>(null);
    protected readonly couponCode = signal('');
    protected readonly couponError = signal<string | null>(null);
    protected readonly isLoading = signal(true);
    protected readonly isSubscribing = signal(false);
    protected readonly subscriptionError = signal<string | null>(null);
    protected readonly showConfirmation = signal(false);

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

        // For fixed coupons: apply the monthly discount scaled to 12 months,
        // then apply the same annual discount factor embedded in yearlyPrice.
        const annualFactor = p.monthlyPrice > 0 ? p.yearlyPrice / (p.monthlyPrice * 12) : 1;
        const discountedMonthly = Math.max(0, p.monthlyPrice - c.discountValue);
        return Math.round(discountedMonthly * 12 * annualFactor * 100) / 100;
    });

    protected readonly isOneHundredPercentDiscount = computed(() => {
        const c = this.coupon();
        return c?.discountType === 'percentage' && c?.discountValue === 100;
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

    async subscribe(cycle: 'monthly' | 'yearly') {
        const currentPlan = this.plan();
        if (!currentPlan) return;

        if (this.isOneHundredPercentDiscount()) {
            this.showConfirmation.set(true);
            return;
        }

        this.router.navigate(['/app/checkout'], {
            queryParams: {
                planId: currentPlan.id,
                cycle: cycle,
                couponCode: this.coupon()?.code || undefined
            }
        });
    }

    async activatePro() {
        const c = this.coupon();
        if (!c || !this.isOneHundredPercentDiscount()) return;

        this.isSubscribing.set(true);
        this.subscriptionError.set(null);
        this.showConfirmation.set(false);

        try {
            await this.subscriptionService.activateProWithCoupon(c);
            await this.userService.loadUserProfile();
            this.router.navigate(['/app/gerenciar-assinatura']);
        } catch (error: any) {
            this.subscriptionError.set(error.message || 'Erro ao ativar Pro');
        } finally {
            this.isSubscribing.set(false);
        }
    }
}
