/**
 * The email signature's links: text contrast on light and dark canvases.
 *
 * A pasted signature has no stylesheet and carries one inline style, so a
 * link cannot switch colour between a light and a dark message. Until commit
 * f7a13c4 the link text was the brand gold, #c9b694, which reads on dark
 * canvases and fails on white (1.98:1). No single text colour can meet 4.5:1
 * on both, as the last test shows. The link text therefore inherits the
 * message's own text colour, and the gold is kept as the underline.
 *
 * Limitation, stated here so it is not lost: the gold underline is itself
 * 1.98:1 against white. The link text meets contrast; the underline is a
 * brand mark and is not relied on to make the text readable.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signatureFragment } from '../../src/lib/email-signature';

const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: number[], b: number[]) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb = (css: string) => css.match(/\d+/g)!.slice(0, 3).map(Number);

// Representative canvases and the text colour a message carries on each.
// Chosen values, not sampled from the clients themselves.
const canvases = [
  { name: 'white', bg: '#ffffff', text: '#000000' },
  { name: 'Gmail light reading pane', bg: '#f6f8fc', text: '#1f1f1f' },
  { name: 'Outlook light', bg: '#faf9f8', text: '#201f1e' },
  { name: 'Apple Mail dark', bg: '#1e1e1e', text: '#ffffff' },
  { name: 'Gmail dark', bg: '#202124', text: '#e8eaed' },
  { name: 'Outlook dark', bg: '#292929', text: '#ffffff' },
  { name: 'site charcoal preview', bg: '#1a1a1a', text: '#f0f0f0' },
];

test('the signature page has no accessibility violations in either appearance', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.goto('/signature/', { waitUntil: 'networkidle' });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), scheme).toEqual([]);
  }
});

for (const canvas of canvases) {
  test(`pasted signature links meet text contrast on ${canvas.name}`, async ({ page }) => {
    // The copied fragment, with no stylesheet, in a message of this canvas and text colour.
    await page.setContent(`<html><head></head><body style="margin:0;background:${canvas.bg};color:${canvas.text}">${signatureFragment}</body></html>`);
    const links = page.locator('.sig-link');
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      const colour = await link.evaluate((el) => getComputedStyle(el).color);
      // The actual rendered text colour is the message's own, and it meets AA against the canvas.
      expect(rgb(colour), canvas.name).toEqual(hex(canvas.text));
      expect(ratio(rgb(colour), hex(canvas.bg)), canvas.name).toBeGreaterThanOrEqual(4.5);
      // The brand gold is still there, as the underline.
      expect(await link.evaluate((el) => [getComputedStyle(el).borderBottomColor, getComputedStyle(el).borderBottomStyle, getComputedStyle(el).borderBottomWidth])).toEqual(['rgb(201, 182, 148)', 'solid', '2px']);
    }
  });
}

test('the previous gold link text failed on light canvases and passed on dark ones', () => {
  const gold = hex('#c9b694');
  expect(ratio(gold, hex('#ffffff'))).toBeCloseTo(1.98, 1);
  for (const c of canvases.slice(0, 3)) expect(ratio(gold, hex(c.bg)), c.name).toBeLessThan(3);
  for (const c of canvases.slice(3)) expect(ratio(gold, hex(c.bg)), c.name).toBeGreaterThanOrEqual(4.5);
});

test('no single link colour can meet AA text contrast on both white and a dark canvas', () => {
  // AA on white needs a luminance of at most 0.183; AA on #1e1e1e needs at least 0.235. The ranges do not meet.
  const maxOnWhite = 1.05 / 4.5 - 0.05;
  const minOnDark = 4.5 * (lum(hex('#1e1e1e')) + 0.05) - 0.05;
  expect(maxOnWhite).toBeLessThan(minOnDark);
});
