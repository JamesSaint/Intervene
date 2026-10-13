import { test, expect } from '@playwright/test';

const ready = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
};

test('the trace advances through the selected outcome without moving its facts or controls', async ({ page }) => {
  await ready(page);
  const instrument = page.locator('.intervention-window');
  await instrument.scrollIntoViewIfNeeded();
  const replay = instrument.getByRole('button', { name: 'Replay sequence' });
  await expect(replay).toBeVisible();
  await instrument.getByRole('radio', { name: 'Too late', exact: true }).check();
  await replay.click();
  const view = instrument.locator('[data-window-view="too-late"]');
  const factsBefore = await view.locator('figcaption').boundingBox();
  const sample = () => view.locator('.window-trace').evaluate((line) => {
    const bounds = line.getBoundingClientRect();
    return innerWidth <= 720 ? bounds.height : bounds.width;
  });
  const early = await sample();
  await page.waitForTimeout(400);
  const later = await sample();
  expect(later).toBeGreaterThan(early + 20);
  expect(await view.locator('figcaption').boundingBox()).toEqual(factsBefore);
  await expect.poll(() => view.evaluate((node) => node.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length)).toBe(0);
  const final = await sample();
  expect(final).toBeGreaterThan(later);
  expect(await view.locator('.window-stage-4').evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
});

test('changing motion preference mid-trace settles immediately and keeps native comparison usable', async ({ page }) => {
  await ready(page);
  const instrument = page.locator('.intervention-window');
  await instrument.scrollIntoViewIfNeeded();
  await instrument.getByRole('button', { name: 'Replay sequence' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(instrument.locator('.is-playing')).toHaveCount(0);
  await expect(instrument.getByRole('button', { name: 'Replay sequence' })).toBeHidden();
  await instrument.getByRole('radio', { name: 'Too late', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(instrument.locator('[data-window-view="too-late"]')).toBeVisible();
  expect(await instrument.locator('.window-sequence').evaluateAll((nodes) => nodes.flatMap(node => node.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0);
});

test('rapid comparison and replay settle on the requested outcome', async ({ page }) => {
  await ready(page);
  const instrument = page.locator('.intervention-window');
  await instrument.scrollIntoViewIfNeeded();
  for (const name of ['Too late', 'In time', 'Too late']) {
    await instrument.getByRole('radio', { name, exact: true }).check();
    await instrument.getByRole('button', { name: 'Replay sequence' }).click();
  }
  await expect(instrument.locator('[data-window-view="too-late"]')).toBeVisible();
  await expect(instrument.locator('[data-window-view="in-time"]')).toBeHidden();
  await expect.poll(() => instrument.locator('.is-playing').count()).toBe(0);
  await expect(instrument.getByRole('radio', { name: 'Too late', exact: true })).toBeChecked();
});

test('homepage links receive focus without moving the surrounding content', async ({ page }) => {
  await ready(page);
  const action = page.locator('.hero-home [data-primary-cta]');
  await action.focus();
  await expect(action).toBeFocused();
  // Focus feedback may transition, while page content stays still.
  const moving = await page.locator('.motion-line > span, .hero-home .hero-sub, .hero-home .hero-actions, .hero-home .hero-principle').evaluateAll((nodes) => nodes.flatMap(node => node.getAnimations()).filter(animation => animation.playState === 'running').length);
  expect(moving).toBe(0);
  await expect(action).toBeVisible();
});
