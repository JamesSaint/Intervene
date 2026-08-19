/**
 * The Intervention Readiness Network page.
 *
 * Most of what matters here is what the page does not say. The
 * vocabulary assertions are not stylistic: a word like partner, tier or
 * member implies a status, a ladder or a membership that does not exist
 * and that we have committed not to build. If one appears, the page has
 * started describing a programme rather than a mechanism.
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/network/';

/**
 * Never permitted anywhere on the page. `regulator` is deliberately
 * absent from this list: "former regulators and supervisors" and
 * "current supervisory or regulatory role" are both required copy.
 */
const FORBIDDEN = [
  'partner',
  'affiliate',
  'commission',
  'tier',
  'certification',
  'membership',
  'introducer',
];

test.describe('Network page', () => {
  test('is available and carries one h1', async ({ page }) => {
    const response = await page.goto(ROUTE);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Intervention proves what can happen');
  });

  test('leads with the question, not with joining', async ({ page }) => {
    await page.goto(ROUTE);
    // The first action on the page is the diagnostic, not an application.
    const primary = page.locator('.hero a.btn').first();
    await expect(primary).toHaveAttribute('href', '/readiness-snapshot/');
    await expect(primary).toContainText('Take the Snapshot');

    // Detect, Decide, Intervene, once each.
    await expect(page.locator('.beat-word')).toHaveText(['Detect', 'Decide', 'Intervene']);
  });

  test('routes interest to /contact/ and builds no form of its own', async ({ page }) => {
    await page.goto(ROUTE);

    const contactCta = page.locator('#start a.btn');
    await expect(contactCta).toHaveAttribute('href', '/contact/');
    await expect(contactCta).toContainText('Talk to Intervene');

    // No application process, so no application form and no field to fill.
    await expect(page.locator('main form')).toHaveCount(0);
    await expect(page.locator('main input')).toHaveCount(0);
    await expect(page.locator('main textarea')).toHaveCount(0);
    await expect(page.getByText('Apply now')).toHaveCount(0);
  });

  test('carries the settled independence statements and no remediation rule', async ({ page }) => {
    await page.goto(ROUTE);
    const firewall = page.locator('.firewall li');
    await expect(firewall).toHaveCount(3);
    await expect(firewall.nth(0)).toContainText('never affects');
    await expect(firewall.nth(1)).toContainText('No commercial payment varies');
    await expect(firewall.nth(2)).toContainText('no methodological authority');

    // The remediation mechanism is open with legal advice. Nothing about
    // it may appear until it is settled.
    const body = (await page.locator('main').innerText()).toLowerCase();
    expect(body).not.toContain('remediation');
    expect(body).not.toContain('twelve month');
    expect(body).not.toContain('12 month');
  });

  test('states the unpaid default without making payment a call to action', async ({ page }) => {
    await page.goto(ROUTE);
    const recognition = page.locator('.recognition-copy');
    await expect(recognition).toContainText('carries no fee');
    // One paragraph, no heading, no link block, no button.
    await expect(page.locator('.recognition h2')).toHaveCount(0);
    await expect(page.locator('.recognition a')).toHaveCount(0);
    await expect(page.locator('.recognition .btn')).toHaveCount(0);
  });

  test('does not claim a recipient can never become known', async ({ page }) => {
    await page.goto(ROUTE);
    const body = (await page.locator('main').innerText()).toLowerCase();
    expect(body).toContain('separate events');
    // The page names the overclaim and then refuses it, so the words
    // appear. What must never appear is us asserting it.
    expect(body).toContain('what this does not claim');
    expect(body).toContain('they can, by their own choice');
    expect(body).not.toContain('we will never know');
    expect(body).not.toContain('we can never know');
    expect(body).not.toContain('we never learn who they are.');
  });

  test('uses none of the prohibited programme vocabulary', async ({ page }) => {
    await page.goto(ROUTE);
    const html = (await page.content()).toLowerCase();
    for (const word of FORBIDDEN) {
      expect(html, `"${word}" must not appear on /network/`).not.toContain(word);
    }
    // "level" is checked as a word so it cannot match inside other text.
    expect(html).not.toMatch(/\blevels?\b/);
    // "member" as a standalone word. "remember" and similar would not count.
    expect(html).not.toMatch(/\bmembers?\b/);
  });

  test('names the fine print correctly and makes no FADP claim', async ({ page }) => {
    await page.goto(ROUTE);
    const fine = page.locator('.fine-copy');
    await expect(fine).toContainText('Intervene Limited');
    await expect(fine).toContainText('17317647');
    await expect(fine).toContainText('not an offer of payment');
    await expect(fine).not.toContainText('FADP');
    await expect(fine).not.toContainText('Swiss');
  });

  test('is reachable from the footer and is not in the takeover menu', async ({ page }) => {
    await page.goto('/');
    const footerLink = page.locator('.site-footer a[href="/network/"]');
    await expect(footerLink).toHaveCount(1);
    await expect(footerLink).toHaveText('Network');
    // Deliberately not promoted into primary navigation.
    await expect(page.locator('.takeover a[href="/network/"]')).toHaveCount(0);
  });

  test('is indexable and present in the sitemap', async ({ page, request }) => {
    await page.goto(ROUTE);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots ?? 'index, follow').toContain('index');
    expect(robots ?? '').not.toContain('noindex');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://intervene.uk/network/',
    );

    const sitemap = await (await request.get('/sitemap-0.xml')).text();
    expect(sitemap).toContain('https://intervene.uk/network/');
  });

  test('carries the social card in the existing series', async ({ page, request }) => {
    await page.goto(ROUTE);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://intervene.uk/assets/og/og-network.png',
    );
    const card = await request.get('/assets/og/og-network.png');
    expect(card.status()).toBe(200);
  });
});
