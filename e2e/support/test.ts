import { test as base, expect } from '@playwright/test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
// O editor de código (desafio e criação de lição) carrega o Monaco deste CDN sob demanda
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
