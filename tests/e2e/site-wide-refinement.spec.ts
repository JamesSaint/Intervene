import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

const routes = readdirSync('dist', { recursive: true })
  .map(String)
  .filter((path) => path.endsWith('.html') && !path.startsWith('assets/') && path !== 'method/index.html')
  .map((path) => path === 'index.html' ? '/' : `/${path.replace(/index\.html$/, '')}`);

// These checks catch clipped descendants, which body overflow:hidden can
// conceal from a document-level scroll-width assertion.
for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
  test(`every rendered page keeps content inside the ${width}px viewport`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
    await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
    for (const route of routes) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const clipped = await page.locator('main *, footer *').evaluateAll((els) => els.filter((el) => {
        if (el.closest('.code-block, .envelope')) return false;
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return box.width > 0 && style.position !== 'absolute' && (box.left < -1 || box.right > innerWidth + 1);
      }).map((el) => `${el.tagName}.${el.className}`));
      expect(clipped, route).toEqual([]);
    }
  });
}

test('mobile heroes retain supporting copy before their actions', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ['/', '/services/', '/agda/']) {
    await page.goto(route);
    const copy = page.locator('.hero-sub, .hero > .wrap > .lede').first();
    const actions = page.locator('.hero-cta').first();
    const copyBox = await copy.boundingBox();
    const actionBox = await actions.boundingBox();
    expect(actionBox!.y, route).toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height);
  }
});

test('desktop evidence labels, values and explanations align across stages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  for (const selector of ['.fc-n', '.fc-value', '.fc-rel', '.fc-note']) {
    const tops = await page.locator(selector).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size, selector).toBe(1);
  }
});
