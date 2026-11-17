export const TEACHERS_SHARE = 0.5;

export function toCents(value: number | null | undefined): number {
    return Number.isFinite(value) ? Math.round((value as number) * 100) : 0;
}

/** Distribui um total em centavos proporcionalmente aos pesos, sem perder nem criar centavos. */
export function distributeCents(totalCents: number, weights: number[]): number[] {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalCents <= 0 || totalWeight <= 0) {
        return weights.map(() => 0);
    }

    const exact = weights.map(weight => (totalCents * weight) / totalWeight);
    const shares = exact.map(Math.floor);
    let remainder = totalCents - shares.reduce((sum, share) => sum + share, 0);

    const byFraction = exact
        .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
        .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

    for (const { index } of byFraction) {
        if (remainder <= 0) break;
        shares[index] += 1;
        remainder -= 1;
    }
    return shares;
}

export function percentChange(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}
