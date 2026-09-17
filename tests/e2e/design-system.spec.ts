/**
 * The shared layout and motion system: content is complete without
 * scripts and under reduced motion, entrances play once, anchors clear
 * the sticky header, the offer sheets keep their material conditions
 * visible, and interface states are reachable from the keyboard.
 */

import { test, expect } from '@playwright/test';

const REVEAL_TARGETS = '[data-reveal], .block > .wrap, .block > .wrap-narrow, .block > .wrap-reading';

test.describe('motion opt-in', () => {
  test('with JavaScript disabled every section and diagram is fully visible', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    for (const route of ['/', '/services/', '/methodology/']) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.hasAttribute('data-motion'))).toBe(false);
      const hidden = await page.evaluate((sel) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(`${sel}, .fc-stage, .oc-head, .chain-flow li, .ev-cap .bar, .ceiling .bar, .seq-step`));
        return els.filter((e) => {
          const cs = getComputedStyle(e);
          return parseFloat(cs.opacity) < 1 || (cs.transform !== 'none' && !e.classList.contains('bar'));
        }).length;
      }, REVEAL_TARGETS);
      expect(hidden, `${route}: hidden elements without JavaScript`).toBe(0);
      const bars = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('.ev-cap .bar, .ceiling .bar')).map((b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height));
      for (const area of bars) expect(area).toBeGreaterThan(0);
    }
    await ctx.close();
  });

  test('with reduced motion the complete static explanation is shown at once', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-motion'))).toBe(false);
    // Nothing waits for an intersection: the decisive node is filled and
    // every stage is opaque before any scrolling.
    const state = await page.evaluate(() => {
      const node = document.querySelector<HTMLElement>('.fc-exceeds .fc-node')!;
      const stages = Array.from(document.querySelectorAll<HTMLElement>('.fc-stage'));
      return {
        filled: getComputedStyle(node).backgroundColor,
        opaque: stages.every((s) => getComputedStyle(s).opacity === '1'),
      };
    });
    expect(state.opaque).toBe(true);
    expect(state.filled).toBe('rgb(201, 182, 148)');
    await ctx.close();
  });

  test('entrances play once and the hero is available immediately', async ({ page }) => {
    await page.goto('/');
    // The hero is never an entrance target.
    const heroOpacity = await page.locator('.hero .display-xl').evaluate((e) => getComputedStyle(e).opacity);
    expect(heroOpacity).toBe('1');
    const cta = page.locator('.hero .btn');
    await expect(cta).toBeVisible();
    // Scroll a section into view, then away, then back: it stays revealed.
    const wrap = page.locator('.situations > .wrap');
    await wrap.scrollIntoViewIfNeeded();
    await expect(wrap).toHaveClass(/\bin\b/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    await expect(wrap).toHaveClass(/\bin\b/);
    // The offer-choice branches reveal together: both heads share one delay.
    const delays = await page.locator('.oc-head').evaluateAll((els) => els.map((e) => getComputedStyle(e).transitionDelay));
    expect(new Set(delays).size).toBe(1);
  });
});

test.describe('anchors and page navigation', () => {
  test('anchored sections clear the sticky header', async ({ page }) => {
    await page.goto('/services/#assessment');
    await page.waitForTimeout(300);
    const { top, header } = await page.evaluate(() => ({
      top: document.getElementById('assessment')!.getBoundingClientRect().top,
      header: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
    }));
    expect(top).toBeGreaterThanOrEqual(header);
  });

  test('on-this-page links resolve and mark the current section', async ({ page }) => {
    for (const route of ['/services/', '/sample-report/', '/verify/', '/methodology/']) {
      await page.goto(route);
      const links = page.locator('.page-nav a');
      const count = await links.count();
      expect(count, route).toBeGreaterThan(3);
      for (let i = 0; i < count; i += 1) {
        const href = await links.nth(i).getAttribute('href');
        await expect(page.locator(href!), `${route} ${href}`).toHaveCount(1);
      }
      const third = (await links.nth(2).getAttribute('href')) ?? '';
      await page.locator(third).scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await expect(page.locator('.page-nav a[aria-current="true"]')).toHaveCount(1);
    }
  });
});

test.describe('offer sheets', () => {
  test('keep prices, indicative status, the Review exclusion and access qualifications visible', async ({ page }) => {
    await page.goto('/services/');
    for (const slug of ['review', 'assessment']) {
      const sheet = page.locator(`#${slug}`);
      await expect(sheet.locator('.price')).toBeVisible();
      await expect(sheet.locator('.price-flag')).toContainText('Indicative');
      await expect(sheet.locator('.sheet-label', { hasText: 'Start here when' })).toBeVisible();
    }
    await expect(page.locator('#review')).toContainText('does not include the AGDA™ verdict');
    await expect(page.locator('#review')).toContainText('It is not a discounted AGDA™ Assessment');
    await expect(page.locator('#assessment')).toContainText('Signed SEDI result records are not a standard deliverable');
    await expect(page.locator('#assessment')).toContainText('approximately four weeks');
    // The one disclosure holds the long boundary list; the short boundary
    // and the certification exclusion stay visible.
    await expect(page.locator('#assessment .sheet-row-detail', { hasText: 'Separately scoped' })).toContainText('It is not regulatory certification');
    const details = page.locator('#assessment details.disclosure');
    await expect(details).toHaveCount(1);
    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(details.locator('.disclosure-body')).toContainText('legal opinion');
  });

  test('rows of the two sheets sit level on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'sheets stack on a phone');
    await page.goto('/services/');
    const tops = await page.evaluate(() => {
      const rows = (id: string) => Array.from(document.querySelectorAll<HTMLElement>(`#${id} > *`)).map((r) => Math.round(r.getBoundingClientRect().top));
      return { a: rows('review'), b: rows('assessment') };
    });
    expect(tops.a.length).toBe(8);
    expect(tops.a).toEqual(tops.b);
  });
});

test.describe('interface feedback', () => {
  test('buttons and links show a visible focus ring and no non-link card looks clickable', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('.hero .btn');
    await btn.focus();
    const ring = await btn.evaluate((e) => getComputedStyle(e).outlineStyle);
    expect(ring).toBe('solid');
    const cursor = await page.locator('.situation-grid .card').first().evaluate((e) => getComputedStyle(e).cursor);
    expect(cursor).toBe('auto');
  });

  test('the primary action clears the consent banner on the dense page too', async ({ page }) => {
    await page.goto('/services/');
    await page.waitForTimeout(500);
    const clear = await page.evaluate(() => {
      const cta = document.querySelector('.hero .btn')!.getBoundingClientRect();
      const banner = document.querySelector('.consent')!.getBoundingClientRect();
      return cta.bottom < banner.top;
    });
    expect(clear).toBe(true);
  });
});
