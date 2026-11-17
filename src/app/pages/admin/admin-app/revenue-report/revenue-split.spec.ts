import { distributeCents, percentChange, toCents } from './revenue-split';

describe('revenue-split', () => {
    it('converte reais em centavos sem erro de ponto flutuante', () => {
        expect(toCents(10.1)).toBe(1010);
        expect(toCents(0.29)).toBe(29);
        expect(toCents(null)).toBe(0);
    });

    it('distribui proporcionalmente e a soma bate com o total', () => {
        const shares = distributeCents(500000, [50, 30, 20]);
        expect(shares).toEqual([250000, 150000, 100000]);
    });

    it('reparte centavos restantes sem perder nenhum', () => {
        const shares = distributeCents(100, [1, 1, 1]);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
        expect(shares.sort()).toEqual([33, 33, 34]);
    });

    it('retorna zeros quando não há valor ou lições', () => {
        expect(distributeCents(0, [1, 2])).toEqual([0, 0]);
        expect(distributeCents(1000, [0, 0])).toEqual([0, 0]);
        expect(distributeCents(1000, [])).toEqual([]);
    });

    it('calcula variação percentual e ignora mês anterior zerado', () => {
        expect(percentChange(150, 100)).toBe(50);
        expect(percentChange(50, 100)).toBe(-50);
        expect(percentChange(10, 0)).toBeNull();
    });
});
