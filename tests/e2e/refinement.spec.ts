import { test, expect } from '@playwright/test';

async function dismissConsent(page: import('@playwright/test').Page) {
  const deny = page.locator('[data-consent="denied"]');
  if (await deny.isVisible()) await deny.click();
}

test('homepage follows six stages and exposes the finding before any interaction', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main > section')).toHaveCount(6);
  await expect(page.locator('.hero-secondary')).toHaveAttribute('href', '/agda/');
  await expect(page.locator('.finding-chain')).toBeVisible();
  await expect(page.locator('.finding-example')).not.toHaveAttribute('open', '');
  await expect(page.locator('.oc-fields')).toHaveCount(2);
  for (const fields of await page.locator('.oc-fields').all()) {
    await expect(fields).toContainText('Question and decision');
    await expect(fields).toContainText('Evidence examined');
  }
});

for (const route of ['/', '/methodology/']) {
  test(`SEDI stages on ${route} work without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(route);
    const stages = page.locator('.sedi-explorer details');
    await expect(stages).toHaveCount(4);
    for (const stage of await stages.all()) {
      await stage.locator('summary').click();
      await expect(stage).toHaveAttribute('open', '');
      await expect(stage.locator('dl')).toContainText('Evidence examined');
      await expect(stage.locator('dl')).toContainText('Possible failure');
      await expect(stage.locator('dl')).toContainText('Consequence for intervention');
    }
    await context.close();
  });
}

test('SEDI stage disclosures expose content from keyboard focus', async ({ page }) => {
  await page.goto('/');
  await dismissConsent(page);
  const first = page.locator('.sedi-explorer details').first();
  await first.locator('summary').focus();
  // Traverse back to the native summary after the pointer-based consent choice.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(first.locator('summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(first.locator('dl')).toBeVisible();
  const style = await first.locator('summary').evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(style).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(first.locator('dl')).toBeHidden();
});

for (const route of ['/legal/terms/', '/insights/accountability-theatre/']) {
  test(`reading navigation on ${route} reaches an unchanged section`, async ({ page, isMobile }) => {
    await page.goto(route);
    await dismissConsent(page);
    if (isMobile) await page.locator('.reading-mobile summary').click();
    const nav = page.locator(isMobile ? '.reading-mobile nav' : '.reading-desktop');
    const links = await nav.locator('a').all();
    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      const href = await link.getAttribute('href');
      await expect(page.locator(href!)).toHaveCount(1);
      await expect(page.locator(href!)).toHaveText(await link.innerText());
    }
    const last = links.at(-1)!;
    await last.click();
    await expect(page).toHaveURL(new RegExp(`${await last.getAttribute('href')}$`));
    const target = page.locator((await last.getAttribute('href'))!);
    await expect(target).toBeInViewport();
    expect(await target.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(80);
  });
}

test('reference pages finish with an assessment route and retain related reading', async ({ page }) => {
  for (const route of ['/intervention-readiness/halt-authority/', '/intervention-readiness/vs-audit/']) {
    await page.goto(route);
    const lastSection = page.locator('main > section').last();
    await expect(lastSection.locator('.btn')).toHaveAttribute('href', '/agda/');
    await expect(lastSection.locator('.btn-ghost')).toHaveAttribute('href', '/sample-report/');
    await expect(lastSection.locator('.related-links a').first()).toBeVisible();
  }
});
