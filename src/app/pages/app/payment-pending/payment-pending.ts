import {
    ChangeDetectionStrategy,
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SubscriptionService } from '../../../services/subscription';
import { UserService } from '../../../services/user';

@Component({
    selector: 'app-payment-pending',
    templateUrl: './payment-pending.html',
    styleUrl: './payment-pending.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule],
})
export class PaymentPending implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly subscriptionService = inject(SubscriptionService);
    private readonly userService = inject(UserService);

    protected readonly paymentMethod = signal<'card' | 'pix'>('card');
    protected readonly pixQrCode = signal<string | null>(null);
    protected readonly pixQrCodeBase64 = signal<string | null>(null);
    protected readonly showSuccessModal = signal(false);

    private realtimeChannel: RealtimeChannel | null = null;

    ngOnInit(): void {
        const params = this.route.snapshot.queryParams;
        const subscriptionId = params['sid'];
        const method = params['method'] as 'card' | 'pix';

        if (!subscriptionId) {
            this.router.navigate(['/app/upgrade']);
            return;
        }

        if (method) {
            this.paymentMethod.set(method);
        }

        if (method === 'pix') {
            this.pixQrCode.set(params['qr_code'] ?? null);
            this.pixQrCodeBase64.set(params['qr_code_base64'] ?? null);
        }

        this.realtimeChannel = this.subscriptionService.watchSubscriptionStatus(
            subscriptionId,
            () => this.onPaymentConfirmed(),
        );
    }

    ngOnDestroy(): void {
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
        }
    }

    private async onPaymentConfirmed(): Promise<void> {
        await this.userService.loadUserProfile();
        this.showSuccessModal.set(true);
    }

    protected closeModalAndNavigate(): void {
        this.showSuccessModal.set(false);
        this.router.navigate(['/app/gerenciar-assinatura']);
    }

    protected copyPixCode(): void {
        const code = this.pixQrCode();
        if (code) {
            navigator.clipboard.writeText(code);
        }
    }
}
