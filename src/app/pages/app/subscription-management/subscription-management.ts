import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../services/subscription';
import { UserService } from '../../../services/user';
import { Subscription } from '../../../../models/subscription/subscription';

@Component({
    selector: 'app-subscription-management',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './subscription-management.html',
    styleUrl: './subscription-management.scss',
})
export class SubscriptionManagement implements OnInit {
    private subscriptionService = inject(SubscriptionService);
    private userService = inject(UserService);

    public activeSubscription = signal<Subscription | null>(null);
    public isLoading = signal<boolean>(true);
    public currentUser = this.userService.currentUser;

    protected isFreePro = computed(() => {
        const user = this.currentUser();
        const sub = this.activeSubscription();
        return !sub && user?.isPro && user?.proUntil;
    });

    async ngOnInit() {
        await this.fetchSubscription();
    }

    async fetchSubscription() {
        this.isLoading.set(true);
        try {
            const data = await this.subscriptionService.getActiveSubscription();
            this.activeSubscription.set(data ? new Subscription(data) : null);
        } catch (error) {
            console.error('Error fetching subscription', error);
            this.activeSubscription.set(null);
        } finally {
            this.isLoading.set(false);
        }
    }

    async cancelSubscription() {
        const sub = this.activeSubscription();
        if (!sub) return;

        if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return;

        this.isLoading.set(true);
        try {
            await this.subscriptionService.cancelSubscription(sub.id);
            await this.fetchSubscription(); // Refresh
        } catch (error) {
            console.error('Error canceling subscription', error);
            alert('Houve um erro ao cancelar a assinatura. Tente novamente.');
        } finally {
            this.isLoading.set(false);
        }
    }

    get remainingDiscountInstallments(): number | null {
        const sub = this.activeSubscription();
        if (!sub || !sub.coupon || !sub.coupon.durationMonths || sub.billingCycle !== 'monthly') return null;

        const now = new Date();
        const created = sub.createdAt;
        let monthsDiff = (now.getFullYear() - created.getFullYear()) * 12 + now.getMonth() - created.getMonth();

        if (now.getDate() < created.getDate()) {
            monthsDiff--;
        }

        const duration = sub.coupon.durationMonths;
        const remaining = duration - monthsDiff;
        return remaining > 0 ? remaining : 0;
    }

    get nextPaymentDate(): Date | null {
        const sub = this.activeSubscription();
        if (!sub) return null;

        const now = new Date();
        const created = sub.createdAt;
        const nextDate = new Date(created);

        if (sub.billingCycle === 'monthly') {
            // Find the next month occurrence
            let monthsDiff = (now.getFullYear() - created.getFullYear()) * 12 + now.getMonth() - created.getMonth();
            if (now.getDate() >= created.getDate()) {
                monthsDiff++;
            } else {
                monthsDiff = Math.max(1, monthsDiff);
            }
            nextDate.setMonth(created.getMonth() + monthsDiff);
        } else {
            let yearsDiff = now.getFullYear() - created.getFullYear();
            if (now.getMonth() > created.getMonth() || (now.getMonth() === created.getMonth() && now.getDate() >= created.getDate())) {
                yearsDiff++;
            } else {
                yearsDiff = Math.max(1, yearsDiff);
            }
            nextDate.setFullYear(created.getFullYear() + yearsDiff);
        }

        return nextDate;
    }
}
