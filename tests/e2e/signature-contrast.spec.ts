/**
 * The email signature's link colour: a known, recorded accessibility
 * limitation, kept visible here so that it cannot widen unnoticed.
 *
 * The signature is an emailed artefact. Its links carry one inline colour,
 * the brand bronze #c9b694, because a pasted signature has no stylesheet and
 * one colour must serve light and dark message canvases. That colour is
 * asserted by tests/e2e/signature.spec.ts. On a white canvas it does not
 * meet WCAG 2.2 AA contrast for text; on dark canvases it does.
 *
 * These tests state exactly what fails and assert that nothing else on the
 * page does. They do not excuse the failure. See docs/redesign-record.md,
 * "Email signature contrast".
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BRONZE = [201, 182, 148];
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: number[], b: number[]) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

test('the only contrast failures on the signature page are the bronze links in the light preview', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.goto('/signature/', { waitUntil: 'networkidle' });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    // One rule, and only inside the light preview frame, and only on signature links.
    expect(result.violations.map((v) => v.id), scheme).toEqual(['color-contrast']);
    const nodes = result.violations[0].nodes;
    expect(nodes.length, scheme).toBe(3);
    for (const node of nodes) {
      expect(node.target[0], scheme).toBe('iframe[title="Light signature preview"]');
      expect(String(node.target[1]), scheme).toMatch(/sig-link|mailto:/);
    }
  }
});

test('the bronze link colour is measured against representative message canvases', () => {
  // Light canvases: the colour does not reach 4.5:1 for text, nor 3:1.
  for (const canvas of ['#ffffff', '#f6f8fc', '#faf9f8']) {
    expect(ratio(BRONZE, hex(canvas)), canvas).toBeLessThan(3);
  }
  expect(ratio(BRONZE, hex('#ffffff'))).toBeCloseTo(2.0, 1);
  // Dark canvases: it passes AA for text on each.
  for (const canvas of ['#1a1a1a', '#1e1e1e', '#202124', '#292929', '#000000']) {
    expect(ratio(BRONZE, hex(canvas)), canvas).toBeGreaterThanOrEqual(4.5);
  }
});

test('no single link colour can meet AA text contrast on both white and dark canvases', () => {
  // AA on white needs a luminance of at most 0.183; AA on #1e1e1e needs at least 0.235. The ranges do not meet.
  const maxOnWhite = 1.05 / 4.5 - 0.05;
  const minOnDark = 4.5 * (lum(hex('#1e1e1e')) + 0.05) - 0.05;
  expect(maxOnWhite).toBeLessThan(minOnDark);
  // The darker brand bronze already used in the signature passes on white and fails on dark.
  expect(ratio(hex('#7a6c55'), hex('#ffffff'))).toBeGreaterThanOrEqual(4.5);
  expect(ratio(hex('#7a6c55'), hex('#1e1e1e'))).toBeLessThan(4.5);
});
