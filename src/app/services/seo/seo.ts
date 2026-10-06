import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SeoData {
    title: string;
    description: string;
}

const SITE_URL = 'https://semeandodevs.com.br';
const PRIVATE_PREFIXES = ['/app', '/professor', '/admin', '/auth', '/recuperar-senha', '/redefinir-senha', '/nao-encontrado'];

@Injectable({
    providedIn: 'root',
})
export class SeoService {
    private readonly document = inject(DOCUMENT);
    private readonly meta = inject(Meta);
    private readonly title = inject(Title);
    private readonly router = inject(Router);

    /** Mantém canonical, og:url e robots coerentes com a URL atual a cada navegação. */
    init(): void {
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe(event => {
                const path = event.urlAfterRedirects.split(/[?#]/)[0];
                const url = `${environment.production ? SITE_URL : environment.urlBase}${path === '/' ? '' : path}`;
                this.setCanonical(url);
                this.meta.updateTag({ property: 'og:url', content: url });
                this.meta.updateTag({ name: 'twitter:url', content: url });
                const isPrivate = PRIVATE_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
                this.meta.updateTag({ name: 'robots', content: isPrivate ? 'noindex, follow' : 'index, follow' });
            });
    }

    update({ title, description }: SeoData): void {
        this.title.setTitle(title);
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: description });
    }

    private setCanonical(url: string): void {
        let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }
}
