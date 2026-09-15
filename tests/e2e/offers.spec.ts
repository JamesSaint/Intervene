/**
 * The two current engagements, everywhere they appear.
 *
 * src/lib/offers.ts is the single source. These tests read the built
 * pages and the JSON-LD and check that names, ranges, the Review's
 * exclusion and the verdict attribution are the same on every surface,
 * and that the withdrawn offer has not come back.
 */

import { test, expect, type Page } from '@playwright/test';
import { offers, PRICE_QUALIFIER } from '../../src/lib/offers';

const RETIRED = ['Short pilot', 'Annual subscription', 'Enterprise master', 'Intervention Simulator', 'regulator bundle', 'Every assessment ships'];

async function bodyText(page: Page): Promise<string> {
  return page.locator('main').innerText();
}

async function jsonLd(page: Page): Promise<any> {
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  return JSON.parse(raw ?? '{}');
}

for (const route of ['/', '/services/']) {
  test.describe(`offers on ${route}`, () => {
    test('both offers, ranges and the qualifier are visible', async ({ page }) => {
      await page.goto(route);
      const text = await bodyText(page);
      for (const o of offers) {
        expect(text).toContain(o.name);
        expect(text).toContain(o.price);
      }
      expect(text).toContain(PRICE_QUALIFIER);
    });

    test('the Review says it does not include the verdict', async ({ page }) => {
      await page.goto(route);
      const text = await bodyText(page);
      expect(text).toMatch(/does not include the AGDA™ verdict/);
    });

    test('carries no retired offer', async ({ page }) => {
      await page.goto(route);
      const text = await bodyText(page);
      for (const r of RETIRED) expect(text, r).not.toContain(r);
    });
  });
}

test.describe('structured data', () => {
  test('Organization carries two named Offer nodes on every page', async ({ page }) => {
    await page.goto('/agda/');
    const graph = (await jsonLd(page))['@graph'];
    const org = graph.find((n: any) => n['@type'] === 'Organization');
    expect(org.makesOffer.map((o: any) => o.name)).toEqual(offers.map((o) => o.name));
    const review = org.makesOffer.find((o: any) => o.name === offers[0].name);
    expect(review.description).toMatch(/Does not include the AGDA™ verdict/);
    for (const o of org.makesOffer) expect(o.priceSpecification).toBeUndefined();
  });

  for (const route of ['/agda/', '/services/']) {
    test(`FAQPage answers on ${route} equal the rendered answers`, async ({ page }) => {
      await page.goto(route);
      const graph = (await jsonLd(page))['@graph'];
      const faq = graph.find((n: any) => n['@type'] === 'FAQPage');
      expect(faq).toBeTruthy();
      const rendered = await page.locator('.faq-list dd').allInnerTexts();
      for (const q of faq.mainEntity) {
        const answer: string = q.acceptedAnswer.text;
        expect(rendered.map((r) => r.replace(/\s+/g, ' ').trim())).toContain(answer.replace(/\s+/g, ' ').trim());
      }
      const reviewQ = faq.mainEntity.find((q: any) => /Review/.test(q.name));
      expect(reviewQ.acceptedAnswer.text).toMatch(/does not include the AGDA™ verdict/);
    });
  }
});

test.describe('verdict attribution', () => {
  for (const route of ['/', '/agda/', '/methodology/']) {
    test(`${route} attributes verdict states to the full Assessment`, async ({ page }) => {
      await page.goto(route);
      const text = await bodyText(page);
      expect(text).toMatch(/full AGDA™ Assessment/);
      expect(text).not.toMatch(/Every assessment returns/);
    });
  }
});

test.describe('navigation', () => {
  test('menu and footer label the services route "Assessment options"', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#takeover-menu a[href="/services/"]')).toHaveText(/Assessment options/);
    await expect(page.locator('footer a[href="/services/"]')).toHaveText(/Assessment options/);
    await page.goto('/services/');
    await expect(page.locator('#takeover-menu a[href="/services/"]')).toHaveAttribute('aria-current', 'page');
  });
});
