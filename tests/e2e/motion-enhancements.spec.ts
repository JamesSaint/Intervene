import { test, expect, type Page } from '@playwright/test';

async function prepare(page: Page, route: string) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(route);
  const deny = page.locator('[data-consent="denied"]');
  if (await deny.isVisible()) await deny.click();
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
}

for (const [route, selector] of [
  ['/', '.sedi-explorer details'],
  ['/', '.finding-example'],
  ['/services/', 'details.disclosure'],
  ['/style-guide/', 'details.disclosure'],
]) {
  test(`disclosure on ${route} ${selector} opens and closes without leaving a fixed height`, async ({ page }) => {
    await prepare(page, route);
    const details = page.locator(selector).first();
    const summary = details.locator('summary');
    const body = details.locator(':scope > [data-disclosure-body]');
    await summary.click();
    await expect(details).toHaveAttribute('open', '');
    await expect(details).not.toHaveAttribute('data-disclosure-state');
    expect(await body.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await body.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(0);
    await summary.click();
    await expect(details).not.toHaveAttribute('open');
    await expect(body).toBeHidden();
    expect(await body.evaluate((el) => (el as HTMLElement).inert)).toBe(false);
  });
}

test('repeated disclosure input reverses from the visible height and leaves the requested state', async ({ page }) => {
  await prepare(page, '/methodology/');
  const details = page.locator('.sedi-explorer details').first();
  await details.scrollIntoViewIfNeeded();
  const result = await details.evaluate(async (el) => {
    const summary = el.querySelector('summary')!;
    const body = el.querySelector<HTMLElement>('[data-disclosure-body]')!;
    summary.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const before = body.getBoundingClientRect().height;
    summary.click();
    const after = body.getBoundingClientRect().height;
    const closingInert = body.inert;
    summary.click();
    await Promise.all(body.getAnimations().map((animation) => animation.finished));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return { before, after, closingInert, open: (el as HTMLDetailsElement).open, inert: body.inert, animations: body.getAnimations().length };
  });
  expect(Math.abs(result.after - result.before)).toBeLessThanOrEqual(1);
  expect(result.closingInert).toBe(true);
  expect(result.open).toBe(true);
  expect(result.inert).toBe(false);
  expect(result.animations).toBe(0);
  await expect(details.locator('dd').last()).toBeVisible();
});

test('a changed reduced-motion preference settles moving disclosures and reveals all content', async ({ page }) => {
  await prepare(page, '/methodology/');
  const details = page.locator('.sedi-explorer details').first();
  await details.locator('summary').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveAttribute('data-motion');
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open');
  expect(await details.locator('[data-disclosure-body]').evaluate((el) => el.getAnimations().length)).toBe(0);
  expect(await page.locator('main [data-reveal]').evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1'))).toBe(true);
});

test('mobile contents settles before keyboard navigation and resizing leaves its content unclipped', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await prepare(page, '/legal/terms/');
  const details = page.locator('.reading-mobile');
  await details.locator('summary').click();
  const link = details.locator('a').last();
  await link.focus();
  await expect(link).toBeFocused();
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${await link.getAttribute('href')}$`));
  await details.locator('summary').click();
  await details.locator('summary').click();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(details).not.toHaveAttribute('data-disclosure-state');
  await expect(details).toHaveAttribute('open', '');
  expect(await details.locator('[data-disclosure-body]').evaluate((el) => el.getBoundingClientRect().height + 1 >= el.scrollHeight)).toBe(true);
});

test('page openings keep the primary action visible and create no perpetual animation', async ({ page }) => {
  await prepare(page, '/');
  const cta = page.locator('.hero .btn');
  await expect(cta).toBeVisible();
  expect(await cta.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  await page.locator('.sedi-explorer').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
});

for (const capability of ['animation', 'inert']) {
  test(`disclosures retain native behaviour when ${capability} support is unavailable`, async ({ page }) => {
    await page.addInitScript((missing) => {
      if (missing === 'animation') Object.defineProperty(Element.prototype, 'animate', { value: undefined, configurable: true });
      else delete (HTMLElement.prototype as unknown as { inert?: boolean }).inert;
    }, capability);
    await prepare(page, '/services/');
    const details = page.locator('details.disclosure');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect(details.locator('.disclosure-body')).toBeVisible();
    await expect(details).not.toHaveAttribute('data-disclosure-state');
    await details.locator('summary').click();
    await expect(details).not.toHaveAttribute('open');
    await expect(details.locator('.disclosure-body')).toBeHidden();
  });
}
