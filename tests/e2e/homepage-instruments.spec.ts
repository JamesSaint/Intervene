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
/** The full evidence trace is on the sample verdict; the homepage carries the short example. */
async function openSample(page: Page) {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sample-report/');
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
    await expect(dial).not.toHaveAttribute('data-reading');
    await expect.poll(() => dial.locator('[data-wd-word]').evaluate((el) => getComputedStyle(el).color)).toBe('rgb(224, 118, 106)');
    await expect(dial.locator('.wd-note')).toBeVisible();
    await expect(dial.locator('.wd-note')).toContainText('One turn of the dial is the intervention window; time past it runs on the inner ring.');
    await expect(dial.locator('.wd-note')).toContainText('Relative units, not measured durations, and not an assessment result.');
    await expect(dial.locator('.wd-label')).toHaveText('Illustrative scenario');
    // The instrument never borrows a verdict word. The page's own link to the sample verdict sits in the action slot, outside it.
    for (const part of ['.wd-face', '.wd-readout', '.wd-bar', '.wd-note']) {
      expect(await dial.locator(part).innerText(), part).not.toMatch(/Before impact|At risk|After impact|verdict/);
    }
  });

  test('has a text equivalent that names the scenario, the outcome and where the window closed', async ({ page }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    const figure = dial.locator('.wd-figure');
    await expect(figure).toHaveAttribute('role', 'img');
    // The figure is named once; its reading is one live sentence in the page, so the outcome is announced once.
    await expect(figure).toHaveAccessibleName('Intervention dial. Its reading is given in the sentence that follows the stage list.');
    await expect(figure).toHaveAccessibleDescription(/Relative units, not measured durations/);
    await expect(dial.locator('.wd-result')).toHaveText(/Illustrative scenario, Authority out of reach: Too late\. The window closes during Intervene\./);
    expect(await dial.evaluate((el) => (el.textContent!.match(/The window closes during Intervene/g) ?? []).length)).toBe(1);
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
    // The explanatory sentence is read before the dial, not after it.
    expect(box.head.bottom).toBeLessThanOrEqual(box.support.top);
    expect(box.support.bottom).toBeLessThanOrEqual(box.face.top);
    expect(box.stages.bottom).toBeLessThanOrEqual(box.bar.top);
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
  // The short example and the comparison need no script either.
  await expect(page.locator('.example-status')).toBeVisible();
  await expect(page.locator('.cmp-item')).toHaveCount(3);
  await expect(page.locator('.evidence-trace')).toHaveCount(0);
  await page.goto('/sample-report/');
  const trace = page.locator('.evidence-trace');
  await expect(trace.locator('.et-stage')).toHaveCount(4);
  await expect(trace.locator('.et-record')).toHaveCount(6);
  await trace.locator('.et-record summary').first().click();
  await expect(trace.locator('.et-record').first()).toContainText('What it supports, and what remains open');
  await context.close();
});

test.describe('evidence trace', () => {
  test('keeps the constructed status in view and never calls the sample issued or signed', async ({ page }) => {
    await openSample(page);
    const trace = page.locator('.evidence-trace');
    await expect(trace.locator('.et-status')).toHaveText('Constructed illustration');
    await expect(trace.locator('.et-flags')).toHaveText('Not issued · Not signed · No client data');
    await expect(trace.locator('.et-state')).toHaveText('After impact');
    await expect(trace.locator('.et-conclusion')).toContainText('Illustrative, not issued, not signed.');
    await expect(trace).toContainText('Naming this constraint does not show that the other stages are adequate.');
    await expect(trace).toContainText('not to scale and not added together');
  });

  test('ties a record to a stage only where the sample supports it, and says why', async ({ page }) => {
    await openSample(page);
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
    // Two links are stated by the register; two are matches by description and are marked as such.
    const support = await page.locator('.evidence-trace .et-rows .et-record').evaluateAll((els) => els.map((el) => [el.querySelector('.et-id')!.textContent, el.classList.contains('is-matched')]));
    expect(support).toEqual([['E-02', false], ['E-01', true], ['E-04', true], ['E-08', false]]);
    await expect(page.locator('.evidence-trace .et-record.is-matched .et-type')).toHaveText([/matched by description/, /matched by description/]);
    const matched = rows.nth(1).locator('.et-record');
    await matched.locator('summary').click();
    await expect(matched).toContainText('It does not cite this record by its identifier.');
  });

  test('opens each record from the keyboard', async ({ page }) => {
    await openSample(page);
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
    await openSample(page);
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

test('the opening explains the offer before the first action, and labels the dial before its result', async ({ page }) => {
  await open(page);
  const sub = page.locator('.hero-home .hero-sub');
  await expect(sub).toHaveText('We assess whether your organisation can intervene in an AI-enabled system before harm becomes irreversible.');
  await expect(sub).toBeVisible();
  const cta = page.locator('.hero-home [data-primary-cta]');
  await expect(cta).toHaveText('Discuss your system');
  const secondary = page.locator('.hero-home .hero-secondary');
  await expect(secondary).toHaveText(/View sample verdict/);
  await expect(secondary).toHaveAttribute('href', '/sample-report/');
  const label = page.locator('.window-dial .wd-label');
  await expect(label).toHaveText('Illustrative scenario');
  await expect(label).toBeVisible();
  const y = async (sel: string) => (await page.locator(sel).first().boundingBox())!;
  const [h, s, c, l, w] = [await y('#home-question'), await y('.hero-home .hero-sub'), await y('.hero-home [data-primary-cta]'), await y('.wd-label'), await y('[data-wd-word]')];
  // Headline, sentence, action: in that order at every width.
  expect(h.y + h.height).toBeLessThanOrEqual(s.y);
  expect(s.y + s.height).toBeLessThanOrEqual(c.y);
  // The qualification is above the dial's result, and comes first in the document.
  expect(l.y + l.height).toBeLessThanOrEqual(w.y);
  expect(await page.evaluate(() => !!(document.querySelector('.wd-label')!.compareDocumentPosition(document.querySelector('[data-wd-word]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  // The methodology stays beside the four-stage explanation.
  await expect(page.locator('.method-block .related-links a[href="/methodology/"]')).toBeVisible();
  await expect(page.locator('.method-block .related-links a[href="/agda/"]')).toBeVisible();
});

test('the constructed credit example follows the opening, in brief, and links to the full sample', async ({ page }) => {
  await open(page);
  const sections = page.locator('main > section');
  await expect(sections.nth(1)).toHaveClass(/example/);
  const example = page.locator('.example');
  await expect(example.locator('h2')).toHaveText('Detection works. Authority does not.');
  await expect(example.locator('.example-status')).toHaveText('Constructed illustration');
  await expect(example.locator('.example-status')).toBeVisible();
  await expect(example.locator('.example-copy')).toHaveText('In this example, monitoring detects drift in about 12 minutes. Obtaining the required quorum takes at least seven days. The assumed window for stopping automated declines is about six hours.');
  await expect(example).toContainText('not an issued assessment or a verified outcome');
  await expect(example).toContainText('not added together');
  await expect(example.locator('a[href="/sample-report/"]')).toHaveText('View the full sample verdict');
  await expect(example.locator('.example-qualifier')).toHaveText('This retail credit example uses no client data and is not an issued assessment or a verified outcome. Its three intervals are stated separately and are not added together.');
  // Lower down, what a full assessment provides links to the trace, and names the sample as constructed.
  await expect(page.locator('#home-evidence')).toHaveText('What a full assessment provides');
  const traceLink = page.locator('.finding-block a[href="/sample-report/#authority"]');
  await expect(traceLink).toHaveText('See the evidence trace in the constructed sample verdict');
  await expect(page.locator('.finding-block a[href="/verify/"]')).toBeVisible();
  await expect(page.locator('.finding-block .integrity-note')).toBeVisible();
  // The full trace is on the sample page only.
  await expect(page.locator('.evidence-trace')).toHaveCount(0);
  await example.locator('a[href="/sample-report/"]').click();
  await expect(page).toHaveURL(/\/sample-report\/$/);
  await expect(page.locator('.evidence-trace .et-stage')).toHaveCount(4);
});

test('the three engagements are compared by question, output and fee, straight after the example', async ({ page }) => {
  await open(page);
  await expect(page.locator('main > section').nth(2)).toHaveAttribute('id', 'offers');
  const compare = page.locator('#offers .offer-compare');
  await expect(compare.locator('.cmp-intro')).toHaveText('You can commission any of the three engagements directly.');
  const items = compare.locator('.cmp-item');
  await expect(items).toHaveCount(offers.length);
  for (let i = 0; i < offers.length; i++) {
    const item = items.nth(i);
    await expect(item.locator('.cmp-q')).toHaveText(offers[i].question);
    await expect(item.locator('.cmp-name')).toContainText(offers[i].name.replace('AGDA® ', ''));
    await expect(item.locator('.cmp-output')).toBeVisible();
    await expect(item.locator('.cmp-price')).toHaveText(offers[i].price);
    await expect(item.locator('.cmp-k').nth(1)).toHaveText(offers[i].priceNote);
    await expect(item.locator('.cmp-link')).toHaveAttribute('href', `/services/#${offers[i].slug}`);
  }
  await expect(items.locator('.cmp-q')).toHaveText(['Can anyone stop this system?', 'What evidence do you have that you can stop this system?', 'Can you stop it in time?']);
  // Fees keep every published distinction.
  await expect(items.locator('.cmp-price')).toHaveText(['£12,500 fixed + VAT', 'From £25,000 + VAT', 'From £75,000 + VAT']);
  await expect(items.nth(2).locator('.cmp-k').nth(1)).toHaveText('Indicative initial fee');
  await expect(compare.locator('.cmp-note')).toContainText('Only the full Assessment produces an');
  await expect(compare.locator('.cmp-note')).toContainText('does not commit you to one or determine its verdict');
  // The pricing qualification sits with the comparison.
  await expect(page.locator('#offers .engage-terms')).toContainText('Initial pricing remains subject to market validation.');
  const text = await compare.innerText();
  expect(text).not.toMatch(/then|next step|upgrade|must|required before|progress to/i);
});

test('on a phone each engagement keeps its question, output, fee and link together', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'A phone composition.');
  await open(page);
  const boxes = await page.locator('.cmp-item').evaluateAll((els) => els.map((el) => {
    const b = el.getBoundingClientRect();
    const inside = ['.cmp-q', '.cmp-output', '.cmp-price', '.cmp-link'].every((sel) => { const c = el.querySelector(sel)!.getBoundingClientRect(); return c.top >= b.top && c.bottom <= b.bottom + 1 && c.right <= innerWidth; });
    return { top: b.top, bottom: b.bottom, inside };
  }));
  expect(boxes.every((b) => b.inside)).toBe(true);
  expect(boxes[0].bottom).toBeLessThanOrEqual(boxes[1].top);
  expect(boxes[1].bottom).toBeLessThanOrEqual(boxes[2].top);
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
  await expect(cells.locator('.sc-paper')).toHaveText([/On paper\s*Monitoring is documented\./, /On paper\s*A risk owner is named\./, /On paper\s*A procedure for stopping the system is written\./]);
  await expect(cells.locator('.sc-q')).toHaveText(['Will they know in time?', 'Who can actually stop it?', 'What happens when they act?']);
  // Authority is the open condition; what follows it is drawn as carrying nothing.
  await expect(cells.nth(1)).toHaveClass(/is-open/);
  await expect(cells.nth(2)).toHaveClass(/is-dead/);
  await expect(cells.locator('.sc-state')).toHaveText(['Holds', 'Open under pressure', 'Holds, but nothing reaches it']);
  await expect(circuit.locator('figcaption')).toContainText('Illustration. The three conditions are in series');
  // It is labelled as an illustration before it is read, and claims no observed result.
  await expect(circuit.locator('.sc-status')).toContainText('Illustration');
  await expect(circuit.locator('.sc-status')).toContainText('not a finding about any organisation');
  await expect(circuit.locator('figcaption')).toContainText('an example, not an observed result');
  const status = (await circuit.locator('.sc-status').boundingBox())!;
  const chain = (await circuit.locator('.sc-chain').boundingBox())!;
  expect(status.y + status.height).toBeLessThanOrEqual(chain.y);
  await expect(page.locator('.situations .dial-reading')).toHaveCount(0);
});

test('the homepage does not overflow at any supported width', async ({ page }) => {
  await open(page);
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Layout settles a frame after the resize, as it does on the existing pages.
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${width}px` }).toBeLessThanOrEqual(0);
    const clipped = await page.locator('.wd-face, .wd-select, .wd-meter, .dial-reading, .example-heading, .example-status, .cmp-q, .cmp-price, .cmp-link, .sc-q, .step-link').evaluateAll((els) => els.filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1);
    }).map((el) => el.className));
    expect(clipped, `${width}px`).toEqual([]);
  }
});

test('each section hands the visitor to the next, ending in one action', async ({ page }) => {
  await open(page);
  const steps = page.locator('main .step-link');
  await expect(steps).toHaveText([/How is that assessed\?/, /What does an assessment produce\?/]);
  for (const href of await steps.evaluateAll((els) => els.map((el) => el.getAttribute('href')!))) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  await steps.first().focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#home-method$/);
  await expect(page.locator('#home-method')).toBeInViewport();
  await expect(page.locator('#offers .engage-action .btn')).toHaveAttribute('href', '/contact/');
});

test.describe('one scenario, carried down the page', () => {
  const chain = (page: import('@playwright/test').Page) => page.locator('.sedi-explorer [data-sedi-chain] > li');
  const read = (page: import('@playwright/test').Page) => chain(page).evaluateAll((items) => items.map((li) => ({
    state: (li as HTMLElement).dataset.sediStage,
    text: li.querySelector('[data-sedi-state]')!.textContent,
    percent: li.querySelector('[data-sedi-pct]')!.textContent,
    longest: li.hasAttribute('data-sedi-longest'),
  })));

  test('the SEDI chain opens on the dial\'s default scenario, and says it is carried from the dial', async ({ page }) => {
    await open(page);
    const carry = page.locator('.sedi-carry');
    await expect(carry).toContainText('Carried from the dial · illustrative');
    await expect(carry).toContainText('Authority out of reach. The signal reaches someone who cannot authorise action. The window closes during Intervene.');
    expect(await read(page)).toEqual([
      { state: 'completed', text: 'Inside the window', percent: '8%', longest: false },
      { state: 'completed', text: 'Inside the window', percent: '50%', longest: true },
      { state: 'completed', text: 'Inside the window', percent: '33%', longest: false },
      { state: 'closes', text: 'Window closes here', percent: '17%', longest: false },
    ]);
    // The outcome sentence is the dial's own, word for word.
    const dialText = await page.locator('.window-dial [data-wd-text]').textContent();
    await expect(page.locator('[data-sedi-out]')).toHaveText(dialText!);
  });

  test('changing the dial changes the chain: scenario, shares, states and where the window closes', async ({ page }) => {
    await open(page);
    const before = await page.locator('.sedi-explorer').evaluate((el) => el.getBoundingClientRect().height);
    await page.locator('[data-wd-preset]').selectOption('holds');
    await expect(page.locator('[data-sedi-label]')).toHaveText('The chain holds.');
    await expect.poll(() => read(page)).toEqual([0, 1, 2, 3].map(() => ({ state: 'completed', text: 'Inside the window', percent: '17%', longest: false })));
    // The window closes at the right-hand end of every track, and the last stage ends two thirds of the way to it.
    await expect.poll(() => chain(page).evaluateAll((items) => items.map((li) => {
      const bar = li.querySelector('.sedi-share')!.getBoundingClientRect();
      const mark = li.querySelector('.sedi-boundary')!.getBoundingClientRect();
      const fill = li.querySelector('.sedi-fill')!.getBoundingClientRect();
      return [Math.round(((mark.left - bar.left) / bar.width) * 100), Math.round(((fill.right - bar.left) / bar.width) * 100)];
    }))).toEqual([[100, 17], [100, 33], [100, 50], [100, 67]]);
    await expect(page.locator('[data-sedi-out]')).toHaveText('Intervention takes effect before the window closes.');
    // In time: the chain is 67% of the window, a third of it remains, nothing lies beyond.
    await expect(page.locator('.sedi-figures')).toHaveText(/Whole chain\s*67% of the window[\s\S]*Window remaining\s*33%\s*Beyond the window\s*0%/);
    await expect(page.locator('.sedi-end-text')).toHaveText(['Complete at 17% elapsed', 'Complete at 33% elapsed', 'Complete at 50% elapsed', 'Complete at 67% elapsed']);

    // A shorter window closes during Decide, half-way through it, and Intervene falls after it.
    await page.locator('[data-wd-preset]').selectOption('reach');
    await page.locator('[data-wd-diag] summary').click();
    await page.locator('.wd-window input[value="shorter"]').check();
    await expect.poll(async () => (await read(page)).map((s) => s.state)).toEqual(['completed', 'completed', 'closes', 'after']);
    expect((await read(page)).map((s) => s.text)).toEqual(['Inside the window', 'Inside the window', 'Window closes here', 'After the window']);
    // Every track is on one scale: the whole chain, 13 units, because it is longer than the window of 9.
    const geometry = () => chain(page).evaluateAll((items) => items.map((li) => {
      const bar = li.querySelector('.sedi-share')!.getBoundingClientRect();
      const fill = li.querySelector('.sedi-fill')!.getBoundingClientRect();
      const mark = li.querySelector('.sedi-boundary')!.getBoundingClientRect();
      const at = (x: number) => Math.round(((x - bar.left) / bar.width) * 130) / 10;
      return { starts: at(fill.left), ends: at(fill.right), window: at(mark.left) };
    }));
    // Detect 1, Escalate 6, Decide 4, Intervene 2: each bar starts where the last ended, and the window closes at 9 on every track.
    await expect.poll(geometry).toEqual([
      { starts: 0, ends: 1, window: 9 },
      { starts: 1, ends: 7, window: 9 },
      { starts: 7, ends: 11, window: 9 },
      { starts: 11, ends: 13, window: 9 },
    ]);
    // Duration and elapsed time are stated separately, and elapsed time above 100% is stated as it is.
    await expect(page.locator('.sedi-share-text')).toHaveText(['Takes 11% of the window', 'Takes 67% of the window', 'Takes 44% of the window', 'Takes 22% of the window']);
    await expect(page.locator('.sedi-end-text')).toHaveText(['Complete at 11% elapsed', 'Complete at 78% elapsed', 'Complete at 122% elapsed', 'Complete at 144% elapsed']);
    await expect(page.locator('.sedi-figures')).toHaveText(/Whole chain\s*144% of the window[\s\S]*Window remaining\s*0%\s*Beyond the window\s*44%/);
    // The dial's own meter agrees: all of the window is used, and 44% lies beyond it.
    await expect(page.locator('[data-wd-consumed]')).toHaveText('100%');
    await expect(page.locator('[data-wd-remaining]')).toHaveText('0%');
    await expect(page.locator('[data-wd-beyond-value]')).toHaveText('44%');
    // The chain never changes height as the scenario changes.
    const after = await page.locator('.sedi-explorer').evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
  });

  test('the chain reads as the default scenario without JavaScript, and other pages carry no scenario', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.sedi-carry')).toContainText('Authority out of reach.');
    await expect(page.locator('.sedi-explorer [data-sedi-state]')).toHaveText(['Inside the window', 'Inside the window', 'Inside the window', 'Window closes here']);
    await page.goto('/methodology/');
    await expect(page.locator('.sedi-explorer')).toHaveCount(1);
    await expect(page.locator('.sedi-carry, .sedi-scn')).toHaveCount(0);
    await context.close();
  });

  test('picking a stage on the dial reads its share of the window in the centre', async ({ page, isMobile }) => {
    await open(page);
    const dial = page.locator('.window-dial');
    await expect(dial.locator('[data-wd-word]')).toHaveText('Too late');
    await dial.locator('[data-wd-stage="1"]').click();
    await expect(dial.locator('[data-wd-word]')).toHaveText('Escalate');
    await expect(dial.locator('[data-wd-caption]')).toHaveText('Takes 50% of the window');
    await expect(dial.locator('[data-wd-stage="1"]')).toHaveAttribute('aria-pressed', 'true');
    // A stage name in the centre is never coloured as an outcome.
    await expect(dial).toHaveAttribute('data-reading', '');
    await expect.poll(() => dial.locator('[data-wd-word]').evaluate((el) => getComputedStyle(el).color)).not.toBe('rgb(224, 118, 106)');
    await dial.locator('[data-wd-stage="1"]').click();
    await expect(dial.locator('[data-wd-word]')).toHaveText('Too late');
    await expect(dial.locator('[data-wd-caption]')).toHaveText('Window closed during Intervene');
    if (!isMobile) {
      // The arc itself can be pressed.
      await page.evaluate(() => window.scrollTo(0, 0));
      const box = await dial.locator('.dial-face').boundingBox();
      // Escalate runs from 1/12 to 7/12 of the turn; a quarter turn (three o'clock) is inside it.
      await page.mouse.click(box!.x + box!.width / 2 + (238 / 600) * box!.width, box!.y + box!.height / 2);
      await expect(dial.locator('[data-wd-word]')).toHaveText('Escalate');
      await expect(dial.locator('[data-wd-stage="1"]')).toHaveAttribute('aria-pressed', 'true');
    }
  });
});

test.describe('the executive reading of the evidence', () => {
  test('answers four questions from the trace\'s own data', async ({ page }) => {
    await openSample(page);
    const lenses = page.locator('.evidence-trace .et-lens');
    await expect(lenses.locator('.et-lens-q')).toHaveText(['What was examined', 'What the example establishes', 'What remains uncertain', 'Why the conclusion follows']);
    await expect(lenses.nth(0).locator('.et-lens-a')).toHaveText('Auto-decline pathway, macro shock with model drift. Six records and four stages, against an assumed window of about six hours.');
    await expect(lenses.nth(1).locator('.et-lens-a')).toHaveText('Detect, ~12 min: within the window. Decide, ≥ 7 days: exceeds the window on its own.');
    await expect(lenses.nth(2).locator('.et-lens-a')).toHaveText('Escalate, 4 to 96 hours: may consume or exceed the window. Intervene: not assessed. Two records are matched by description only; two tie to no single stage.');
    await expect(lenses.nth(3).locator('.et-lens-a')).toContainText('Authority, not detection.');
    // The status of the sample stays above it.
    await expect(page.locator('.evidence-trace .et-status')).toBeVisible();
  });

  test('pressing a question marks what it rests on, hides nothing, and clears on a second press', async ({ page, browserName }) => {
    await openSample(page);
    const trace = page.locator('.evidence-trace');
    const marked = () => trace.locator('.is-marked').evaluateAll((els) => els.map((el) => el.querySelector('.et-id, .et-stage-name')?.textContent ?? el.className.split(' ')[0]).sort());
    const visibleBefore = await trace.locator('.et-record, .et-stage, .et-conclusion').evaluateAll((els) => els.filter((el) => (el as HTMLElement).offsetParent !== null).length);

    await trace.locator('[data-et-lens="established"]').click();
    await expect(trace.locator('[data-et-lens="established"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await marked()).toEqual(['Decide', 'Detect', 'E-02', 'E-08']);
    await expect(trace.locator('[data-et-status]')).toHaveText('Marked on the trace below: 2 stages, 2 records.');

    await trace.locator('[data-et-lens="open"]').click();
    await expect(trace.locator('[data-et-lens="established"]')).toHaveAttribute('aria-pressed', 'false');
    expect(await marked()).toEqual(['E-01', 'E-04', 'E-06', 'E-12', 'Escalate', 'Intervene', 'et-none']);
    await expect(trace.locator('[data-et-status]')).toHaveText('Marked on the trace below: 2 stages, 4 records, one stage with no record.');
    // Uncertain parts are ringed with a broken line; established ones with a solid one.
    expect(await trace.locator('.is-marked').first().evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('dashed');

    await trace.locator('[data-et-lens="why"]').click();
    expect(await marked()).toEqual(['Decide', 'et-conclusion', 'et-constraint']);
    await trace.locator('[data-et-lens="examined"]').click();
    await expect(trace.locator('.et-record.is-marked')).toHaveCount(6);

    const visibleAfter = await trace.locator('.et-record, .et-stage, .et-conclusion').evaluateAll((els) => els.filter((el) => (el as HTMLElement).offsetParent !== null).length);
    expect(visibleAfter).toBe(visibleBefore);
    await trace.locator('[data-et-lens="examined"]').click();
    await expect(trace.locator('.is-marked')).toHaveCount(0);
    await expect(trace.locator('[data-et-status]')).toHaveText('');
    // Keyboard: each question is a button reached in order.
    await trace.locator('[data-et-lens="examined"]').focus();
    // Safari moves between buttons with Option+Tab unless full keyboard access is on.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(trace.locator('[data-et-lens="established"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(trace.locator('[data-et-lens="established"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('the scenario can be read and set from the chain', () => {
  test('the chain names the dial as its source, links back to it, and the dial links down to the chain', async ({ page }) => {
    await open(page);
    await expect(page.locator('.sedi-carry-k')).toHaveText('Carried from the dial · illustrative');
    await expect(page.locator('.sedi-back')).toHaveAttribute('href', '#window-dial');
    await expect(page.locator('#window-dial')).toHaveCount(1);
    await expect(page.locator('.wd-follow')).toHaveAttribute('href', '#home-method');
    await expect(page.locator('.wd-follow')).toContainText('This scenario is carried into the chain below');
    await expect(page.locator('.sedi-key')).toHaveText('Each bar is one stage on the same scale. Its length is how long the stage takes; its right end is the time elapsed when the stage completes. The line is where the window closes.');
  });

  test('choosing a scenario on the chain sets the dial, and the two never disagree', async ({ page }) => {
    await open(page);
    const pick = page.locator('[data-sedi-preset]');
    await expect(pick).toHaveValue('reach');
    await pick.selectOption('halt');
    // The dial takes it: its select, its outcome sentence and its meter.
    await expect(page.locator('[data-wd-preset]')).toHaveValue('halt');
    await expect(page.locator('.window-dial [data-wd-scn]')).toHaveText('Halt lands late');
    await expect(page.locator('[data-sedi-label]')).toHaveText('Halt lands late.');
    const dialText = await page.locator('.window-dial [data-wd-text]').textContent();
    await expect(page.locator('[data-sedi-out]')).toHaveText(dialText!);
    await expect(page.locator('[data-sedi-beyond]')).toHaveText(await page.locator('[data-wd-beyond-value]').innerText());
    // And the other way: the dial changes, the chain's control follows.
    await page.locator('[data-wd-preset]').selectOption('margin');
    await expect(pick).toHaveValue('margin');
    // Timings set by hand on the dial are named as such on the chain.
    await page.locator('[data-wd-diag] summary').click();
    await page.locator('[data-wd-range="0"]').fill('5');
    await expect(pick).toHaveValue('custom');
    await expect(page.locator('[data-sedi-label]')).toHaveText('Your own timings.');
  });

  test('the chain control is keyboard operable and is withheld without JavaScript', async ({ page, browser }) => {
    await open(page);
    await page.locator('[data-sedi-preset]').focus();
    await page.locator('[data-sedi-preset]').selectOption('holds');
    await expect(page.locator('[data-wd-preset]')).toHaveValue('holds');
    const context = await browser.newContext({ javaScriptEnabled: false });
    const plain = await context.newPage();
    await plain.goto('/');
    await expect(plain.locator('.sedi-pick')).toBeHidden();
    await expect(plain.locator('.sedi-end-text')).toHaveText(['Complete at 8% elapsed', 'Complete at 58% elapsed', 'Complete at 92% elapsed', 'Complete at 108% elapsed']);
    await context.close();
  });
});

test('the evidence lens offers a way to the first marked item, and marks the lines that leave it', async ({ page }) => {
  await openSample(page);
  const trace = page.locator('.evidence-trace');
  await expect(trace.locator('[data-et-jump]')).toBeHidden();
  await trace.locator('[data-et-lens="why"]').click();
  const jump = trace.locator('[data-et-jump]');
  await expect(jump).toBeVisible();
  await jump.click();
  await expect(trace.locator('.is-marked').first()).toBeInViewport();
  // A marked finding is ringed at three pixels, and its connector is drawn at the same weight.
  const ring = await trace.locator('.et-stage.is-marked').first().evaluate((el) => [getComputedStyle(el).outlineWidth, getComputedStyle(el, '::after').borderTopWidth]);
  expect(ring).toEqual(['3px', '3px']);
  await trace.locator('[data-et-lens="why"]').click();
  await expect(jump).toBeHidden();
});

test('without JavaScript the evidence questions are still answered, and offer no control that does nothing', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/sample-report/');
  await expect(page.locator('.et-lens-a').first()).toBeVisible();
  await expect(page.locator('.et-exec-hint')).toBeHidden();
  await expect(page.locator('.et-lens-foot')).toBeHidden();
  await context.close();
});

test('on a phone the chain header keeps the scenario, the principal figure and the way back, and folds the rest', async ({ page, isMobile }) => {
  await open(page);
  const more = page.locator('[data-sedi-more]');
  const toggle = page.locator('[data-sedi-more-toggle]');
  // Always in view: the scenario, its sentence, the whole-chain figure and both links.
  await expect(page.locator('[data-sedi-preset]')).toBeVisible();
  await expect(page.locator('.sedi-carry-line')).toBeVisible();
  await expect(page.locator('.sedi-principal')).toHaveText(/Whole chain\s*108% of the window/);
  await expect(page.locator('.sedi-principal')).toBeVisible();
  await expect(page.locator('.sedi-back')).toBeVisible();
  if (isMobile) {
    // Secondary figures and the key wait behind one button that names and controls its region.
    await expect(toggle).toHaveText('More measurements and how to read the bars');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'sedi-more');
    await expect(more).toBeHidden();
    expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-sedi-remaining]')).toBeVisible();
    await expect(page.locator('[data-sedi-beyond]')).toHaveText('8%');
    await expect(page.locator('.sedi-key')).toBeVisible();
    // The folded figures still follow the scenario, and stay open while it changes.
    await page.locator('[data-sedi-preset]').selectOption('holds');
    await expect(page.locator('[data-sedi-remaining]')).toHaveText('33%');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await toggle.click();
    await expect(more).toBeHidden();
  } else {
    // On a wide screen everything is shown and there is no control to operate.
    await expect(toggle).toBeHidden();
    await expect(page.locator('[data-sedi-beyond]')).toBeVisible();
    await expect(page.locator('.sedi-key')).toBeVisible();
  }
});

test('without JavaScript every chain figure and the key are shown', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-sedi-more-toggle]')).toBeHidden();
  await expect(page.locator('[data-sedi-beyond]')).toBeVisible();
  await expect(page.locator('.sedi-key')).toBeVisible();
  await context.close();
});

test.describe('the dial centre fits its word at every width', () => {
  for (const width of [320, 390, 768, 1000, 1100, 1180, 1280, 1440, 1920]) {
    test(`at ${width}px every outcome and every stage name sits inside the centre, centred`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page);
      const fit = () => page.locator('.window-dial').evaluate((dial) => {
        const face = dial.querySelector('.dial-face')!.getBoundingClientRect();
        const word = dial.querySelector('[data-wd-word]')!;
        const range = document.createRange(); range.selectNodeContents(word);
        const text = range.getBoundingClientRect();
        // The inner guide circle is 62% of the dial across; the word must sit within it.
        return { text: word.textContent, fits: text.width <= face.width * 0.58, offCentre: Math.abs((text.left + text.width / 2) - (face.left + face.width / 2)) };
      });
      for (const key of ['holds', 'margin', 'reach']) {
        await page.locator('[data-wd-preset]').selectOption(key);
        // The size settles over the site's short state transition, so the reading is polled.
        // Negative tracking leaves a word a pixel or two off its box's centre; more than that is an overflow.
        await expect.poll(async () => { const r = await fit(); return r.fits && r.offCentre <= 2.5; }, { message: `${key} at ${width}` }).toBe(true);
      }
      for (let i = 0; i < 4; i += 1) {
        await page.locator(`[data-wd-stage="${i}"]`).click();
        await expect.poll(async () => { const r = await fit(); return r.fits && r.offCentre <= 2.5; }, { message: `stage ${i} at ${width}` }).toBe(true);
        await page.locator(`[data-wd-stage="${i}"]`).click();
      }
    });
  }
});

test('buttons and links do not move when hovered', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Hover is a pointer behaviour.');
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  // Motion is on: this is the condition under which the buttons used to lift.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const route of ['/', '/services/', '/agda/', '/insights/']) {
    await page.goto(route, { waitUntil: 'networkidle' });
    const targets = page.locator('main :is(a.btn, a.btn-ghost, a.link, a.arrow-link):visible');
    const count = Math.min(await targets.count(), 12);
    expect(count, route).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const el = targets.nth(i);
      await el.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const read = () => el.evaluate((node) => { const r = node.getBoundingClientRect(); const s = getComputedStyle(node); return { y: Math.round(r.y * 10) / 10, x: Math.round(r.x * 10) / 10, h: r.height, transform: s.transform, offset: s.textUnderlineOffset }; });
      const before = await read();
      // Hover at the lower edge, where a lifting button would lose the pointer.
      const box = (await el.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 1);
      await page.waitForTimeout(260);
      expect(await read(), `${route} ${await el.innerText()}`).toEqual(before);
      // And it is still hovered: the pointer has not been left behind.
      expect(await el.evaluate((node) => node.matches(':hover'))).toBe(true);
    }
  }
});
