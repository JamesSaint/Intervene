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
