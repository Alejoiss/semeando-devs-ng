import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { environment } from '../../../../environments/environment';
import { SubscriptionService } from '../../../services/subscription';
import { PlanService } from '../../../services/plan';
import { CouponService } from '../../../services/coupon';
import { Plan } from '../../../../models/plan/plan';
import { Coupon } from '../../../../models/coupon/coupon';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './checkout.html',
    styleUrl: './checkout.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout implements OnInit, AfterViewInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly subscriptionService = inject(SubscriptionService);
    private readonly planService = inject(PlanService);
    private readonly couponService = inject(CouponService);

    protected readonly plan = signal<Plan | null>(null);
    protected readonly coupon = signal<Coupon | null>(null);
    protected readonly cycle = signal<'monthly' | 'yearly'>('monthly');
    protected readonly paymentMethod = signal<'card' | 'pix'>('card');
    
    protected readonly isLoading = signal(true);
    protected readonly isProcessing = signal(false);
    protected readonly error = signal<string | null>(null);

    // Form inputs for Card Token
    protected cardholderName = signal('');
    protected identificationType = signal('CPF');
    protected identificationNumber = signal('');
    
    private mp: any;
    private fields: any = {};

    protected readonly finalPrice = computed(() => {
        const p = this.plan();
        const c = this.coupon();
        const cy = this.cycle();
        if (!p) return 0;
        
        let basePrice = cy === 'monthly' ? p.monthlyPrice : p.yearlyPrice;
        if (!c) return basePrice;

        if (c.discountType === 'percentage') {
            return basePrice * (1 - c.discountValue / 100);
        }
        return Math.max(0, basePrice - c.discountValue);
    });

    async ngOnInit() {
        const params = this.route.snapshot.queryParams;
        if (!params['planId'] || !params['cycle']) {
            this.router.navigate(['/app/upgrade']);
            return;
        }

        this.cycle.set(params['cycle']);

        try {
            const plan = await this.planService.getMainPlan(); // Assuming single plan for now
            if (plan && plan.id !== params['planId']) {
                // If the user tries a different plan ID, just get the main one
                this.plan.set(plan);
            } else if (plan) {
                this.plan.set(plan);
            } else {
                throw new Error('Plano não encontrado');
            }

            if (params['couponCode']) {
                const coupon = await this.couponService.validateCoupon(params['couponCode']);
                if (coupon) {
                    this.coupon.set(coupon);
                }
            }
        } catch (err) {
            console.error(err);
            this.router.navigate(['/app/upgrade']);
            return;
        }

        this.isLoading.set(false);
        
        // Wait for the next tick to ensure the DOM is updated before mounting MP fields
        setTimeout(() => this.initializeMercadoPago(), 0);
    }

    async ngAfterViewInit() {
        // We handle initialization after data is loaded in ngOnInit
    }

    private async initializeMercadoPago() {
        if (this.paymentMethod() !== 'card') return;

        try {
            await loadMercadoPago();
            
            if (!this.mp) {
                this.mp = new (window as any).MercadoPago(environment.mlPublicKey, {
                    locale: 'pt-BR'
                });
            }

            // Ensure DOM elements are fully rendered before mounting
            const cardNumberContainer = document.getElementById('cardNumber');
            if (!cardNumberContainer) {
                console.warn('Mercado Pago containers not found in DOM yet. Retrying in 100ms...');
                setTimeout(() => this.initializeMercadoPago(), 100);
                return;
            }

            const style = {
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#dee5ff',
                placeholderColor: '#6b7280',
            };

            // Prevent re-initialization if fields already exist
            if (this.fields.cardNumber) {
                return;
            }

            // Create and mount each field individually (Correct SDK v2 syntax)
            this.fields.cardNumber = this.mp.fields.create('cardNumber', {
                placeholder: '0000 0000 0000 0000',
                style
            }).mount('cardNumber');

            this.fields.expirationDate = this.mp.fields.create('expirationDate', {
                placeholder: 'MM/AA',
                style
            }).mount('expirationDate');

            this.fields.securityCode = this.mp.fields.create('securityCode', {
                placeholder: 'CVV',
                style
            }).mount('securityCode');

            // Add focus/blur listeners for better UI
            Object.keys(this.fields).forEach(key => {
                this.fields[key].on('focus', () => {
                    document.querySelector(`#${key}`)?.classList.add('border-primary', 'ring-1', 'ring-primary/20');
                });
                this.fields[key].on('blur', () => {
                    document.querySelector(`#${key}`)?.classList.remove('border-primary', 'ring-1', 'ring-primary/20');
                });
            });

        } catch (err) {
            console.error('Error initializing Mercado Pago:', err);
            this.error.set('Erro ao carregar o processador de pagamentos. Por favor, recarregue a página.');
        }
    }

    protected setPaymentMethod(method: 'card' | 'pix') {
        this.paymentMethod.set(method);
        this.error.set(null);
    }

    protected async processPayment() {
        if (this.isProcessing()) return;
        
        this.isProcessing.set(true);
        this.error.set(null);

        try {
            const plan = this.plan();
            if (!plan) throw new Error('Plano não carregado');

            let cardTokenId = undefined;

            if (this.paymentMethod() === 'card') {
                if (!this.cardholderName() || !this.identificationNumber()) {
                    throw new Error('Preencha os dados do titular do cartão');
                }

                // Using createCardToken from the fields object
                const tokenResponse = await this.mp.fields.createCardToken({
                    cardholderName: this.cardholderName(),
                    identificationType: this.identificationType(),
                    identificationNumber: this.identificationNumber().replace(/\D/g, '')
                });

                if (tokenResponse?.id) {
                    cardTokenId = tokenResponse.id;
                } else {
                    // Try to extract error from MP response
                    const errorMsg = tokenResponse?.cause?.[0]?.description || 'Dados do cartão inválidos';
                    throw new Error(errorMsg);
                }
            }

            const response = await this.subscriptionService.createSubscription(
                plan.id,
                this.cycle(),
                this.paymentMethod(),
                this.coupon()?.code,
                cardTokenId
            );

            if (this.paymentMethod() === 'pix') {
                this.router.navigate(['/app/aguardando-pagamento'], {
                    queryParams: {
                        sid: response.subscription_id,
                        method: 'pix',
                        qr_code: response.qr_code,
                        qr_code_base64: response.qr_code_base64,
                    }
                });
            } else {
                this.router.navigate(['/app/aguardando-pagamento'], {
                    queryParams: {
                        sid: response.subscription_id,
                        method: 'card',
                    }
                });
            }

        } catch (err: any) {
            console.error('Checkout error:', err);
            
            // Map Mercado Pago error codes to user-friendly messages
            let friendlyMessage = 'Ocorreu um erro inesperado ao processar o pagamento. Tente novamente.';
            
            const errorCode = err.code || err.status || '';
            const errorMessage = err.message || '';

            if (errorCode === 'cc_rejected_other_reason' || errorMessage.includes('OTHE')) {
                friendlyMessage = 'Pagamento recusado por erro geral. Por favor, tente outro cartão.';
            } else if (errorCode === 'cc_rejected_call_for_authorize' || errorMessage.includes('CALL')) {
                friendlyMessage = 'Pagamento recusado. O emissor do cartão exige autorização prévia.';
            } else if (errorCode === 'cc_rejected_insufficient_amount' || errorMessage.includes('FUND')) {
                friendlyMessage = 'Pagamento recusado por saldo insuficiente no cartão.';
            } else if (errorCode === 'cc_rejected_bad_filled_security_code' || errorMessage.includes('SECU')) {
                friendlyMessage = 'Código de segurança (CVV) inválido.';
            } else if (errorCode === 'cc_rejected_bad_filled_date' || errorMessage.includes('EXPI')) {
                friendlyMessage = 'Data de vencimento do cartão inválida ou expirada.';
            } else if (errorCode === 'cc_rejected_bad_filled_other' || errorMessage.includes('FORM')) {
                friendlyMessage = 'Existem erros no preenchimento do formulário do cartão.';
            } else if (errorCode === 'pending' || errorMessage.includes('CONT')) {
                friendlyMessage = 'O pagamento está pendente de análise. Aguarde a confirmação.';
            } else if (err.message) {
                friendlyMessage = err.message; // Fallback to whatever message came from the backend
            }

            this.error.set(friendlyMessage);
        } finally {
            this.isProcessing.set(false);
        }
    }
}
