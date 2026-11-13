/**
 * The homepage's visual instruments: the opening scene, the SEDI chain, the
 * evidence trace and the three engagements. Each must read without
 * JavaScript, work from the keyboard and by touch, keep its qualification on
 * screen, and agree with the model it draws.
 */
import { test, expect, type Page } from '@playwright/test';
import { offers } from '../../src/lib/offers';
import { PRESETS, WINDOWS, evaluate, describe as describeResult, OUTCOME_LABEL } from '../../src/lib/window-model';
import { dialArcs, progress, percent } from '../../src/lib/dial-geometry';

async function open(page: Page) {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.window-dial')).toHaveAttribute('data-ready', '');
}
const openDiagnostics = async (page: Page) => {
  const diag = page.locator('.wd-diag');
  if ((await diag.getAttribute('open')) === null) await diag.locator('summary').click();
  await expect(diag).toHaveAttribute('open', '');
};
/** What the dial has actually drawn, read back from the page as turns. */
const drawn = (page: Page) => page.locator('.window-dial').evaluate((el) => {
  const read = (sel: string) => Array.from(el.querySelectorAll(sel)).map((arc) => {
    const length = parseFloat(arc.getAttribute('stroke-dasharray')!.split(' ')[0]);
    const from = -parseFloat(arc.getAttribute('stroke-dashoffset')!);
    return { from, to: from + length, drawn: length > 0 };
  });
  return { window: read('[data-df-arc]'), beyond: read('[data-df-beyond]'), ticks: el.querySelectorAll('[data-df-ticks] line.is-major').length };
});
/** The same arcs from the geometry, with the small gap the drawing leaves between stages. */
const expected = (durations: readonly number[], window: number) => {
  const arcs = dialArcs(durations, window);
  const pick = (ring: 'window' | 'beyond') => durations.map((_, stage) => arcs.find((a) => a.stage === stage && a.ring === ring));
  return { window: pick('window'), beyond: pick('beyond') };
};
async function expectDrawn(page: Page, durations: readonly number[], window: number, message: string) {
  const want = expected(durations, window);
  const got = await drawn(page);
  for (const ring of ['window', 'beyond'] as const) {
    want[ring].forEach((arc, i) => {
      expect(got[ring][i].drawn, `${message} ${ring} stage ${i} drawn`).toBe(!!arc && arc.to - arc.from > 0.006);
      if (!arc || arc.to - arc.from <= 0.006) return;
      expect(got[ring][i].from, `${message} ${ring} stage ${i} from`).toBeCloseTo(arc.from, 4);
      expect(got[ring][i].to, `${message} ${ring} stage ${i} to`).toBeCloseTo(arc.to - 0.006, 4);
    });
  }
  // One major tick for each unit of the window being tested.
  expect(got.ticks, `${message} ticks`).toBe(window);
}

test.describe('the dial', () => {
  test('is the opening object, opens on a failure and states that it is illustrative', async ({ page }) => {
    await open(page);
    const dial = page.locator('.hero-home .window-dial');
    await expect(dial).toHaveAttribute('data-outcome', 'too-late');
    await expect(dial.locator('[data-wd-word]')).toHaveText('Too late');
    await expect(dial.locator('[data-wd-caption]')).toHaveText('Window closed during Intervene');
    await expect(dial.locator('.wd-note')).toBeVisible();
    await expect(dial.locator('.wd-note')).toContainText('One turn of the dial is the intervention window; time past it runs on the inner ring.');
    await expect(dial.locator('.wd-note')).toContainText('Relative units, not measured durations, and not an assessment result.');
    const text = await dial.innerText();
    expect(text).not.toMatch(/Before impact|At risk|After impact|verdict/);
  });

  test('has a text equivalent that names the scenario, the outcome and where the window closed', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    const figure = dial.locator('.wd-figure');
    await expect(figure).toHaveAttribute('role', 'img');
    await expect(figure).toHaveAccessibleName(/Illustrative scenario, Authority out of reach: Too late\. The window closes during Intervene\./);
    await expect(figure).toHaveAccessibleDescription(/Relative units, not measured durations/);
    await expect(dial.locator('.wd-result')).toHaveAttribute('aria-live', 'polite');
    // Stage states are words, not only marks and colour.
    await expect(dial.locator('[data-wd-state]')).toHaveText(['Completed', 'Completed', 'Completed', 'Window closes here']);
    await expect(dial.locator('[data-wd-consumed]')).toHaveText('100%');
    await expect(dial.locator('[data-wd-remaining]')).toHaveText('0%');
    await expect(dial.locator('[data-wd-beyond-value]')).toHaveText('8%');
  });

  test('draws every scenario exactly where the model and the geometry put it', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    for (const preset of PRESETS) {
      await dial.locator('[data-wd-preset]').selectOption(preset.key);
      const result = evaluate(preset.durations, WINDOWS.set);
      await expect(dial).toHaveAttribute('data-outcome', result.outcome);
      await expect(dial.locator('[data-wd-word]')).toHaveText(OUTCOME_LABEL[result.outcome]);
      await expect(dial.locator('[data-wd-text]')).toHaveText(describeResult(result));
      await expectDrawn(page, preset.durations, WINDOWS.set, preset.key);
      // The inner ring carries an arc exactly when the model says it is too late.
      expect((await drawn(page)).beyond.some((arc) => arc.drawn), preset.key).toBe(result.outcome === 'too-late');
      const meter = progress(preset.durations, WINDOWS.set);
      await expect(dial.locator('[data-wd-consumed]')).toHaveText(percent(meter.consumed));
      await expect(dial.locator('[data-wd-remaining]')).toHaveText(percent(meter.remaining));
      await expect(dial.locator('[data-wd-beyond-value]')).toHaveText(percent(meter.beyond));
    }
  });

  test('keeps the diagnostics apart, and stage timings change the outcome from the keyboard', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    await expect(dial.locator('.wd-diag')).not.toHaveAttribute('open');
    await expect(dial.getByRole('slider').first()).toBeHidden();
    await dial.locator('[data-wd-preset]').selectOption('holds');
    await expect(dial).toHaveAttribute('data-outcome', 'in-time');
    await expect(dial.locator('[data-wd-remaining]')).toHaveText('33%');

    await dial.locator('.wd-diag summary').focus();
    await page.keyboard.press('Enter');
    await expect(dial.locator('.wd-diag')).toHaveAttribute('open', '');
    const decide = dial.getByRole('slider', { name: 'Decide: time taken' });
    await decide.focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await expect(decide).toHaveValue('6');
    await expect(decide).toHaveAttribute('aria-valuetext', '6 of 6');
    // Twelve units against a twelve-unit window: exactly on the boundary is not too late,
    // and the last arc ends at twelve o'clock with nothing on the inner ring.
    await expect(dial).toHaveAttribute('data-outcome', 'narrow');
    await expect(dial.locator('[data-wd-consumed]')).toHaveText('100%');
    await expect(dial.locator('[data-wd-beyond-value]')).toHaveText('0%');
    await expect(dial.locator('[data-wd-text]')).toContainText('Decide takes the largest share of the time.');
    await expect(dial.locator('[data-wd-preset]')).toHaveValue('custom');
    await expectDrawn(page, [2, 2, 6, 2], WINDOWS.set, 'on the boundary');
    const edge = await drawn(page);
    expect(edge.window[3].to).toBeCloseTo(1 - 0.006, 4);
    expect(edge.beyond.some((arc) => arc.drawn)).toBe(false);

    // One more unit on any stage carries the chain past the boundary, onto the inner ring.
    await dial.getByRole('slider', { name: 'Detect: time taken' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(dial).toHaveAttribute('data-outcome', 'too-late');
    await expect(dial.locator('[data-wd-beyond-value]')).toHaveText('8%');
    await expectDrawn(page, [3, 2, 6, 2], WINDOWS.set, 'one unit over');
    await page.keyboard.press('ArrowLeft');
    await expect(dial).toHaveAttribute('data-outcome', 'narrow');
    for (let i = 0; i < 4; i++) { await decide.focus(); await page.keyboard.press('ArrowLeft'); }
    await expect(dial.locator('[data-wd-preset]')).toHaveValue('holds');
  });

  test('tests the window a quarter shorter and longer, and rescales the dial to match', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    await openDiagnostics(page);
    const d = PRESETS.find((p) => p.key === 'margin')!.durations;
    await dial.locator('[data-wd-preset]').selectOption('margin');
    await expect(dial).toHaveAttribute('data-outcome', 'narrow');
    for (const [name, key] of [['25% shorter', 'shorter'], ['25% longer', 'longer'], ['As set', 'set']] as const) {
      await dial.getByRole('radio', { name }).check();
      const result = evaluate(d, WINDOWS[key]);
      await expect(dial).toHaveAttribute('data-outcome', result.outcome);
      await expect(dial.locator('[data-wd-text]')).toHaveText(describeResult(result));
      await expectDrawn(page, d, WINDOWS[key], key);
      await expect(dial.locator('[data-wd-consumed]')).toHaveText(percent(progress(d, WINDOWS[key]).consumed));
    }
  });

  test('holds at the limits of the sliders, where the inner ring fills and the figure keeps counting', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    await openDiagnostics(page);
    for (const name of ['Detect', 'Escalate', 'Decide', 'Intervene']) {
      await dial.getByRole('slider', { name: `${name}: time taken` }).focus();
      await page.keyboard.press('End');
    }
    await dial.getByRole('radio', { name: '25% shorter' }).check();
    await expect(dial).toHaveAttribute('data-outcome', 'too-late');
    await expect(dial.locator('[data-wd-beyond-value]')).toHaveText('167%');
    await expectDrawn(page, [6, 6, 6, 6], WINDOWS.shorter, 'maximum');
    for (const name of ['Detect', 'Escalate', 'Decide', 'Intervene']) {
      await dial.getByRole('slider', { name: `${name}: time taken` }).focus();
      await page.keyboard.press('Home');
    }
    await dial.getByRole('radio', { name: '25% longer' }).check();
    await expect(dial).toHaveAttribute('data-outcome', 'in-time');
    await expect(dial.locator('[data-wd-consumed]')).toHaveText('27%');
    await expectDrawn(page, [1, 1, 1, 1], WINDOWS.longer, 'minimum');
  });

  test('picks out a stage on the dial from its row in the list, by pointer or keyboard', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    const escalate = dial.locator('[data-wd-stage="1"]');
    await escalate.focus();
    await page.keyboard.press('Enter');
    await expect(escalate).toHaveAttribute('aria-pressed', 'true');
    await expect(dial).toHaveAttribute('data-focus', '1');
    await expect(dial.locator('[data-df-arc].is-focus')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(escalate).toHaveAttribute('aria-pressed', 'false');
    await expect(dial).not.toHaveAttribute('data-focus');
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
    const dial = page.locator('.window-dial');
    await dial.locator('.wd-face').scrollIntoViewIfNeeded();
    await expect(dial).toHaveAttribute('data-playing', '', { timeout: 4000 });
    // While time runs, the stage in progress is named, later stages are pending and the outcome is withheld.
    await expect(dial.locator('[data-wd-word]')).toHaveText(/Detect|Escalate|Decide|Intervene/);
    await expect(dial).toHaveAttribute('data-outcome', 'in-time');
    await expect(dial).not.toHaveAttribute('data-closed', '');
    await expect(dial.locator('[data-wd-state]').last()).toHaveText('Pending');

    const toggle = dial.locator('[data-wd-toggle]');
    await expect(toggle).toHaveText('Pause');
    await toggle.click();
    await expect(toggle).toHaveText('Resume');
    const held = JSON.stringify(await drawn(page));
    await page.waitForTimeout(300);
    expect(JSON.stringify(await drawn(page))).toBe(held);
    // Paused part-way: the window reads closed only if no time remains.
    const state = await dial.evaluate((el) => ({ closed: el.hasAttribute('data-closed'), remaining: el.querySelector('[data-wd-remaining]')!.textContent }));
    expect(state.closed && state.remaining !== '0%').toBe(false);
    await toggle.click();
    await expect(toggle).toHaveText('Pause');

    await expect(dial).not.toHaveAttribute('data-playing', '', { timeout: 12000 });
    // A stage reads complete only once its time has fully elapsed, and the outcome stays.
    await expect(dial.locator('[data-wd-stage][data-state="completed"]')).toHaveCount(4);
    await expect(dial.locator('[data-wd-word]')).toHaveText('Too late');
    await expect(dial).toHaveAttribute('data-closed', '');
    await expect(toggle).toBeHidden();
    await expectDrawn(page, PRESETS.find((p) => p.key === 'reach')!.durations, WINDOWS.set, 'after playback');

    const replay = dial.locator(isMobile ? '.wd-bar [data-wd-replay]' : '.wd-face-replay');
    await expect(replay).toBeVisible();
    await replay.click();
    await expect(dial).toHaveAttribute('data-playing', '');
    await expect(dial).not.toHaveAttribute('data-playing', '', { timeout: 12000 });
    expect(await page.evaluate(() => (window as any).__shift)).toBeLessThan(0.01);
    // It ran once on arrival and once on request; it does not start again by itself.
    await page.waitForTimeout(1200);
    await expect(dial).not.toHaveAttribute('data-playing', '');
  });

  test('with reduced motion it shows its result at once and offers no playback', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    await page.waitForTimeout(1600);
    await expect(dial).not.toHaveAttribute('data-playing', '');
    await expect(dial.locator('[data-wd-word]')).toHaveText('Too late');
    await expect(dial.locator('[data-wd-replay]').first()).toBeHidden();
    await dial.locator('[data-wd-preset]').selectOption('holds');
    await expect(dial).not.toHaveAttribute('data-playing', '');
    await expect(dial.locator('[data-wd-word]')).toHaveText('In time');
  });

  test('at 1440 by 900 the question and the whole dial are in the opening view, and the dial is the larger', async ({ page, isMobile }) => {
    test.skip(isMobile, 'A desktop composition.');
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const face = (await page.locator('.wd-face').boundingBox())!;
    expect(face.y).toBeGreaterThan(0);
    expect(face.y + face.height).toBeLessThanOrEqual(900);
    expect(face.width).toBeGreaterThanOrEqual(600);
    const headline = (await page.locator('#home-question').boundingBox())!;
    // The question is set at display size, and the dial is still the larger of the two.
    expect(headline.height).toBeGreaterThan(280);
    expect(face.width).toBeGreaterThan(headline.width);
    expect(face.height).toBeGreaterThan(headline.height * 1.6);
    for (const part of ['#home-question', '.hero-home [data-primary-cta]', '.wd-stages', '.wd-meter']) {
      await expect(page.locator(part), part).toBeInViewport({ ratio: 1 });
    }
  });

  test('on a phone the dial keeps its full width, with the stage list beneath it as the key', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'A phone composition.');
    await open(page);
    const dial = page.locator('.window-dial');
    const box = await dial.evaluate((el) => {
      const top = (sel: string) => el.querySelector(sel)!.getBoundingClientRect();
      return { face: top('.wd-face'), stages: top('.wd-stages'), support: top('.wd-support'), bar: top('.wd-bar'), head: top('.wd-head'), view: innerWidth };
    });
    expect(box.face.width).toBeGreaterThan(box.view * 0.85);
    expect(box.head.bottom).toBeLessThanOrEqual(box.face.top);
    expect(box.face.bottom).toBeLessThanOrEqual(box.stages.top);
    expect(box.stages.bottom).toBeLessThanOrEqual(box.support.top);
    expect(box.support.bottom).toBeLessThanOrEqual(box.bar.top);
    // Touch reaches every control without hover.
    await dial.locator('[data-wd-stage="2"]').tap();
    await expect(dial).toHaveAttribute('data-focus', '2');
    await dial.locator('.wd-diag summary').tap();
    await expect(dial.locator('.wd-diag')).toHaveAttribute('open', '');
    const targets = await dial.locator('.wd-diag input, .wd-bar select, .wd-bar button, .wd-stage').evaluateAll((els) => els.filter((el) => (el as HTMLElement).offsetParent).map((el) => el.getBoundingClientRect().height));
    for (const height of targets) expect(height).toBeGreaterThanOrEqual(44);
  });
});

test('without JavaScript the dial is a fixed reading and the whole trace is on the page', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const dial = page.locator('.window-dial');
  await expect(dial.locator('.wd-figure')).toBeVisible();
  await expect(dial.locator('[data-wd-word]')).toHaveText('Too late');
  await expect(dial.locator('[data-df-arc]')).toHaveCount(4);
  await expect(dial.locator('[data-wd-state]')).toHaveText(['Completed', 'Completed', 'Completed', 'Window closes here']);
  await expect(dial.locator('.wd-note')).toBeVisible();
  await expect(dial.locator('.wd-bar')).toBeHidden();
  await expect(dial.locator('.wd-face-replay')).toBeHidden();
  const trace = page.locator('.evidence-trace');
  await expect(trace.locator('.et-stage')).toHaveCount(4);
  await expect(trace.locator('.et-record')).toHaveCount(6);
  await trace.locator('.et-record summary').first().click();
  await expect(trace.locator('.et-record').first()).toContainText('What it supports, and what remains open');
  await expect(page.locator('.offer-intro')).toContainText('none is a prerequisite');
  await expect(page.locator('.oi-route')).toHaveCount(3);
  await page.locator('.oi-compare summary').click();
  await expect(page.locator('.offer-ladder .ol-route').first()).toBeVisible();
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

test('the engagements are introduced by question, scope and fee, with boundaries on the page', async ({ page }) => {
  await open(page);
  const routes = page.locator('.offer-intro .oi-route');
  await expect(routes).toHaveCount(offers.length);
  for (let i = 0; i < offers.length; i++) {
    const route = routes.nth(i);
    await expect(route.locator('.oi-q')).toHaveText(offers[i].question);
    await expect(route.locator('.oi-name')).toContainText(offers[i].name.replace('AGDA® ', ''));
    await expect(route.locator('.oi-price')).toHaveText(offers[i].price);
    await expect(route.locator('.oi-fee-note')).toHaveText(offers[i].priceNote);
    await expect(route.locator('.oi-boundary')).toBeVisible();
    await expect(route.locator('.oi-link')).toHaveAttribute('href', `/services/#${offers[i].slug}`);
  }
  // Inclusion is stated in the engagement's own words, and the full comparison starts closed.
  await expect(routes.nth(1).locator('.oi-includes')).toContainText('Everything in the Authority Check.');
  await expect(routes.nth(2).locator('.oi-includes')).toContainText('Everything in the Review.');
  await expect(page.locator('.offer-intro')).toContainText('none is a prerequisite');
  const compare = page.locator('.oi-compare');
  await expect(compare).not.toHaveAttribute('open');
  await expect(compare.locator('.ol-route').first()).toBeHidden();
  await compare.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(compare.locator('.ol-route').first()).toBeVisible();
});

test('the full comparison includes each earlier engagement and gives every list its own labels', async ({ page }) => {
  await open(page);
  await page.locator('.oi-compare summary').click();
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

test('in the full comparison each engagement leads with its question and states its fee beside it', async ({ page }) => {
  await open(page);
  await page.locator('.oi-compare summary').click();
  const heads = page.locator('.offer-ladder .ol-head');
  for (let i = 0; i < offers.length; i++) {
    await expect(heads.nth(i).locator('.ol-q')).toHaveText(offers[i].question);
    await expect(heads.nth(i).locator('.ol-price')).toHaveText(offers[i].price);
    await expect(heads.nth(i).locator('.ol-price-note')).toHaveText(offers[i].priceNote);
  }
  // Each fee appears once per engagement, not repeated lower in the column.
  for (const o of offers) await expect(page.locator('.offer-ladder').getByText(o.price, { exact: true })).toHaveCount(1);
  for (const o of offers) await expect(page.locator('.oi-routes').getByText(o.price, { exact: true })).toHaveCount(1);
});

test('opening a SEDI stage closes the others and marks every later stage as waiting on it', async ({ page }) => {
  await open(page);
  const stages = page.locator('.sedi-explorer details');
  // Detect is open on arrival: every later stage already reads as waiting.
  await expect(stages.nth(0)).toHaveAttribute('open', '');
  // What each stage needs from the one before is on the chain without any interaction.
  await expect(page.locator('.sedi-explorer .sedi-needs')).toHaveText(['Starts the chain', 'Needs an actionable signal', 'Needs the signal to reach someone with authority', 'Needs an authorised decision and a working mechanism']);
  for (const needs of await page.locator('.sedi-explorer .sedi-needs').all()) await expect(needs).toBeVisible();
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

test('the series circuit shows one open condition stopping a response the documents describe as covered', async ({ page }) => {
  await open(page);
  const circuit = page.locator('.situations .series-circuit');
  const cells = circuit.locator('.sc-cell');
  await expect(cells).toHaveCount(3);
  // Each condition pairs a documented control with the question that decides it.
  await expect(cells.locator('.sc-paper')).toHaveText([/On paper\s*Monitoring is documented\./, /On paper\s*A risk owner is named\./, /On paper\s*A halt procedure is written\./]);
  await expect(cells.locator('.sc-q')).toHaveText(['Will they know in time?', 'Who can actually stop it?', 'What happens when they act?']);
  // Authority is the open condition; what follows it is drawn as carrying nothing.
  await expect(cells.nth(1)).toHaveClass(/is-open/);
  await expect(cells.nth(2)).toHaveClass(/is-dead/);
  await expect(cells.locator('.sc-state')).toHaveText(['Holds', 'Open under pressure', 'Holds, but nothing reaches it']);
  await expect(circuit.locator('figcaption')).toContainText('Illustration. The three conditions are in series');
  await expect(page.locator('.situations .dial-reading')).toHaveCount(0);
});

test('the homepage does not overflow at any supported width', async ({ page }) => {
  await open(page);
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Layout settles a frame after the resize, as it does on the existing pages.
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${width}px` }).toBeLessThanOrEqual(0);
    const clipped = await page.locator('.wd-face, .wd-select, .wd-meter, .dial-reading, .et-state, .et-stamp, .oi-q, .oi-price, .sc-q, .step-link').evaluateAll((els) => els.filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1);
    }).map((el) => el.className));
    expect(clipped, `${width}px`).toEqual([]);
  }
});

test('each section hands the visitor to the next, ending in one action', async ({ page }) => {
  await open(page);
  const steps = page.locator('main .step-link');
  await expect(steps).toHaveText([/How is that assessed\?/, /What does an assessment produce\?/, /Which engagement fits your system\?/]);
  for (const href of await steps.evaluateAll((els) => els.map((el) => el.getAttribute('href')!))) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  await steps.first().focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#home-method$/);
  await expect(page.locator('#home-method')).toBeInViewport();
  await expect(page.locator('#offers .engage-action .btn')).toHaveAttribute('href', '/contact/');
});
