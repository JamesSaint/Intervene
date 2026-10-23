import { test, expect } from '@playwright/test';

// Visitor-controlled URL parts reach the page. None may execute, inject markup
// or stop later scripts from running.
const hashes = [
  '#%E0%A4%A',
  '#%3Cimg%20src=x%20onerror=window.__pwned=1%3E',
  '#"><script>window.__pwned=1</script>',
  '#services',
];

for (const hash of hashes) {
  test(`hash ${JSON.stringify(hash)} raises no script error and executes nothing`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/${hash}`, { waitUntil: 'networkidle' });
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => (window as any).__pwned ?? null)).toBeNull();
    expect(await page.locator('body img[src="x"]').count()).toBe(0);
  });
}

test('later page scripts still run after a malformed hash', async ({ page }) => {
  await page.goto('/#%E0%A4%A', { waitUntil: 'networkidle' });
  // initCommercialAnalytics runs after initAnchorSettle; its listeners must exist.
  const ran = await page.evaluate(() => typeof (window as any).interveneAnalytics?.hasConsent === 'function');
  expect(ran).toBe(true);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('unexpected query parameters are inert on every parameter-reading page', async ({ page }) => {
  for (const url of [
    '/?preview=<img src=x onerror=window.__pwned=1>',
    '/readiness-snapshot/?preview=<script>window.__pwned=1</script>',
    '/readiness-snapshot/?preview=decide-documented&ref=%3Cimg%20src=x%3E',
    '/contact/?next=https://evil.example/&redirect=//evil.example',
  ]) {
    await page.goto(url, { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => (window as any).__pwned ?? null), url).toBeNull();
    expect(page.url().startsWith('http://127.0.0.1'), `no redirect for ${url}`).toBe(true);
  }
});
