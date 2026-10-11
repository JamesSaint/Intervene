import { test, expect, type Page } from '@playwright/test';

const google = /https:\/\/[^/]*(?:googletagmanager\.com|google-analytics\.com)\//;
const endpoint = '**/formspree.io/**';

async function inspect(page: Page, choice?: string) {
  const requests: string[] = [];
  page.on('request', (request) => { if (google.test(request.url())) requests.push(request.url()); });
  // Deterministic loader test. Real Google network behaviour is checked separately.
  await page.route(google, (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
  if (choice) await page.addInitScript((value) => localStorage.setItem('intv-consent', value), choice);
  return requests;
}
async function events(page: Page) {
  return page.evaluate(() => ((window as any).dataLayer ?? [])
    .map((args: any) => Array.from(args)).filter((args: any) => args[0] === 'event'));
}
async function accept(page: Page) {
  await page.locator('[data-consent="granted"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).interveneAnalytics.hasConsent())).toBe(true);
}
async function fill(page: Page) {
  await page.fill('#f-name', 'Consent Test Person');
  await page.fill('#f-org', 'Consent Test Organisation');
  await page.fill('#f-email', 'consent-test@example.com');
  await page.fill('#f-msg', 'TEST DATA: a message that must never enter analytics.');
}

test('first visit and rejection never load Google or queue measurement', async ({ page }) => {
  const requests = await inspect(page);
  await page.goto('/?email=private@example.com');
  await page.locator('[data-offer-view]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  expect(requests).toEqual([]);
  expect(await events(page)).toEqual([]);
  await page.locator('[data-consent="denied"]').click();
  await page.goto('/services/');
  await page.waitForTimeout(1100);
  expect(requests).toEqual([]);
  expect(await events(page)).toEqual([]);
  await expect(page.locator('.consent')).toBeHidden();
});

test('acceptance loads once, sanitises page URLs and preserves the preference', async ({ page }) => {
  const requests = await inspect(page);
  await page.goto('/?email=private@example.com#private');
  await accept(page);
  await page.evaluate(() => (window as any).interveneAnalytics.setConsent('granted'));
  await expect.poll(() => requests.length).toBe(1);
  const config = await page.evaluate(() => (window as any).dataLayer.map((a: any) => Array.from(a)).filter((a: any) => a[0] === 'config'));
  expect(config).toHaveLength(1);
  expect(config[0][2].page_location).toBe('https://intervene.uk/');
  expect(config[0][2].allow_google_signals).toBe(false);
  await page.goto('/services/');
  await expect.poll(() => requests.length).toBe(2);
  await expect(page.locator('.consent')).toBeHidden();
});

test('stored acceptance works; stored rejection blocks the tag', async ({ browser, baseURL }) => {
  for (const choice of ['granted', 'denied']) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    const requests = await inspect(page, choice);
    await page.goto('/contact/');
    await page.waitForTimeout(200);
    expect(requests.length).toBe(choice === 'granted' ? 1 : 0);
    await expect(page.locator('.consent')).toBeHidden();
    await context.close();
  }
});

test('withdrawal removes analytics cookies, reloads and blocks subsequent events', async ({ page, context }) => {
  const requests = await inspect(page);
  await page.goto('/');
  await accept(page);
  await expect.poll(() => requests.length).toBe(1);
  await context.addCookies([{ name: '_ga', value: 'test', url: page.url() }]);
  await page.locator('[data-consent-reopen]').click();
  await Promise.all([page.waitForEvent('load'), page.locator('[data-consent="denied"]').click()]);
  await expect(page.locator('.consent')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('intv-consent'))).toBe('denied');
  expect((await context.cookies()).filter((c) => c.name.startsWith('_ga'))).toEqual([]);
  await page.locator('[data-offer-view]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  expect(requests).toHaveLength(1);
  expect(await events(page)).toEqual([]);
});

test('withdrawing in another tab disables the loaded tab too', async ({ page, context }) => {
  await inspect(page);
  await page.goto('/');
  await accept(page);
  const other = await context.newPage();
  await inspect(other);
  await other.goto('/contact/');
  const reloaded = page.waitForEvent('load');
  await other.locator('[data-consent-reopen]').click();
  await other.locator('[data-consent="denied"]').click();
  await reloaded;
  expect(await page.evaluate(() => (window as any).interveneAnalytics.hasConsent())).toBe(false);
  expect(await events(page)).toEqual([]);
});

test('storage failure defaults to no measurement and permits current-page consent', async ({ page }) => {
  const requests = await inspect(page);
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await page.goto('/');
  expect(requests).toEqual([]);
  await accept(page);
  await expect.poll(() => requests.length).toBe(1);
  await page.reload();
  await expect(page.locator('.consent')).toBeVisible();
  expect(requests).toHaveLength(1);
});

test('offering visibility requires consent and dwell, then records only once', async ({ page }) => {
  await inspect(page);
  await page.goto('/services/');
  await page.locator('[data-offer-view]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  expect(await events(page)).toEqual([]);
  await accept(page);
  expect((await events(page)).filter((e: any) => e[1] === 'offer_view')).toHaveLength(0);
  await expect.poll(async () => (await events(page)).filter((e: any) => e[1] === 'offer_view').length).toBe(1);
  await page.locator('#engagements [data-offer-view]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  expect((await events(page)).filter((e: any) => e[1] === 'offer_view')).toHaveLength(1);
});

test('primary CTA and offer links record fixed categories and no query string', async ({ page }) => {
  await inspect(page, 'granted');
  await page.goto('/services/?email=private@example.com');
  // Prevent navigation so the source page's queue remains inspectable.
  await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), true));
  await page.locator('main [data-primary-cta]').first().click();
  await page.locator('[data-offer-select="review"]').click();
  await page.locator('[data-offer-select="assessment"]').click();
  const emitted = await events(page);
  expect(emitted.filter((e: any) => e[1] === 'primary_cta_click')).toEqual([
    ['event', 'primary_cta_click', { cta_id: 'discuss_system', page_path: '/services/', placement: 'main' }],
  ]);
  expect(emitted.filter((e: any) => e[1] === 'offer_select').map((e: any) => e[2].offer_id)).toEqual(['review', 'assessment']);
  expect(JSON.stringify(emitted)).not.toContain('private@example.com');
});

test('sample viewing after acceptance is preserved without duplicate events', async ({ page }) => {
  await inspect(page);
  await page.goto('/sample-report/');
  expect(await events(page)).toEqual([]);
  await accept(page);
  await page.evaluate(() => (window as any).interveneAnalytics.setConsent('granted'));
  expect((await events(page)).filter((e: any) => e[1] === 'sample_verdict_viewed')).toHaveLength(1);
});

test('enquiry events describe endpoint responses, preserve consent and exclude personal data', async ({ page }) => {
  await inspect(page);
  await page.route(endpoint, (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.goto('/contact/');
  await fill(page);
  expect(await events(page)).toEqual([]);
  await accept(page);
  await page.fill('#f-role', 'TEST ROLE');
  await page.check('input[value="review"]');
  await page.check('input[value="assessment"]');
  await page.click('button[type="submit"]');
  await expect(page.locator('.form-status')).toHaveAttribute('data-state', 'err');
  expect((await events(page)).filter((e: any) => e[1] === 'enquiry_submitted')).toHaveLength(0);
  await page.route(endpoint, (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
  await page.click('button[type="submit"]');
  await expect(page.locator('.form-status')).toHaveAttribute('data-state', 'ok');
  const emitted = await events(page);
  expect(emitted.filter((e: any) => e[1] === 'enquiry_started')).toHaveLength(1);
  expect(emitted.filter((e: any) => e[1] === 'enquiry_submitted')).toHaveLength(1);
  expect(emitted.filter((e: any) => e[1] === 'offer_select').map((e: any) => e[2].offer_id)).toEqual(['review', 'assessment']);
  for (const value of ['Consent Test', 'consent-test@example.com', 'TEST DATA', 'TEST ROLE']) expect(JSON.stringify(emitted)).not.toContain(value);
});


test('a primary CTA navigates natively and its event is consumed once on arrival', async ({ page }) => {
  await inspect(page, 'granted');
  await page.goto('/services/');
  await page.locator('main [data-primary-cta]').first().click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect.poll(async () => (await events(page)).filter((e: any) => e[1] === 'primary_cta_click').length).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('intv-pending-cta'))).toBeNull();
  await page.reload();
  expect((await events(page)).filter((e: any) => e[1] === 'primary_cta_click')).toHaveLength(0);
});


test('unused query strings are removed only after acceptance, with anchors preserved', async ({ page }) => {
  await inspect(page);
  await page.goto('/?q=PRIVATE_QUERY_SENTINEL&email=private@example.com#home-question');
  expect(new URL(page.url()).search).toContain('PRIVATE_QUERY_SENTINEL');
  await accept(page);
  expect(new URL(page.url()).search).toBe('');
  expect(new URL(page.url()).hash).toBe('#home-question');
});
