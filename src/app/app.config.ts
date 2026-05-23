import { provideHttpClient } from '@angular/common/http';
import {
    ApplicationConfig,
    importProvidersFrom,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection, isDevMode,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MarkdownModule, MARKED_OPTIONS, MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import { CodeEditorModule } from '@ngstack/code-editor';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export function markedOptionsFactory(): MarkedOptions {
    const renderer = new MarkedRenderer();
    renderer.html = ({ text }: any) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };
    return {
        renderer: renderer,
        gfm: true,
        breaks: false,
        pedantic: false,
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(),
        provideAnimations(),
        importProvidersFrom(MarkdownModule.forRoot(), CodeEditorModule.forRoot()),
        {
            provide: MARKED_OPTIONS,
            useFactory: markedOptionsFactory,
        },
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        })
    ]
};
