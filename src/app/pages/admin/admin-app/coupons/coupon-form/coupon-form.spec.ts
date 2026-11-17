import { parseSuffixes } from './coupon-form';

describe('parseSuffixes', () => {
    it('parses a bracketed list', () => {
        expect(parseSuffixes('[123, 456, 789]')).toEqual(['123', '456', '789']);
    });

    it('parses quoted values and new lines', () => {
        expect(parseSuffixes('["A", \'B\'\nC]')).toEqual(['A', 'B', 'C']);
    });

    it('ignores empty entries', () => {
        expect(parseSuffixes('[ , ]')).toEqual([]);
    });
});
