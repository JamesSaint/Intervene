import { test, expect } from '@playwright/test';

for (const route of ['/', '/methodology/']) {
  test(`${route}: the conceptual window compares both outcomes using the keyboard`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
    await page.goto(route);
    const window = page.locator('.intervention-window');
    await expect(window).toContainText('No assessment result, measured durations or scale.');
    const early = window.locator('[data-window-view="in-time"]');
    const late = window.locator('[data-window-view="too-late"]');
    await expect(early).toBeVisible();
    await expect(late).toBeHidden();
    await window.getByRole('radio', { name: 'In time', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(window.getByRole('radio', { name: 'Too late', exact: true })).toBeChecked();
    await expect(late).toBeVisible();
    await expect(early).toBeHidden();
    const positions = await late.evaluate((figure) => {
      const marker = figure.querySelector('.window-stage-4 .window-node')!.getBoundingClientRect();
      const boundary = figure.querySelector('.window-boundary')!.getBoundingClientRect();
      return innerWidth <= 720 ? marker.top > boundary.top : marker.left > boundary.left;
    });
    expect(positions, 'late intervention must be beyond the closing boundary').toBe(true);
    await page.keyboard.press('ArrowLeft');
    await expect(early).toBeVisible();
    const before = await early.evaluate((figure) => {
      const marker = figure.querySelector('.window-stage-4 .window-node')!.getBoundingClientRect();
      const boundary = figure.querySelector('.window-boundary')!.getBoundingClientRect();
      return innerWidth <= 720 ? marker.bottom < boundary.top : marker.right < boundary.left;
    });
    expect(before, 'timely intervention must be before the closing boundary').toBe(true);
  });
}

test('the window remains usable without JavaScript and with reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const window = page.locator('.intervention-window');
  await window.getByRole('radio', { name: 'Too late', exact: true }).check();
  await expect(window.locator('[data-window-view="too-late"]')).toBeVisible();
  await expect(window.locator('[data-window-view="in-time"]')).toBeHidden();
  expect(await window.locator('label > span').first().evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
  await context.close();
});
