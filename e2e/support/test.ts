import { test as base, expect } from '@playwright/test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
// O app inteiro espera o loader do Monaco deste CDN antes de iniciar (bug-app-boot-blocked-by-monaco-cdn)
const REQUIRED_CDN = 'cdn.jsdelivr.net';

export const test = base.extend({
    context: async ({ context }, use) => {
        await context.route(
            url => url.protocol.startsWith('http') && !LOCAL_HOSTS.has(url.hostname) && url.hostname !== REQUIRED_CDN,
            route => route.abort(),
        );
        await use(context);
    },
});

export { expect };
