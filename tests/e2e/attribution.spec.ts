/**
 * The attribution parameter, end to end.
 *
 * The two commitments that would be expensive to break are asserted
 * here. An unknown code must produce exactly the experience of no code
 * at all, because a visible rejection tells a recipient that a code was
 * tried. And the code must not reach the recipient's eye: not in the
 * address bar after landing, not in the page, not in the printable
 * result.
 *
 * Every Formspree call is intercepted. Nothing in this file reaches the
 * real endpoint, and the intercepted body is what the completion record
 * assertions read.
 */

import { test, expect, type Page, type Request } from '@playwright/test';

const ROUTE = '/readiness-snapshot/';
const CODE = 'ffsw9hg2';

/** Captures Formspree posts and keeps them off the network. */
async function interceptSubmissions(page: Page): Promise<Request[]> {
  const posts: Request[] = [];
  await page.route('**/formspree.io/**', async (route, request) => {
    if (request.method() === 'POST') posts.push(request);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
  return posts;
}

async function answerVisibleScreen(page: Page) {
  const screen = page.locator('[data-screen]:not([hidden])');
  const fieldsets = screen.locator('[data-question]');
  const count = await fieldsets.count();
  for (let i = 0; i < count; i += 1) {
    await fieldsets.nth(i).locator('input[type="radio"]').first().check();
  }
}

async function completeSnapshot(page: Page) {
  await page.getByRole('link', { name: 'Begin', exact: true }).click();
  for (let screen = 1; screen <= 5; screen += 1) {
    await answerVisibleScreen(page);
    const generate = page.locator('[data-snapshot-generate]:visible');
    if (await generate.count()) {
      await generate.click();
      break;
    }
    await page.locator('[data-snapshot-next]:visible').click();
  }
  await expect(page.locator('[data-snapshot-result]')).toBeVisible();
}

test.describe('Attribution', () => {
  test('takes the code out of the address bar and shows it nowhere', async ({ page }) => {
    await interceptSubmissions(page);
    await page.goto(`${ROUTE}?p=${CODE}`);
    await expect(page.locator('[data-snapshot-begin]')).toBeVisible();

    expect(page.url()).not.toContain(CODE);
    expect(page.url()).not.toContain('p=');
    expect(await page.content()).not.toContain(CODE);

    await completeSnapshot(page);
    expect(await page.content()).not.toContain(CODE);
  });

  test('records one completion carrying the code and no answers', async ({ page }) => {
    const posts = await interceptSubmissions(page);
    await page.goto(`${ROUTE}?p=${CODE}`);
    await completeSnapshot(page);

    await expect.poll(() => posts.length).toBe(1);
    const body = posts[0].postData() ?? '';
    expect(body).toContain(CODE);
    // No answers, no result, no identity travel with a completion.
    expect(body).not.toMatch(/q\d{2}_/);
    expect(body).not.toContain('least_confident');
  });

  test('an unknown code is indistinguishable from no code', async ({ page }) => {
    const posts = await interceptSubmissions(page);
    await page.goto(`${ROUTE}?p=NOT-A-CODE`);

    // Nothing on screen acknowledges that a code was tried.
    await expect(page.locator('[data-snapshot-begin]')).toBeVisible();
    expect(page.url()).not.toContain('NOT-A-CODE');
    expect(await page.content()).not.toContain('NOT-A-CODE');

    await completeSnapshot(page);
    await expect(page.locator('[data-result-headline]')).toBeVisible();
    // The decisive one. No code, so no record, so nothing to observe.
    expect(posts).toHaveLength(0);
  });

  test('a visit with no code records nothing', async ({ page }) => {
    const posts = await interceptSubmissions(page);
    await page.goto(ROUTE);
    await completeSnapshot(page);
    await expect(page.locator('[data-result-headline]')).toBeVisible();
    expect(posts).toHaveLength(0);
  });

  test('carries the code when someone chooses to identify themselves', async ({ page }) => {
    const posts = await interceptSubmissions(page);
    await page.goto(`${ROUTE}?p=${CODE}`);
    await completeSnapshot(page);
    await expect.poll(() => posts.length).toBe(1);

    await page.locator('[data-action-open="contact_intervene"]').click();
    await page.locator('#fu-name').fill('Test Person');
    await page.locator('#fu-email').fill('test@example.com');
    await page.locator('[data-followup-submit]').click();

    await expect.poll(() => posts.length).toBe(2);
    const body = posts[1].postData() ?? '';
    expect(body).toContain('test@example.com');
    expect(body).toContain(CODE);
  });
});
