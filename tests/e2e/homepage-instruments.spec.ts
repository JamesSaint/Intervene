/**
 * The homepage's visual instruments: the opening scene, the SEDI chain, the
 * evidence trace and the three engagements. Each must read without
 * JavaScript, work from the keyboard and by touch, keep its qualification on
 * screen, and agree with the model it draws.
 */
import { test, expect, type Page } from '@playwright/test';
import { offers } from '../../src/lib/offers';
import { PRESETS, WINDOWS, evaluate, describe as describeResult, OUTCOME_LABEL } from '../../src/lib/window-model';
import { boundary, segments, progress, percent } from '../../src/lib/race-geometry';

async function open(page: Page) {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.window-race')).toHaveAttribute('data-ready', '');
}
const openDiagnostics = async (page: Page) => {
  const diag = page.locator('.wr-diag');
  if ((await diag.getAttribute('open')) === null) await diag.locator('summary').click();
  await expect(diag).toHaveAttribute('open', '');
};
/** What the scene has actually drawn, read back from the page. */
const drawn = (page: Page) => page.locator('.window-race').evaluate((el) => {
  const vertical = innerWidth <= 720;
  const track = el.querySelector('[data-wr-track="response"]')!.getBoundingClientRect();
  const size = vertical ? track.height : track.width;
  const origin = vertical ? track.top : track.left;
  const zone = el.querySelector('[data-wr-track="response"] .wr-after')!.getBoundingClientRect();
  const segs = Array.from(el.querySelectorAll('[data-wr-seg]')).map((seg) => {
    const box = seg.getBoundingClientRect();
    const start = (vertical ? box.top : box.left) - origin;
    return { start: start / size, end: (start + (vertical ? box.height : box.width)) / size };
  });
  return { boundary: ((vertical ? zone.top : zone.left) - origin) / size, segs };
});

test.describe('opening scene', () => {
  test('sits in the hero, opens on a failure and states that it is illustrative', async ({ page }) => {
    await open(page);
    const race = page.locator('.hero-home .window-race');
    await expect(race).toHaveAttribute('data-outcome', 'too-late');
    await expect(race.locator('[data-wr-word]')).toHaveText('Too late');
    await expect(race.locator('.wr-note')).toBeVisible();
    await expect(race.locator('.wr-note')).toContainText('Illustrative model. Relative units, not measured durations, and not an assessment result.');
    const text = await race.innerText();
    expect(text).not.toMatch(/Before impact|At risk|After impact|verdict/);
  });

  test('gives the figure a text equivalent that names the scenario, the outcome and where the window closed', async ({ page }) => {
    await open(page);
    const race = page.locator('.window-race');
    const figure = race.getByRole('img');
    await expect(figure).toHaveAccessibleName(/Illustrative scenario, Authority out of reach: Too late\. The window closes during Intervene\./);
    await expect(figure).toHaveAccessibleDescription(/Relative units, not measured durations/);
    // The large word and caption are presentation; assistive technology reads the sentence once.
    await expect(race.locator('.wr-telling')).toHaveAttribute('aria-hidden', 'true');
    await expect(race.locator('.wr-result')).toHaveAttribute('aria-live', 'polite');
  });

  test('draws the stages and the boundary where the model puts them, for every scenario', async ({ page }) => {
    await open(page);
    const race = page.locator('.window-race');
    for (const preset of PRESETS) {
      await race.locator('[data-wr-preset]').selectOption(preset.key);
      const result = evaluate(preset.durations, WINDOWS.set);
      await expect(race).toHaveAttribute('data-outcome', result.outcome);
      await expect(race.locator('[data-wr-word]')).toHaveText(OUTCOME_LABEL[result.outcome]);
      await expect(race.locator('[data-wr-caption]')).toHaveText(describeResult(result));
      const want = segments(preset.durations, WINDOWS.set);
      // With reduced motion the site settles every property change over 80ms; read once it has.
      await expect.poll(async () => (await drawn(page)).segs[0].end, { message: preset.key }).toBeCloseTo(want[0].length, 2);
      await expect.poll(async () => (await drawn(page)).segs[3].end, { message: preset.key }).toBeCloseTo(want[3].start + want[3].length, 2);
      const got = await drawn(page);
      expect(got.boundary, preset.key).toBeCloseTo(boundary(preset.durations, WINDOWS.set), 2);
      got.segs.forEach((seg, i) => {
        expect(seg.start, `${preset.key} stage ${i} start`).toBeCloseTo(want[i].start, 2);
        expect(seg.end, `${preset.key} stage ${i} end`).toBeCloseTo(want[i].start + want[i].length, 2);
      });
      // The response reaches past the boundary exactly when the model says it is too late.
      expect(got.segs[3].end > got.boundary + 0.002, preset.key).toBe(result.outcome === 'too-late');
      const meter = progress(preset.durations, WINDOWS.set);
      await expect(race.locator('[data-wr-consumed]')).toHaveText(percent(meter.consumed));
      await expect(race.locator('[data-wr-remaining]')).toHaveText(percent(meter.remaining));
      await expect(race.locator('[data-wr-beyond]')).toHaveText(percent(meter.beyond));
    }
  });

  test('keeps the diagnostics apart, and stage timings change the outcome from the keyboard', async ({ page }) => {
    await open(page);
    const race = page.locator('.window-race');
    await expect(race.locator('.wr-diag')).not.toHaveAttribute('open');
    await expect(race.getByRole('slider').first()).toBeHidden();
    await race.locator('[data-wr-preset]').selectOption('holds');
    await expect(race).toHaveAttribute('data-outcome', 'in-time');
    await expect(race.locator('[data-wr-remaining]')).toHaveText('33%');

    await race.locator('.wr-diag summary').focus();
    await page.keyboard.press('Enter');
    await expect(race.locator('.wr-diag')).toHaveAttribute('open', '');
    const decide = race.getByRole('slider', { name: 'Decide: time taken' });
    await decide.focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await expect(decide).toHaveValue('6');
    await expect(decide).toHaveAttribute('aria-valuetext', '6 of 6');
    // Twelve units against a twelve-unit window: exactly on the boundary is not too late.
    await expect(race).toHaveAttribute('data-outcome', 'narrow');
    await expect(race.locator('[data-wr-consumed]')).toHaveText('100%');
    await expect(race.locator('[data-wr-beyond]')).toHaveText('0%');
    await expect(race.locator('[data-wr-caption]')).toContainText('Decide takes the largest share of the time.');
    await expect(race.locator('[data-wr-preset]')).toHaveValue('custom');
    await expect.poll(async () => { const got = await drawn(page); return got.segs[3].end - got.boundary; }).toBeCloseTo(0, 2);

    // One more unit on any stage carries the chain past the boundary.
    await race.getByRole('slider', { name: 'Detect: time taken' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(race).toHaveAttribute('data-outcome', 'too-late');
    await expect(race.locator('[data-wr-beyond]')).toHaveText('8%');
    await page.keyboard.press('ArrowLeft');
    await expect(race).toHaveAttribute('data-outcome', 'narrow');
    // Returning to a named scenario's timings names it again.
    for (let i = 0; i < 4; i++) { await decide.focus(); await page.keyboard.press('ArrowLeft'); }
    await expect(race.locator('[data-wr-preset]')).toHaveValue('holds');
  });

  test('tests the window a quarter shorter and longer, and moves the boundary to match', async ({ page }) => {
    await open(page);
    const race = page.locator('.window-race');
    await openDiagnostics(page);
    const d = PRESETS.find((p) => p.key === 'margin')!.durations;
    await race.locator('[data-wr-preset]').selectOption('margin');
    await expect(race).toHaveAttribute('data-outcome', 'narrow');
    for (const [name, key] of [['25% shorter', 'shorter'], ['25% longer', 'longer'], ['As set', 'set']] as const) {
      await race.getByRole('radio', { name }).check();
      const result = evaluate(d, WINDOWS[key]);
      await expect(race).toHaveAttribute('data-outcome', result.outcome);
      await expect(race.locator('[data-wr-caption]')).toHaveText(describeResult(result));
      await expect.poll(async () => (await drawn(page)).boundary, { message: key }).toBeCloseTo(boundary(d, WINDOWS[key]), 2);
      await expect(race.locator('[data-wr-consumed]')).toHaveText(percent(progress(d, WINDOWS[key]).consumed));
    }
  });

  test('plays on arrival, can be paused, resumed and replayed, and moves nothing on the page', async ({ page, isMobile }) => {
    await page.addInitScript(() => {
      localStorage.setItem('intv-consent', 'denied');
      (window as any).__shift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) if (!entry.hadRecentInput) (window as any).__shift += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const race = page.locator('.window-race');
    // On a phone the headline fills the opening view, so the scene waits
    // until it is on screen; it shows its result throughout either way.
    if (isMobile) {
      await expect(race.locator('[data-wr-word]')).toHaveText('Too late');
      await race.locator('.wr-telling').scrollIntoViewIfNeeded();
    } else {
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }
    await expect(race).toHaveAttribute('data-playing', '', { timeout: 4000 });
    // While time runs, the stage in progress is named and the outcome is withheld.
    await expect(race.locator('[data-wr-word]')).toHaveText(/Detect|Escalate|Decide|Intervene/);
    await expect(race).toHaveAttribute('data-outcome', 'in-time');
    await expect(race).not.toHaveAttribute('data-closed', '');

    const toggle = race.locator('[data-wr-toggle]');
    await expect(toggle).toHaveText('Pause');
    await toggle.click();
    await expect(toggle).toHaveText('Resume');
    const held = await race.evaluate((el) => getComputedStyle(el).getPropertyValue('--wr-p'));
    await page.waitForTimeout(300);
    expect(await race.evaluate((el) => getComputedStyle(el).getPropertyValue('--wr-p'))).toBe(held);
    await toggle.click();
    await expect(toggle).toHaveText('Pause');

    await expect(race).not.toHaveAttribute('data-playing', '', { timeout: 10000 });
    // A stage is shown complete only once its time has fully elapsed, and the outcome stays.
    await expect(race.locator('[data-wr-seg][data-state="completed"]')).toHaveCount(4);
    await expect(race.locator('[data-wr-word]')).toHaveText('Too late');
    await expect(race).toHaveAttribute('data-closed', '');
    await expect(toggle).toBeHidden();

    const replay = race.getByRole('button', { name: 'Replay' });
    await expect(replay).toBeVisible();
    if (!isMobile) await expect(replay).toBeInViewport();
    await replay.click();
    await expect(race).toHaveAttribute('data-playing', '');
    await expect(race.locator('[data-wr-seg][data-state="pending"]').first()).toBeVisible();
    await expect(race).not.toHaveAttribute('data-playing', '', { timeout: 10000 });
    expect(await page.evaluate(() => (window as any).__shift)).toBeLessThan(0.01);
    // It ran once on arrival and once on request; it does not start again by itself.
    await page.waitForTimeout(1200);
    await expect(race).not.toHaveAttribute('data-playing', '');
  });

  test('shows the window as closed only once time has reached the boundary', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const race = page.locator('.window-race');
    await race.locator('.wr-telling').scrollIntoViewIfNeeded();
    await expect(race).toHaveAttribute('data-playing', '', { timeout: 4000 });
    await race.locator('[data-wr-toggle]').click();
    const state = await race.evaluate((el) => ({ closed: el.hasAttribute('data-closed'), remaining: el.querySelector('[data-wr-remaining]')!.textContent }));
    expect(state.closed).toBe(state.remaining === '0%');
    await race.locator('[data-wr-toggle]').click();
    await expect(race).toHaveAttribute('data-closed', '', { timeout: 10000 });
    await expect(race.locator('[data-wr-remaining]')).toHaveText('0%');
  });

  test('with reduced motion it shows its result at once and offers no playback', async ({ page }) => {
    await open(page);
    const race = page.locator('.window-race');
    await page.waitForTimeout(1600);
    await expect(race).not.toHaveAttribute('data-playing', '');
    await expect(race.locator('[data-wr-word]')).toHaveText('Too late');
    await expect(race.getByRole('button', { name: 'Replay' })).toBeHidden();
    await race.locator('[data-wr-preset]').selectOption('holds');
    await expect(race).not.toHaveAttribute('data-playing', '');
    await expect(race.locator('[data-wr-word]')).toHaveText('In time');
  });

  test('at 1440 by 900 the question and the whole scene are in the opening view', async ({ page, isMobile }) => {
    test.skip(isMobile, 'A desktop composition.');
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const race = page.locator('.window-race');
    for (const part of ['.wr-word', '.wr-caption', '[data-wr-track="window"]', '[data-wr-track="response"]', '.wr-meter']) {
      const box = (await race.locator(part).boundingBox())!;
      expect(box.y, part).toBeGreaterThan(0);
      expect(box.y + box.height, part).toBeLessThanOrEqual(900);
    }
    const headline = (await page.locator('#home-question').boundingBox())!;
    expect(headline.y + headline.height).toBeLessThan((await race.boundingBox())!.y);
    await expect(page.locator('.hero-home [data-primary-cta]')).toBeInViewport();
  });

  test('on a phone time runs downwards and every stage carries its own name', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'A phone composition.');
    await open(page);
    const race = page.locator('.window-race');
    const boxes = await race.locator('[data-wr-seg]').evaluateAll((els) => els.map((el) => {
      const box = el.getBoundingClientRect();
      const name = el.querySelector('.wr-ghost')!.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, width: box.width, nameInside: name.left >= box.left && name.right <= box.right + 1 };
    }));
    boxes.slice(1).forEach((box, i) => expect(box.top).toBeGreaterThanOrEqual(boxes[i].bottom - 1));
    for (const box of boxes) { expect(box.width).toBeGreaterThan(200); expect(box.nameInside).toBe(true); }
    // Touch reaches the controls without hover.
    await race.locator('.wr-diag summary').tap();
    await expect(race.locator('.wr-diag')).toHaveAttribute('open', '');
    const targets = await race.locator('.wr-diag input, .wr-top select, .wr-top button').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    for (const height of targets) expect(height).toBeGreaterThanOrEqual(44);
  });
});

test('without JavaScript the scene is a fixed illustration and the whole trace is on the page', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const race = page.locator('.window-race');
  await expect(race.locator('.wr-figure')).toBeVisible();
  await expect(race.locator('[data-wr-word]')).toHaveText('Too late');
  await expect(race.locator('[data-wr-seg]')).toHaveCount(4);
  await expect(race.locator('.wr-note')).toBeVisible();
  await expect(race.locator('.wr-top')).toBeHidden();
  await expect(race.locator('.wr-diag')).toBeHidden();
  const trace = page.locator('.evidence-trace');
  await expect(trace.locator('.et-stage')).toHaveCount(4);
  await expect(trace.locator('.et-record')).toHaveCount(6);
  await trace.locator('.et-record summary').first().click();
  await expect(trace.locator('.et-record').first()).toContainText('What it supports, and what remains open');
  await expect(page.locator('.offer-depth')).toContainText('none is a prerequisite');
  await page.locator('.od-more summary').first().click();
  await expect(page.locator('.od-more').first()).toContainText('What you receive');
  await context.close();
});

test.describe('evidence trace', () => {
  test('keeps the constructed status in view and never calls the sample issued or signed', async ({ page }) => {
    await open(page);
    const trace = page.locator('.evidence-trace');
    await expect(trace.locator('.et-status')).toHaveText('Constructed illustration');
    await expect(trace.locator('.et-flags')).toHaveText('Not issued · Not signed · No client data');
    await expect(trace.locator('.et-state')).toHaveText('After impact');
    await expect(trace.locator('.et-conclusion')).toContainText('Illustrative, not issued, not signed.');
    await expect(trace).toContainText('Naming this constraint does not show that the other stages are adequate.');
    await expect(trace).toContainText('not to scale and not added together');
  });

  test('ties a record to a stage only where the sample supports it, and says why', async ({ page }) => {
    await open(page);
    const rows = page.locator('.evidence-trace .et-row');
    const ids = await rows.evaluateAll((els) => els.map((row) => Array.from(row.querySelectorAll('.et-id')).map((id) => id.textContent)));
    expect(ids).toEqual([['E-02', 'E-01'], ['E-04'], ['E-08'], []]);
    await expect(rows.nth(3).locator('.et-none')).toHaveText('No record examined. No duration is assessed for this stage.');
    await expect(rows.nth(2)).toHaveClass(/is-decisive/);
    const loose = page.locator('.evidence-trace .et-loose');
    await expect(loose.locator('.et-id')).toHaveText(['E-12', 'E-06']);
    await loose.locator('.et-record summary').first().click();
    await expect(loose.locator('.et-record').first()).toContainText('The sample does not tie it to a single stage.');
    const linked = rows.nth(0).locator('.et-record').first();
    await linked.locator('summary').click();
    await expect(linked).toContainText('a source for detection timing');
  });

  test('opens each record from the keyboard', async ({ page }) => {
    await open(page);
    const record = page.locator('.evidence-trace .et-row').nth(2).locator('.et-record');
    await record.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(record).toHaveAttribute('open', '');
    await expect(record).toContainText('It does not establish that the required quorum can be reached in time.');
    expect(await record.locator('summary').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(record).not.toHaveAttribute('open');
  });

  test('on a narrow screen the conclusion comes first and each finding carries its records beneath it', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'A phone composition.');
    await open(page);
    const trace = page.locator('.evidence-trace');
    const order = await trace.evaluate((el) => {
      const top = (sel: string) => el.querySelector(sel)!.getBoundingClientRect().top;
      const row = el.querySelector('.et-row')!;
      const stage = row.querySelector('.et-stage')!.getBoundingClientRect();
      const record = row.querySelector('.et-record')!.getBoundingClientRect();
      return { conclusionFirst: top('.et-conclusion') < top('.et-rows'), recordBelow: record.top >= stage.bottom - 1 };
    });
    expect(order).toEqual({ conclusionFirst: true, recordBelow: true });
  });
});

test.describe('three engagements', () => {
  test('each leads with its question, shows how far it examines, and states its fee and boundary', async ({ page }) => {
    await open(page);
    const routes = page.locator('.offer-depth .od-route');
    await expect(routes).toHaveCount(offers.length);
    expect(await routes.evaluateAll((els) => els.map((el) => el.querySelectorAll('.od-level.is-on').length))).toEqual([1, 2, 3]);
    for (let i = 0; i < offers.length; i++) {
      const route = routes.nth(i);
      await expect(route.locator('.od-q')).toHaveText(offers[i].question);
      await expect(route.locator('.od-name')).toContainText(offers[i].name.replace('AGDA® ', ''));
      await expect(route.locator('.od-price')).toHaveText(offers[i].price);
      await expect(route.locator('.od-fee-note')).toHaveText(offers[i].priceNote);
      await expect(route.locator('.od-boundary')).toBeVisible();
      await expect(route.locator('.od-link')).toHaveAttribute('href', `/services/#${offers[i].slug}`);
      await expect(route.locator('.od-level')).toHaveCount(3);
    }
    // Depth is stated in words as well as by fill.
    await expect(routes.nth(0).locator('.od-level').nth(2)).toContainText('Timing and verdict: not examined.');
    await expect(routes.nth(0).locator('.od-level').nth(2).locator('.od-level-body')).toHaveText('Not examined');
    await expect(routes.nth(2).locator('.od-level').nth(2)).toContainText('Timing and verdict: examined.');
    for (const o of offers) await expect(page.locator('.offer-depth').getByText(o.price, { exact: true })).toHaveCount(1);
    await expect(page.locator('.offer-depth')).toContainText('none is a prerequisite');
  });

  test('scope and deliverables open beneath each engagement from the keyboard', async ({ page }) => {
    await open(page);
    const more = page.locator('.od-more').nth(2);
    await expect(more.locator('.od-fields')).toBeHidden();
    await more.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(more.locator('.od-fields')).toBeVisible();
    for (const item of offers[2].receive) await expect(more.locator('.od-fields')).toContainText(item.replace('AGDA® ', ''));
  });
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
  await expect(stages.nth(1)).not.toHaveAttribute('open');
  await expect(page.locator('.sedi-explorer .sedi-wait:visible')).toHaveText(['Waits on Decide']);
  if ((page.viewportSize()?.width ?? 0) > 1100) {
    const widths = await page.locator('.sedi-explorer').evaluate((el) => ({
      chain: el.querySelector('ol')!.getBoundingClientRect().width,
      detail: el.querySelector('details[open] dl')!.getBoundingClientRect().width,
    }));
    expect(widths.detail).toBeGreaterThan(widths.chain * 0.95);
  }
});

test('the on-paper and under-pressure figure is labelled as conceptual and puts late intervention beyond the boundary', async ({ page }) => {
  await open(page);
  const figure = page.locator('.situations .hero-window');
  await expect(figure).toContainText('Conceptual illustration. Positions show order, not measured durations.');
  await expect(figure).toHaveAttribute('aria-label', /On paper.*Under pressure/);
  const edges = await figure.evaluate((el) => {
    const track = el.querySelector('.hw-pressure .hw-track')!;
    const zone = parseFloat(getComputedStyle(track, '::after').left) + track.getBoundingClientRect().left;
    const last = (row: string) => el.querySelector(`${row} .hw-stage:last-child .hw-node`)!.getBoundingClientRect();
    return { zone, paper: last('.hw-paper').right, pressure: last('.hw-pressure').left };
  });
  expect(edges.paper).toBeLessThan(edges.zone);
  expect(edges.pressure).toBeGreaterThan(edges.zone);
});

test('the homepage does not overflow at any supported width', async ({ page }) => {
  await open(page);
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Layout settles a frame after the resize, as it does on the existing pages.
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${width}px` }).toBeLessThanOrEqual(0);
    const clipped = await page.locator('.wr-word, .wr-select, .wr-meter, .et-state, .et-stamp, .od-q, .od-price').evaluateAll((els) => els.filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1);
    }).map((el) => el.className));
    expect(clipped, `${width}px`).toEqual([]);
  }
});
