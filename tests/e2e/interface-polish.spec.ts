import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// These regressions exercise the overlay states that a static page audit
// cannot reach: focus recovery, banner overlap and short-screen navigation.
test('menu traps focus, closes from the keyboard and preserves existing inert states', async ({ page }) => {
  await page.goto('/services/');
  await page.evaluate(() => {
    const existing = document.createElement('div');
    existing.id = 'already-inert';
    existing.inert = true;
    document.body.append(existing);
  });
  const trigger = page.locator('[data-menu-trigger]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('dialog', { name: 'Primary navigation' });
  const links = menu.locator('.takeover-body a');
  await expect(links.first()).toBeFocused();
  await expect(page.locator('main')).toHaveJSProperty('inert', true);
  await expect(page.locator('.site-header')).toHaveJSProperty('inert', true);
  await expect(page.locator('.consent')).toHaveJSProperty('inert', true);

  await links.last().focus();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link', { name: 'Intervene · home' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(links.last()).toBeFocused();
  await links.first().focus();
  await page.keyboard.press('Shift+Tab');
  await expect(menu.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
  await expect(page.locator('#already-inert')).toHaveJSProperty('inert', true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('the menu clears consent and remains usable on short screens', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 393, height: 568 },
    { width: 768, height: 568 },
    { width: 1440, height: 650 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/services/');
    await page.locator('[data-menu-trigger]').click();
    const menu = page.locator('[data-takeover]');
    await expect(menu).toHaveClass(/\bopen\b/);
    await page.waitForTimeout(900);
    const layout = await menu.evaluate((el) => {
      const links = [...el.querySelectorAll('a')];
      const close = el.querySelector('[data-menu-close]')!.getBoundingClientRect();
      return {
        overflow: el.scrollWidth > el.clientWidth + 1,
        linksClear: links.every((link) => {
          const box = link.getBoundingClientRect();
          return box.left >= 0 && box.right <= window.innerWidth + 1 && box.bottom <= window.innerHeight;
        }),
        closeWidth: close.width,
        closeHeight: close.height,
        menuIsTopSurface: el.contains(document.elementFromPoint(30, window.innerHeight - 20)),
      };
    });
    expect(layout.overflow, JSON.stringify(viewport)).toBe(false);
    expect(layout.linksClear, JSON.stringify(viewport)).toBe(true);
    expect(layout.closeWidth).toBeGreaterThanOrEqual(44);
    expect(layout.closeHeight).toBeGreaterThanOrEqual(44);
    expect(layout.menuIsTopSurface).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  }

  // A landscape phone may need to scroll the menu. The close control
  // remains available while the last destination is brought into view.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.locator('[data-menu-trigger]').click();
  const last = page.locator('.takeover-body a').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  await expect(page.locator('[data-menu-close]')).toBeInViewport();
  await page.locator('[data-menu-close]').click();
  await expect(page.locator('[data-takeover]')).toBeHidden();
});

test('the footer can scroll clear of consent, including after resizing', async ({ page }) => {
  await page.goto('/');
  for (const width of [393, 320, 1440]) {
    await page.setViewportSize({ width, height: 568 });
    await expect(page.locator('.consent')).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => {
      const footer = document.querySelector('.trade-mark-notice')!.getBoundingClientRect();
      const banner = document.querySelector('.consent')!.getBoundingClientRect();
      return footer.bottom <= banner.top;
    })).toBe(true);
  }
});

test('reopening cookies moves focus to the choices and returns it after closing', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-consent="denied"]').click();
  await expect(page.locator('.consent')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('intv-consent'))).toBe('denied');
  const cookies = page.locator('[data-consent-reopen]');
  await cookies.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-consent="denied"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cookies).toBeFocused();
  // Reopen during the outgoing transition: an old hide callback must
  // not remove a banner that is open again.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(450);
  await expect(page.locator('.consent')).toBeVisible();
  await expect(page.locator('[data-consent="denied"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.consent')).toBeHidden();
  await expect(cookies).toBeFocused();
});

test('Accept retains readable contrast on hover', async ({ page }) => {
  await page.goto('/contact/');
  await page.locator('.consent-accept').hover();
  await page.waitForTimeout(200);
  const results = await new AxeBuilder({ page }).include('.consent').withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('a missing address returns a branded 404 with working recovery links', async ({ page, request }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found · Intervene');
  await expect(page.locator('main h1')).toHaveText('This page is unavailable.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  for (const link of await page.locator('.missing-page a').all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href!)).status()).toBe(200);
  }
  await page.locator('.missing-page .btn').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.display-xl')).toBeVisible();
});


test('technical charts keep direct labels readable and plot the stated values on their scale', async ({ page }) => {
  await page.goto('/methodology/');
  const ceiling = page.locator('.ceiling');
  await ceiling.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const values = await ceiling.evaluate((el) => {
    const plot = el.querySelector('.bars')!.getBoundingClientRect();
    return [...el.querySelectorAll('.col')].map((col) => {
      const bar = col.querySelector('.bar')!.getBoundingClientRect();
      const score = col.querySelector('.score')!;
      return {
        stated: Number(score.textContent),
        drawn: bar.height / plot.height * 5,
        scoreSize: parseFloat(getComputedStyle(score).fontSize),
        baseline: Math.abs(bar.bottom - plot.bottom),
      };
    });
  });
  expect(values.map((v) => v.stated)).toEqual([2, 3, 3.5, 4]);
  for (const value of values) {
    expect(value.drawn).toBeCloseTo(value.stated, 2);
    expect(value.baseline).toBeLessThan(1);
    expect(value.scoreSize).toBeGreaterThanOrEqual(12);
  }
  const evidence = page.locator('.ev-cap');
  await evidence.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  for (const row of await evidence.locator('.row').all()) {
    await expect(row.locator('.cap-text')).toBeVisible();
    const label = await row.locator('.cap-text').textContent();
    const ratio = await row.evaluate((el) =>
      el.querySelector('.bar')!.getBoundingClientRect().width / el.querySelector('.track')!.getBoundingClientRect().width,
    );
    expect(ratio * 5).toBeCloseTo(Number(label?.match(/confidence (\d)/)?.[1]), 2);
  }
});


test('a page-navigation anchor marks the section it actually opens', async ({ page }) => {
  await page.goto('/services/');
  await page.locator('[data-consent="denied"]').click();
  const scope = page.locator('.page-nav a[href="#scope"]');
  await scope.click();
  await expect(scope).toHaveAttribute('aria-current', 'true');
  await expect(page).toHaveURL(/#scope$/);
});
