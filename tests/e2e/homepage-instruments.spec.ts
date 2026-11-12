/**
 * The homepage's visual instruments: the hero figure, the scenario model,
 * the assessment artefact and the offer comparison. Each must read without
 * JavaScript, work from the keyboard, and keep its qualification on screen.
 */
import { test, expect, type Page } from '@playwright/test';
import { offers } from '../../src/lib/offers';

async function open(page: Page) {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.window-lab')).toHaveAttribute('data-ready', '');
}

test('the on-paper and under-pressure figure is labelled as conceptual and puts late intervention beyond the boundary', async ({ page }) => {
  // The figure lives on the pillar page; the homepage hero carries the model itself.
  await page.goto('/intervention-readiness/');
  const figure = page.locator('.hero-window');
  await expect(figure).toContainText('Conceptual illustration. Positions show order, not measured durations.');
  await expect(figure).toHaveAttribute('aria-label', /On paper.*Under pressure/);
  const edges = await figure.evaluate((el) => {
    const boundary = el.querySelector('.hw-pressure .hw-track')!;
    const zone = parseFloat(getComputedStyle(boundary, '::after').left) + boundary.getBoundingClientRect().left;
    const last = (row: string) => el.querySelector(`${row} .hw-stage:last-child .hw-node`)!.getBoundingClientRect();
    return { zone, paper: last('.hw-paper').right, pressure: last('.hw-pressure').left };
  });
  expect(edges.paper).toBeLessThan(edges.zone);
  expect(edges.pressure).toBeGreaterThan(edges.zone);
});

test('the scenario model sits in the hero, opens on a failure and states that it is illustrative', async ({ page }) => {
  await open(page);
  const lab = page.locator('.hero-home .window-lab');
  await expect(lab).toHaveAttribute('data-outcome', 'too-late');
  await expect(lab.locator('[data-wl-label]')).toHaveText('Too late');
  await expect(lab.locator('.wl-note')).toBeVisible();
  await expect(lab.locator('.wl-note')).toContainText('Illustrative model. Relative units, not measured durations, and not an assessment result.');
  const text = await lab.innerText();
  expect(text).not.toMatch(/Before impact|At risk|After impact|verdict/);
});

test('presets, stage sliders and the window test all change the outcome from the keyboard', async ({ page }) => {
  await open(page);
  const lab = page.locator('.window-lab');
  await lab.getByRole('radio', { name: 'The chain holds' }).check();
  await expect(lab).toHaveAttribute('data-outcome', 'in-time');
  await expect(lab.locator('[data-wl-text]')).toContainText('before the window closes');

  // Lengthen one stage until the same chain no longer lands in time.
  const decide = lab.getByRole('slider', { name: 'Decide: time taken' });
  await decide.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await expect(decide).toHaveValue('6');
  await expect(decide).toHaveAttribute('aria-valuetext', '6 of 6');
  await expect(lab).toHaveAttribute('data-outcome', 'narrow');
  await expect(lab.locator('[data-wl-text]')).toContainText('Decide takes the largest share of the time.');
  await expect(lab.locator('.wl-presets input:checked')).toHaveCount(0);
  await expect(lab.locator('[data-wl-scenario]')).toContainText('Your own scenario');

  await lab.getByRole('radio', { name: '25% shorter' }).check();
  await expect(lab).toHaveAttribute('data-outcome', 'too-late');
  await expect(lab.locator('[data-wl-text]')).toContainText('The window closes during');
  // Twelve units against a fifteen-unit window: in time, but not by enough
  // to survive that window being a quarter shorter.
  await lab.getByRole('radio', { name: '25% longer' }).check();
  await expect(lab).toHaveAttribute('data-outcome', 'narrow');
  await expect(lab.locator('[data-wl-text]')).toContainText('would not if the window were 25% shorter');
});

test('the drawn chain agrees with the stated outcome', async ({ page }) => {
  await open(page);
  const lab = page.locator('.window-lab');
  const lastNodeBeyondBoundary = () => lab.evaluate((el) => {
    const track = el.querySelector('.wl-rows .wl-row:last-child .wl-track')!;
    const boundary = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track, '::after').left);
    const node = track.querySelector('.wl-node')!.getBoundingClientRect();
    return node.left + node.width / 2 > boundary;
  });
  expect(await lastNodeBeyondBoundary()).toBe(true);
  await lab.getByRole('radio', { name: 'The chain holds' }).check();
  await expect(lab).toHaveAttribute('data-outcome', 'in-time');
  await expect.poll(lastNodeBeyondBoundary).toBe(false);
});

test('the scenario plays through time when motion is allowed, and settles on the same outcome', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const lab = page.locator('.window-lab');
  await lab.locator('.wl-figure').scrollIntoViewIfNeeded();
  const replay = lab.getByRole('button', { name: 'Replay the scenario' });
  await expect(replay).toBeVisible();
  await replay.click();
  await expect(lab).toHaveAttribute('data-playing', '');
  await expect(lab.locator('[data-wl-status]')).toHaveText(/Detecting|Escalating|Deciding|Intervening/);
  await expect(lab).not.toHaveAttribute('data-playing', '', { timeout: 8000 });
  await expect(lab).toHaveAttribute('data-outcome', 'too-late');
  await expect(lab.locator('[data-wl-label]')).toBeVisible();
  // Reduced motion removes playback, never the result.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(replay).toBeHidden();
  await expect(lab.locator('[data-wl-label]')).toHaveText('Too late');
});

test('without JavaScript the model is a fixed illustration and every artefact part is on the page', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const lab = page.locator('.window-lab');
  await expect(lab.locator('.wl-figure')).toBeVisible();
  await expect(lab.locator('[data-wl-label]')).toHaveText('Too late');
  await expect(lab.locator('.wl-note')).toBeVisible();
  await expect(lab.locator('.wl-presets')).toBeHidden();
  await expect(lab.locator('.wl-range').first()).toBeHidden();
  const artefact = page.locator('.artefact');
  await expect(artefact.locator('[role="tablist"]')).toBeHidden();
  for (const id of ['#af-scope', '#af-evidence', '#af-findings', '#af-conclusion', '#af-verification']) {
    await expect(artefact.locator(id)).toBeVisible();
  }
  await expect(page.locator('.offer-ladder')).toContainText('none is a prerequisite');
  await context.close();
});

test('artefact parts follow the tab pattern and keep the constructed status in view', async ({ page }) => {
  await open(page);
  const artefact = page.locator('.artefact');
  const tabs = artefact.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await expect(artefact.getByRole('tabpanel')).toHaveCount(1);
  await artefact.getByRole('tab', { name: 'SEDI findings' }).focus();
  for (const name of ['Conclusion', 'Verification', 'Scope', 'Evidence register']) {
    await page.keyboard.press('ArrowRight');
    const tab = artefact.getByRole('tab', { name });
    await expect(tab).toBeFocused();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(artefact.getByRole('tabpanel')).toHaveCount(1);
    await expect(artefact.locator('.af-status')).toHaveText('Constructed illustration');
  }
  await expect(artefact.locator('#af-evidence li')).toHaveCount(6);
  await artefact.getByRole('tab', { name: 'Conclusion' }).click();
  await expect(artefact.locator('#af-conclusion')).toContainText('Illustrative, not issued, not signed.');
  await artefact.getByRole('tab', { name: 'Verification' }).click();
  await expect(artefact.locator('#af-verification')).toContainText('This illustration is not signed.');
  await expect(artefact.locator('#af-verification')).toContainText('not validated against real-world outcomes');
});

test('the offer comparison includes each earlier engagement and gives every list its own labels', async ({ page }) => {
  await open(page);
  const routes = page.locator('.offer-ladder .ol-route');
  await expect(routes).toHaveCount(offers.length);
  const included = await routes.evaluateAll((els) => els.map((el) => el.querySelectorAll('.ol-cap.is-on').length));
  expect(included).toEqual([2, 4, 8]);
  for (let i = 0; i < offers.length; i++) {
    const route = routes.nth(i);
    await expect(route.locator('.ol-cap')).toHaveCount(8);
    await expect(route).toContainText(offers[i].price);
    await expect(route.locator('.ol-link')).toHaveAttribute('href', `/services/#${offers[i].slug}`);
    // The label is in the accessibility tree even where the table hides it visually.
    await expect(route.getByRole('list').first()).toContainText('Intervention Readiness verdict, with its basis and limitations');
  }
  await expect(routes.nth(0).locator('.ol-cap').nth(6)).toContainText('not included');
  await expect(routes.nth(2).locator('.ol-cap').nth(6)).toContainText(': included');
});

test('the homepage instruments do not overflow at any supported width', async ({ page }) => {
  await open(page);
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Layout settles a frame after the resize, as it does on the existing pages.
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${width}px` }).toBeLessThanOrEqual(0);
    const clipped = await page.locator('.wl-mark, .wl-presets span, .ol-name, .af-tabs button, .af-stamp').evaluateAll((els) => els.filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1);
    }).length);
    expect(clipped, `${width}px`).toBe(0);
  }
});

test('opening a SEDI stage closes the others and marks every later stage as waiting on it', async ({ page }) => {
  await open(page);
  const stages = page.locator('.sedi-explorer details');
  // Detect is open on arrival: every later stage already reads as waiting.
  await expect(stages.nth(0)).toHaveAttribute('open', '');
  await expect(page.locator('.sedi-explorer .sedi-wait:visible')).toHaveText(['Waits on Detect', 'Waits on Escalate', 'Waits on Decide']);
  await stages.nth(1).locator('summary').click();
  await expect(stages.nth(1)).toHaveAttribute('open', '');
  await expect(stages.nth(0)).not.toHaveAttribute('open');
  await expect(page.locator('.sedi-explorer .sedi-wait:visible')).toHaveText(['Waits on Escalate', 'Waits on Decide']);
  await stages.nth(2).locator('summary').click();
  await expect(stages.nth(2)).toHaveAttribute('open', '');
  await expect(stages.nth(1)).not.toHaveAttribute('open');
  await expect(page.locator('.sedi-explorer .sedi-wait:visible')).toHaveText(['Waits on Decide']);
  // The open stage's detail is not confined to its own column on wide screens.
  if ((page.viewportSize()?.width ?? 0) > 1100) {
    const widths = await page.locator('.sedi-explorer').evaluate((el) => ({
      chain: el.querySelector('ol')!.getBoundingClientRect().width,
      detail: el.querySelector('details[open] dl')!.getBoundingClientRect().width,
    }));
    expect(widths.detail).toBeGreaterThan(widths.chain * 0.95);
  }
});

test('at 1440 by 900 the whole model and its outcome are in the opening view', async ({ page, isMobile }) => {
  test.skip(isMobile, 'A desktop composition.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const lab = page.locator('.window-lab');
  for (const part of ['.wl-presets', '.wl-rows .wl-row:last-child .wl-track', '.wl-outcome', '.wl-text']) {
    const box = (await lab.locator(part).boundingBox())!;
    expect(box.y, part).toBeGreaterThan(0);
    expect(box.y + box.height, part).toBeLessThanOrEqual(900);
  }
  // The headline keeps its place above the model, and the primary action is beside it.
  const headline = (await page.locator('#home-question').boundingBox())!;
  expect(headline.y + headline.height).toBeLessThan((await lab.boundingBox())!.y);
  await expect(page.locator('.hero-home [data-primary-cta]')).toBeInViewport();
});

test('the model plays on arrival without scrolling, offers a replay, and moves nothing on the page', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    localStorage.setItem('intv-consent', 'denied');
    (window as any).__shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) if (!entry.hadRecentInput) (window as any).__shift += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const lab = page.locator('.window-lab');
  // On a phone the headline fills the opening view, so the model waits
  // until it is on screen; it shows its result throughout either way.
  if (isMobile) {
    await expect(lab.locator('[data-wl-label]')).toHaveText('Too late');
    await lab.locator('.wl-figure').scrollIntoViewIfNeeded();
  } else {
    expect(await page.evaluate(() => scrollY)).toBe(0);
  }
  await expect(lab).toHaveAttribute('data-playing', '', { timeout: 4000 });
  await expect(lab.locator('[data-wl-status]')).toHaveText(/Detecting|Escalating|Deciding|Intervening/);
  await expect(lab).not.toHaveAttribute('data-playing', '', { timeout: 8000 });
  await expect(lab.locator('[data-wl-label]')).toHaveText('Too late');
  const replay = lab.getByRole('button', { name: 'Replay the scenario' });
  await expect(replay).toBeVisible();
  // Desktop keeps the control in the opening view; a phone scrolls a short way back to it.
  if (!isMobile) await expect(replay).toBeInViewport();
  await replay.click();
  await expect(lab).toHaveAttribute('data-playing', '');
  await expect(lab).not.toHaveAttribute('data-playing', '', { timeout: 8000 });
  expect(await page.evaluate(() => (window as any).__shift)).toBeLessThan(0.01);
});

test('with reduced motion the model shows its result at once and never plays', async ({ page }) => {
  await open(page);
  const lab = page.locator('.window-lab');
  await page.waitForTimeout(1600);
  await expect(lab).not.toHaveAttribute('data-playing', '');
  await expect(lab.locator('[data-wl-label]')).toHaveText('Too late');
  await expect(lab.getByRole('button', { name: 'Replay the scenario' })).toBeHidden();
  await expect(lab.locator('.wl-hint')).toHaveText('Move a stage to change the outcome');
});

test('each engagement leads with its question and states its fee beside it', async ({ page }) => {
  await open(page);
  const heads = page.locator('.offer-ladder .ol-head');
  for (let i = 0; i < offers.length; i++) {
    await expect(heads.nth(i).locator('.ol-q')).toHaveText(offers[i].question);
    await expect(heads.nth(i).locator('.ol-price')).toHaveText(offers[i].price);
    await expect(heads.nth(i).locator('.ol-price-note')).toHaveText(offers[i].priceNote);
  }
  // Each fee appears once per engagement, not repeated lower in the column.
  for (const o of offers) await expect(page.locator('.offer-ladder').getByText(o.price, { exact: true })).toHaveCount(1);
});
