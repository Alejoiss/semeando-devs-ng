import { Component, ChangeDetectionStrategy, ElementRef, AfterViewInit, inject, input, signal, computed } from '@angular/core';
import { AdsenseService } from '../../services/adsense/adsense';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-ad-banner',
    imports: [],
    templateUrl: './ad-banner.html',
    styleUrl: './ad-banner.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdBannerComponent implements AfterViewInit {
    private readonly adsenseService = inject(AdsenseService);
    private readonly userService = inject(UserService);
    private readonly elementRef = inject(ElementRef);

    // Inputs using input() signals
    readonly adSlot = input<string>('');
    readonly adFormat = input<string>('auto');
    readonly fullWidthResponsive = input<boolean>(true);
    readonly adStyle = input<{ [key: string]: string }>({ display: 'block' });

    readonly isAdEmpty = signal<boolean>(false);

    readonly shouldShowAd = computed(() => {
        const user = this.userService.currentUser();
        // Exibe apenas se o AdSense estiver configurado, o usuário for do plano gratuito
        // e o banner não estiver marcado como vazio/bloqueado
        return this.adsenseService.isEnabled && user !== null && !user.isPro && !this.isAdEmpty();
    });

    readonly adClient = computed(() => this.adsenseService.adClient);

    ngAfterViewInit(): void {
        if (this.shouldShowAd()) {
            // Executa a inicialização do bloco de anúncio após uma pequena folga para renderização do DOM
            setTimeout(() => {
                this.adsenseService.pushAdBlock();
                this.detectAdFailure();
            }, 100);
        }
    }

    private detectAdFailure(): void {
        setTimeout(() => {
            try {
                const insElement = this.elementRef.nativeElement.querySelector('ins.adsbygoogle');
                if (insElement) {
                    const hasIframe = insElement.querySelector('iframe');
                    const adStatus = insElement.getAttribute('data-ad-status');
                    
                    // Se não houver iframe ou o status estiver explicitamente unfilled, colapsamos o layout
                    if (!hasIframe || adStatus === 'unfilled') {
                        this.isAdEmpty.set(true);
                        console.warn(`[AdBannerComponent] Bloco ${this.adSlot()} vazio ou bloqueado. Colapsando.`);
                    }
                } else {
                    this.isAdEmpty.set(true);
                }
            } catch (e) {
                console.error('[AdBannerComponent] Erro na detecção de adblock/status:', e);
                this.isAdEmpty.set(true);
            }
        }, 1500); // 1.5s é tempo suficiente para o AdSense injetar o iframe
    }
}
