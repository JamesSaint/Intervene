/**
 * Links, previews, layout and accessibility across the pages changed by
 * the commercial alignment package.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CHANGED = ['/', '/agda/', '/services/', '/methodology/', '/sample-report/', '/verify/', '/contact/', '/about/', '/network/', '/intervention-readiness/', '/intervention-readiness/vs-audit/'];

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (e.endsWith('.html')) out.push(full);
  }
  return out;
}

test('every internal href in dist resolves', async () => {
  const dist = 'dist';
  const missing: string[] = [];
  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = m[1];
      const target = href.endsWith('/') ? join(dist, href, 'index.html') : join(dist, href);
      if (!existsSync(target)) missing.push(`${file} -> ${href}`);
    }
  }
  expect(missing).toEqual([]);
});

test('glossary anchors resolve', async ({ page }) => {
  await page.goto('/glossary/');
  for (const id of ['deterministic-verdict', 'intervention-capability-assessment']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

for (const route of CHANGED) {
  test(`${route}: og:image resolves, one h1, no horizontal scroll, no serious axe violations`, async ({ page, request }) => {
    await page.goto(route);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toBeTruthy();
    const res = await request.get(og!.replace('https://intervene.uk', ''));
    expect(res.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, 'horizontal scroll').toBe(false);
    const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('headings are sequential on the sample and verify pages', async ({ page }) => {
  for (const route of ['/sample-report/', '/verify/', '/services/']) {
    await page.goto(route);
    const levels = await page.locator('main h1, main h2, main h3').evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1], `${route} heading jump at ${i}`).toBeLessThanOrEqual(1);
    }
  }
});
