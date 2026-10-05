import { Component, ChangeDetectionStrategy, ElementRef, effect, inject, input, signal, computed, viewChild } from '@angular/core';
import { AdsenseService } from '../../services/adsense/adsense';

@Component({
    selector: 'app-ad-banner',
    imports: [],
    templateUrl: './ad-banner.html',
    styleUrl: './ad-banner.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdBannerComponent {
    private readonly adsenseService = inject(AdsenseService);

    readonly adSlot = input<string>('');
    readonly adFormat = input<string>('auto');
    readonly fullWidthResponsive = input<boolean>(true);
    readonly adStyle = input<{ [key: string]: string }>({ display: 'block' });

    readonly isAdEmpty = signal<boolean>(false);

    readonly slot = computed(() => this.adSlot() || this.adsenseService.footerAdSlot || '');

    readonly shouldShowAd = computed(() =>
        this.adsenseService.shouldShowAds() && !!this.slot() && !this.isAdEmpty()
    );

    readonly adClient = computed(() => this.adsenseService.adClient);

    private readonly insElement = viewChild<ElementRef<HTMLElement>>('adIns');

    constructor() {
        // O bloco é recriado a cada vez que volta a ser exibido (ex.: navegação entre rotas), e cada <ins> novo precisa de um push
        effect(() => {
            const ins = this.insElement();
            if (!ins) {
                return;
            }
            setTimeout(() => {
                this.adsenseService.pushAdBlock();
                this.detectAdFailure(ins.nativeElement);
            }, 100);
        });
    }

    private detectAdFailure(ins: HTMLElement): void {
        setTimeout(() => {
            const hasIframe = ins.querySelector('iframe');
            const adStatus = ins.getAttribute('data-ad-status');

            if (!hasIframe || adStatus === 'unfilled') {
                this.isAdEmpty.set(true);
            }
        }, 1500);
    }
}
