import { slugify } from './slug';

describe('slugify', () => {
    it('lowercases and joins words with hyphens', () => {
        expect(slugify('Introdução ao HTML')).toBe('introducao-ao-html');
    });

    it('strips accents and cedilla', () => {
        expect(slugify('Ação média ç')).toBe('acao-media-c');
    });

    it('removes punctuation and symbols', () => {
        expect(slugify('C# & .NET: o guia!')).toBe('c-net-o-guia');
    });

    it('collapses repeated spaces and hyphens', () => {
        expect(slugify('a   b --- c')).toBe('a-b-c');
    });

    it('trims leading and trailing hyphens and spaces', () => {
        expect(slugify('  --Olá mundo--  ')).toBe('ola-mundo');
    });

    it('keeps digits', () => {
        expect(slugify('Angular 20 Signals')).toBe('angular-20-signals');
    });

    it('returns an empty string when nothing is left', () => {
        expect(slugify('!!!')).toBe('');
        expect(slugify('')).toBe('');
    });
});
