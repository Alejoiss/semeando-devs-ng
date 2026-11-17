import { buildNewsletterPreviewHtml } from './newsletter-preview';

describe('buildNewsletterPreviewHtml', () => {
    it('wraps the body in the default card with the call to action', () => {
        const html = buildNewsletterPreviewHtml({ body: 'Oi{{nome_virgula}}!\nNovidade', ctaUrl: 'https://x.com', ctaLabel: 'Ver' });
        expect(html).toContain('Informativo Semeando Devs');
        expect(html).toContain('Oi, Maria!<br>Novidade');
        expect(html).toContain('href="https://x.com"');
        expect(html).toContain('Ver');
    });

    it('omits the button when there is no url', () => {
        expect(buildNewsletterPreviewHtml({ body: 'Oi' })).not.toContain('<a href');
    });

    it('uses the custom html as is when provided', () => {
        const html = buildNewsletterPreviewHtml({ body: 'texto', html: '<p>Olá{{nome_virgula}}</p>' });
        expect(html).toBe('<p>Olá, Maria</p>');
    });
});
