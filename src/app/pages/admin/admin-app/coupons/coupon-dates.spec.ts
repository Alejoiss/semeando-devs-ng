import { dateInputToExpiration, expirationToDateInput } from './coupon-dates';

describe('coupon-dates', () => {
    describe('dateInputToExpiration', () => {
        it('returns null for empty values', () => {
            expect(dateInputToExpiration('')).toBeNull();
            expect(dateInputToExpiration(null)).toBeNull();
            expect(dateInputToExpiration(undefined)).toBeNull();
        });

        it('sets the expiration at the end of the chosen local day', () => {
            const date = dateInputToExpiration('2026-03-05')!;
            expect(date.getFullYear()).toBe(2026);
            expect(date.getMonth()).toBe(2);
            expect(date.getDate()).toBe(5);
            expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([23, 59, 59]);
        });
    });

    describe('expirationToDateInput', () => {
        it('returns an empty string for null', () => {
            expect(expirationToDateInput(null)).toBe('');
        });

        it('formats with zero-padded month and day', () => {
            expect(expirationToDateInput(new Date(2026, 0, 9))).toBe('2026-01-09');
            expect(expirationToDateInput(new Date(2026, 11, 31))).toBe('2026-12-31');
        });

        it('round-trips with dateInputToExpiration', () => {
            expect(expirationToDateInput(dateInputToExpiration('2027-07-15'))).toBe('2027-07-15');
        });
    });
});
