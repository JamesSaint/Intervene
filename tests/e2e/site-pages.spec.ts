/**
 * Page treatments added in the site-wide pass. Each page has one figure
 * suited to its purpose; these tests hold that the figure says what the
 * page's own content says and carries its qualification with it.
 */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('AGDA: the three verdict states are drawn as a specimen and never as a result', async ({ page }) => {
  await page.goto('/agda/');
  const figure = page.locator('#verdict .verdict-dials');
  await expect(figure).toHaveAttribute('aria-label', /A specimen of the verdict format, not a result\./);
  await expect(figure.locator('.vd-status')).toContainText('Specimen');
  await expect(figure.locator('.vd-status')).toContainText('Not a result.');
  await expect(figure.locator('.vd-name')).toHaveText(['Before impact', 'At risk', 'After impact']);
  await expect(figure.locator('.vd-line')).toHaveText([
    'Intervention completes in time. The window stays open.',
    'Completes within a margin ordinary pressure can erode.',
    'Intervention lands too late. The window has closed.',
  ]);
  await expect(figure.locator('.vd-caption')).toContainText('The Authority Check and the Intervention Readiness Review do not produce a verdict.');
  // Only the third state draws anything past the window.
  const beyond = await figure.locator('.vd-state').evaluateAll((els) => els.map((el) => Array.from(el.querySelectorAll('.df-arc-beyond')).some((arc) => parseFloat(arc.getAttribute('stroke-dasharray')!) > 0)));
  expect(beyond).toEqual([false, false, true]);
  // The status sits before the dials, so it is read first.
  const status = (await figure.locator('.vd-status').boundingBox())!;
  const states = (await figure.locator('.vd-states').boundingBox())!;
  expect(status.y + status.height).toBeLessThanOrEqual(states.y);
});

for (const [slug, other, theirs, ours] of [
  ['vs-audit', 'Audit', 'Did the controls operate as intended?', 'Can intervention occur in time?'],
  ['vs-ai-governance', 'AI Governance', null, null],
  ['vs-compliance', 'Compliance', 'Are the obligations met?', null],
  ['vs-operational-resilience', 'Operational Resilience', null, null],
  ['vs-risk-management', 'Risk Management', null, null],
] as const) {
  test(`${slug}: the two core questions lead the page and match the comparison table`, async ({ page }) => {
    await page.goto(`/intervention-readiness/${slug}/`);
    const pair = page.locator('.two-questions');
    await expect(pair.locator('.tq-side .mono')).toHaveText([`${other} asks`, 'Intervention Readiness asks']);
    const shown = await pair.locator('.tq-side p').allInnerTexts();
    if (theirs) expect(shown[0]).toBe(theirs);
    if (ours) expect(shown[1]).toBe(ours);
    // The figure restates the table's own "Core question" row, word for word.
    const row = page.locator('.table-compare tbody tr', { has: page.locator('th', { hasText: 'Core question' }) });
    const cells = (await row.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
    expect(shown.map((t) => t.replace(/\s+/g, ' ').trim())).toEqual(cells);
  });
}

for (const [slug, on, caption] of [
  ['halt-authority', ['Decide'], /Halt authority sits at Decide/],
  ['intervention-chain', ['Detect', 'Escalate', 'Decide', 'Intervene'], /all four stages, in sequence/],
  ['reversibility-window', ['Window closes'], /the time the whole chain has to complete in/],
] as const) {
  test(`${slug}: the term is placed in the intervention chain`, async ({ page }) => {
    await page.goto(`/intervention-readiness/${slug}/`);
    const figure = page.locator('.chain-position');
    await expect(figure).toHaveAttribute('aria-label', caption);
    await expect(figure.locator('figcaption')).toHaveText(caption);
    await expect(figure.locator('li.is-on .cp-name')).toHaveText([...on]);
  });
}

test('human-oversight carries no chain position, because the methodology places it at no single stage', async ({ page }) => {
  await page.goto('/intervention-readiness/human-oversight/');
  await expect(page.locator('.chain-position')).toHaveCount(0);
});

test('verify: what the signature covers and does not cover are marked differently, in words and in form', async ({ page }) => {
  await page.goto('/verify/');
  const lists = page.locator('#coverage .mark-list');
  await expect(lists).toHaveCount(2);
  await expect(lists.nth(0)).not.toHaveClass(/is-no/);
  await expect(lists.nth(1)).toHaveClass(/is-no/);
  await expect(page.locator('#coverage h3')).toHaveText(['Covered by the signature', 'Not covered by the signature']);
  await expect(page.locator('#establishes .mark-list.is-no')).toContainText('AGDA® is not validated against real-world outcomes.');
  const marks = await lists.evaluateAll((els) => els.map((el) => getComputedStyle(el.querySelector('li')!, '::before').borderTopStyle));
  expect(marks).toEqual(['solid', 'dashed']);
});

test('sample report: the trace leads the finding and keeps the sample\'s status and qualifications', async ({ page }) => {
  await page.goto('/sample-report/');
  const trace = page.locator('#authority .evidence-trace');
  await expect(trace.locator('.et-status')).toHaveText('Constructed illustration');
  await expect(trace.locator('.et-stage')).toHaveCount(4);
  await expect(trace.locator('.et-record')).toHaveCount(6);
  await expect(trace).toContainText('not to scale and not added together');
  // The six-minute figure and the homepage's "Not assessed" are the same measure, said the same way.
  await expect(page.locator('#stages')).toContainText('assumed by the source to propagate a halt if instructed. No duration is assessed for this stage.');
  await expect(trace.locator('.et-row').nth(3)).toContainText('Not assessed');
  await expect(trace.locator('.et-row').nth(3)).toContainText('The source assumes about six minutes to propagate a halt if instructed; no duration is assessed here');
  // The page's own tables remain beneath it.
  await expect(page.locator('#gates .tbl tbody tr')).toHaveCount(6);
  await expect(page.locator('#register .tbl tbody tr')).toHaveCount(6);
});

test('reference pages open with the heading on the left and its sentence low on the right', async ({ page, isMobile }) => {
  test.skip(isMobile, 'A wide-screen composition.');
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['/methodology/', '/sectors/', '/intervention-readiness/', '/glossary/']) {
    await page.goto(route);
    const h1 = (await page.locator('main .hero .h1').boundingBox())!;
    const lede = (await page.locator('main .hero .h1 + .lede').boundingBox())!;
    expect(lede.x, route).toBeGreaterThan(h1.x + h1.width);
    expect(lede.y + lede.height, route).toBeLessThanOrEqual(h1.y + h1.height + 2);
  }
});

test('two-tone headings keep their weight and stay readable in both appearances', async ({ page }) => {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.goto('/methodology/');
    const tone = await page.locator('main .hero .h1').evaluate((h1) => {
      const em = h1.querySelector('em')!;
      const rgb = (value: string) => value.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);
      const lum = (c: number[]) => { const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      let bg = 'rgba(0, 0, 0, 0)'; let el: Element | null = h1;
      while (el && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { bg = getComputedStyle(el).backgroundColor; el = el.parentElement; }
      const a = lum(rgb(getComputedStyle(em).color)); const b = lum(rgb(bg));
      return { weight: getComputedStyle(em).fontWeight, same: getComputedStyle(em).fontWeight === getComputedStyle(h1).fontWeight, style: getComputedStyle(em).fontStyle, contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    });
    expect(tone.same, scheme).toBe(true);
    expect(tone.style, scheme).toBe('normal');
    expect(tone.contrast, scheme).toBeGreaterThanOrEqual(4.5);
  }
});

test('verify: the signature boundary is drawn as a solid frame, with what lies outside it on a broken edge', async ({ page }) => {
  await page.goto('/verify/');
  for (const id of ['#coverage', '#establishes']) {
    const edges = await page.locator(`${id} .boundary > div`).evaluateAll((els) => els.map((el) => [el.className, getComputedStyle(el).borderBottomStyle, getComputedStyle(el).borderBottomWidth]));
    expect(edges, id).toEqual([['boundary-in', 'solid', '2px'], ['boundary-out', 'dashed', '1px']]);
  }
  // Integrity is inside the frame; truth, completeness and validity are outside it.
  await expect(page.locator('#establishes .boundary-in')).toContainText('neither has changed since signing');
  await expect(page.locator('#establishes .boundary-in')).toContainText('It does not independently establish that the engine was executed');
  const outside = page.locator('#establishes .boundary-out');
  await expect(outside.locator('li')).toHaveCount(7);
  await expect(outside).toContainText('That the underlying evidence is true or complete.');
  await expect(outside).toContainText('That intervention will work in a future event.');
});

test('sectors: each sector pairs what is expected with where it can fail, and marks the two differently', async ({ page }) => {
  await page.goto('/sectors/');
  const sectors = page.locator('section.sector');
  await expect(sectors).toHaveCount(4);
  for (let i = 0; i < 4; i += 1) {
    const sector = sectors.nth(i);
    await expect(sector.locator('.sector-label')).toHaveText(['What is expected', 'Where it can fail']);
    const lines = await sector.locator('.sector-cell').evaluateAll((els) => els.map((el) => getComputedStyle(el).borderTopStyle));
    expect(lines).toEqual(['solid', 'dashed']);
    expect(await sector.locator('.sector-regimes li').count()).toBeGreaterThan(1);
  }
  // The regimes are the page's own, split into tags; none is added.
  await expect(sectors.nth(0).locator('.sector-regimes li')).toHaveText(['PRA', 'FCA', 'SS1/23', 'SMCR']);
  await expect(sectors.nth(1).locator('.sector-regimes li')).toHaveText(['EU AI Act', 'Article 14']);
  await expect(sectors.nth(2).locator('.is-gap')).not.toContainText('AGDA');
});

test('about: sector tiers are marked by how firm they are, and the practice line ends at the finding', async ({ page, isMobile }) => {
  await page.goto('/about/');
  const tiers = await page.locator('.sector-group').evaluateAll((els) => els.map((el) => [el.querySelector('.col-label')!.textContent, getComputedStyle(el).borderTopStyle, getComputedStyle(el).borderTopWidth]));
  expect(tiers).toEqual([['Primary', 'solid', '2px'], ['By invitation', 'solid', '1px'], ['Not currently served', 'dashed', '1px']]);
  const last = page.locator('.not-list > li').last();
  await expect(last.locator('.h3')).toHaveText('Stops at the finding.');
  const closed = await last.evaluate((el) => [getComputedStyle(el).borderRightWidth, getComputedStyle(el).borderBottomWidth]);
  expect(closed).toEqual(isMobile ? ['0px', '2px'] : ['2px', '0px']);
});

test('sample report: a four-step reading path leads from the conclusion to its qualifications', async ({ page }) => {
  await page.goto('/sample-report/');
  const steps = page.locator('.read-path a');
  await expect(steps.locator('.rp-step')).toHaveText(['Conclusion', 'Findings', 'Evidence', 'Qualifications']);
  expect(await steps.evaluateAll((els) => els.map((el) => el.getAttribute('href')))).toEqual(['#conclusion', '#authority', '#register', '#limits']);
  for (const href of ['#conclusion', '#authority', '#register', '#limits']) await expect(page.locator(href)).toHaveCount(1);
  await steps.nth(3).click();
  await expect(page.locator('#limits h2')).toBeInViewport();
  // The cover keeps the sample's status above the path.
  await expect(page.locator('.cover .provenance-note')).toContainText('It has not been run as an assessment, is not issued and is not signed.');
});
