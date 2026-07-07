import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UserService } from '../user';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdsenseService {
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    private readonly scriptLoaded = signal<boolean>(false);
    private readonly isAppRoute = signal<boolean>(false);

    // Google AdSense settings from environment (with mock defaults)
    readonly adClient = (environment as any).adsenseClient || 'ca-pub-1234567890123456';
    readonly headerAdSlot = (environment as any).adsenseHeaderSlot || '1111111111';
    readonly footerAdSlot = (environment as any).adsenseFooterSlot || '2222222222';

    constructor() {
        // Escuta eventos de navegação para determinar se está sob a rota da área interna /app
        this.isAppRoute.set(this.router.url.startsWith('/app'));
        
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd)
        ).subscribe((event) => {
            this.isAppRoute.set(event.urlAfterRedirects.startsWith('/app'));
        });

        // Efeito reativo para carregar o script de anúncios quando necessário
        effect(() => {
            const user = this.userService.currentUser();
            const isApp = this.isAppRoute();
            const alreadyLoaded = this.scriptLoaded();

            if (user && !user.isPro && isApp && !alreadyLoaded) {
                this.injectAdSenseScript();
            }
        });
    }

    private injectAdSenseScript(): void {
        try {
            // Previne injeção duplicada de script na página
            if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
                this.scriptLoaded.set(true);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adClient}`;
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                this.scriptLoaded.set(true);
                console.log('[AdsenseService] Script do Google AdSense carregado com sucesso.');
            };

            script.onerror = () => {
                console.error('[AdsenseService] Falha ao carregar o script do Google AdSense.');
            };

            document.head.appendChild(script);
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
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
        } catch (error) {
            console.error('[AdsenseService] Erro ao registrar bloco de anúncio:', error);
        }
    }

    /**
     * Verifica se o script do AdSense foi carregado com sucesso.
     */
    isScriptLoaded(): boolean {
        return this.scriptLoaded();
    }
}
