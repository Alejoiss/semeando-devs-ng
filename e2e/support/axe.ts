import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export async function expectNoAxeViolations(page: Page, options: { exclude?: string[] } = {}) {
    let builder = new AxeBuilder({ page }).withTags(WCAG_AA);
    for (const selector of options.exclude ?? []) {
        builder = builder.exclude(selector);
    }
    const { violations } = await builder.analyze();
    expect(
        violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.nodes[0]?.target.join(' ')}`),
    ).toEqual([]);
}
