import { Injectable, InjectionToken, computed, effect, inject, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UserService } from '../user';
import { environment } from '../../../environments/environment';

export interface AdsenseConfig {
    client?: string;
    footerSlot?: string;
}

export const ADSENSE_CONFIG = new InjectionToken<AdsenseConfig>('ADSENSE_CONFIG', {
    providedIn: 'root',
    factory: () => ({
        client: (environment as any).adsenseClient,
        footerSlot: (environment as any).adsenseFooterSlot,
    }),
});

/**
 * Política do AdSense proíbe anúncios em telas sem conteúdo do editor (login, checkout,
 * pagamento, conclusão, navegação). Por isso os anúncios só aparecem em rotas marcadas
 * explicitamente com `data: { showAds: true }`.
 */
export const SHOW_ADS_ROUTE_DATA = { showAds: true };

@Injectable({
    providedIn: 'root',
})
export class AdsenseService {
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);
    private readonly config = inject(ADSENSE_CONFIG);

    private readonly scriptLoaded = signal<boolean>(false);
    private readonly isAdRoute = signal<boolean>(false);

    readonly adClient = this.config.client;
    readonly footerAdSlot = this.config.footerSlot;

    readonly isEnabled = !!this.adClient && !!this.footerAdSlot;

    readonly shouldShowAds = computed(() => {
        const user = this.userService.currentUser();
        return this.isEnabled && !!user && !user.isPro && this.isAdRoute();
    });

    constructor() {
        this.isAdRoute.set(this.routeAllowsAds(this.router.routerState?.snapshot?.root));

        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.isAdRoute.set(this.routeAllowsAds(this.router.routerState?.snapshot?.root));
        });

        effect(() => {
            if (this.shouldShowAds() && !this.scriptLoaded()) {
                this.injectAdSenseScript();
            }
        });
    }

    private routeAllowsAds(root: ActivatedRouteSnapshot | undefined): boolean {
        let route = root;
        while (route?.firstChild) {
            route = route.firstChild;
        }
        return route?.data?.['showAds'] === true;
    }

    private injectAdSenseScript(): void {
        try {
            if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
                this.scriptLoaded.set(true);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adClient}`;
            script.async = true;
            script.crossOrigin = 'anonymous';

            script.onerror = () => {
                console.error('[AdsenseService] Falha ao carregar o script do Google AdSense.');
            };

            document.head.appendChild(script);
            this.scriptLoaded.set(true);
        } catch (error) {
            console.error('[AdsenseService] Erro ao injetar script do AdSense:', error);
        }
    }

    /**
     * Executa a inicialização de um bloco de anúncio.
     * Deve ser invocado de forma segura após a renderização do bloco na view.
     */
    pushAdBlock(): void {
        try {
            // A fila precisa ficar no window para ser consumida quando o script terminar de carregar
            const w = window as any;
            w.adsbygoogle = w.adsbygoogle || [];
            w.adsbygoogle.push({});
        } catch (error) {
            console.error('[AdsenseService] Erro ao registrar bloco de anúncio:', error);
        }
    }

    isScriptLoaded(): boolean {
        return this.scriptLoaded();
    }
}
