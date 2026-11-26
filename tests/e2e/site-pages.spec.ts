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
  for (const route of ['/methodology/', '/sectors/', '/intervention-readiness/', '/glossary/', '/research/']) {
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

test('AGDA: one figure shows how a conclusion is reached, and draws no result', async ({ page }) => {
  await page.goto('/agda/');
  const model = page.locator('#model .assessment-model');
  await expect(model.locator('.am-k')).toHaveText(['Scope', 'Evidence', 'Intervention chain', 'Conclusion']);
  // The available time is set in scope and is what the chain is read against.
  await expect(model.locator('.am-list .am-time')).toHaveText('The available time');
  await expect(model.locator('.am-rail .am-node')).toHaveText(['Detect', 'Escalate', 'Decide', 'Intervene']);
  await expect(model.locator('.am-rail .am-edge')).toHaveText('Available time');
  await expect(model.locator('.am-thread')).toHaveText('The available time agreed in scope is what the chain is read against.');
  // All three states are listed; none is selected.
  await expect(model.locator('.am-states li')).toHaveText(['Before impact', 'At risk', 'After impact']);
  await expect(model.locator('[aria-current], [aria-selected="true"], .is-selected')).toHaveCount(0);
  await expect(model).toContainText("Issuance requires approval separate from the assessor's own judgement.");
  await expect(model.locator('figcaption')).toHaveText('The conclusion applies to the assessed conditions. It does not extend automatically to every pathway, future event or system in the organisation.');
  // Each part links to the section that carries it.
  for (const href of await model.locator('.am-k').evaluateAll((els) => els.map((el) => el.getAttribute('href')!))) await expect(page.locator(href)).toHaveCount(1);
  // The page still carries its verdict specimen and its boundaries.
  await expect(page.locator('#verdict .verdict-dials')).toHaveCount(1);
  // The page says what is assessed and established; how each stage is examined is set out once, on the methodology page.
  await expect(page.locator('.sedi-explorer')).toHaveCount(0);
  await expect(page.locator('#verdict a[href="/methodology/#chain"]')).toHaveCount(1);
  await expect(page.locator('main')).toContainText('AGDA® is not validated against real-world outcomes.');
});

test('methodology: four layers are kept apart, each linked to its detail, and marked as diagrams', async ({ page }) => {
  await page.goto('/methodology/');
  const layers = page.locator('#layers .method-layers');
  await expect(layers.locator('h3')).toHaveText(['Operational dependencies', 'Timing', 'Evidence', 'Judgement']);
  await expect(layers.locator('li').nth(1)).toContainText('The stages run against the available time, which is set in scope.');
  await expect(layers.locator('li').nth(2)).toContainText('Confidence cannot outrun the evidence.');
  await expect(layers.locator('li').nth(3)).toContainText('Repeatable engine computation supports the assessment. Intervene remains responsible for evidence interpretation and the final conclusion.');
  // The verdict states are not drawn a second time here: they are listed once on this page, under the chain.
  await expect(layers).not.toContainText('Before impact');
  await expect(page.locator('#chain .verdicts .verdict-name')).toHaveText(['Before impact', 'At risk', 'After impact']);
  // The page says how; what is assessed and established is the AGDA page's subject.
  await expect(page.locator('#layers a[href="/agda/#model"]')).toHaveCount(1);
  await expect(layers.locator('figcaption')).toHaveText('Diagrams of the method, not measurements. The underlying rubric and protected implementation remain Intervene IP.');
  const hrefs = await layers.locator('li > a').evaluateAll((els) => els.map((el) => el.getAttribute('href')!));
  expect(hrefs).toEqual(['#chain', '#scope', '#evidence', '#chain']);
  for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1);
  // The diagrams are decoration for a reader of the text: hidden from assistive technology.
  expect(await layers.locator('svg').evaluateAll((els) => els.every((el) => el.getAttribute('aria-hidden') === 'true'))).toBe(true);
  // The evidence kinds are drawn in the order the page's own ladder gives them.
  await expect(layers.locator('li').nth(2).locator('svg text')).toHaveText(['Policy', 'Drill', 'Production', 'Stress']);
  // The detailed sections remain.
  for (const id of ['#scope', '#chain', '#dimensions', '#evidence', '#ceiling', '#positions', '#records', '#basis']) await expect(page.locator(id)).toHaveCount(1);
});

for (const slug of ['vs-audit', 'vs-ai-governance', 'vs-compliance', 'vs-operational-resilience', 'vs-risk-management']) {
  test(`${slug}: the comparison is drawn as two sides of one spine and stays a table`, async ({ page, isMobile }) => {
    await page.goto(`/intervention-readiness/${slug}/`);
    const table = page.locator('table.split-ledger');
    // It is still a table to assistive technology: one header row, and a row header and two cells per row.
    await expect(table).toHaveRole('table');
    await expect(table.getByRole('columnheader')).toHaveCount(3);
    const rows = table.locator('tbody tr');
    expect(await rows.count()).toBe(5);
    await expect(table.getByRole('rowheader')).toHaveCount(5);
    await expect(table.getByRole('cell')).toHaveCount(10);
    if (!isMobile) {
      // The adjacent discipline sits left of the spine, the aspect on it, Intervention Readiness right of it.
      const order = await rows.first().evaluate((tr) => Array.from(tr.children).map((c) => Math.round(c.getBoundingClientRect().left)));
      expect(order[1]).toBeLessThan(order[0]);
      expect(order[0]).toBeLessThan(order[2]);
      // The two sides are weighted differently, and no claim is added: the cells are the page's own rows.
      const weights = await rows.first().locator('td').evaluateAll((els) => els.map((el) => getComputedStyle(el).fontWeight));
      expect(weights).toEqual(['400', '600']);
    } else {
      // On a phone each cell names its column, because the header row is not on screen.
      const labels = await rows.first().locator('td').evaluateAll((els) => els.map((el) => getComputedStyle(el, '::before').content));
      expect(labels[1]).toBe('"Intervention Readiness"');
      expect(labels[0]).not.toBe('none');
    }
  });
}

test('insights: the latest note leads, earlier notes follow in date order, and the list has one source', async ({ page }) => {
  await page.goto('/insights/');
  const lead = page.locator('.note-lead');
  await expect(lead).toHaveAttribute('href', '/insights/accountability-theatre/');
  await expect(lead.locator('.note-meta')).toHaveText('Latest · 28 May 2026');
  await expect(lead.locator('time')).toHaveAttribute('datetime', '2026-05-28');
  await expect(page.locator('.insights-list .insight-meta')).toHaveText(['14 May 2026', '30 April 2026']);
  expect(await page.locator('.insights-list a').evaluateAll((els) => els.map((el) => el.getAttribute('href')))).toEqual(['/insights/coincidence-is-not-a-margin/', '/insights/the-thirty-six-hour-window/']);
  // Headings descend in order: one h1, then h2s.
  await expect(page.locator('main h1')).toHaveCount(1);
  // Every note's own page carries the title and date the index gives it.
  for (const [slug, date] of [['accountability-theatre', '28 May 2026'], ['coincidence-is-not-a-margin', '14 May 2026'], ['the-thirty-six-hour-window', '30 April 2026']]) {
    await page.goto(`/insights/${slug}/`);
    await expect(page.locator('.insight-header time')).toHaveText(date);
    await expect(page.locator('.insight-header .meta')).toContainText(/\d+ minute read/);
  }
});

test('a note leads on to the notes either side of it, and adds no animation or diagram', async ({ page }) => {
  await page.goto('/insights/coincidence-is-not-a-margin/');
  const nav = page.locator('.note-nav');
  await expect(nav.locator('.note-nav-link')).toHaveCount(2);
  await expect(nav.locator('.note-nav-link').nth(0)).toHaveAttribute('href', '/insights/accountability-theatre/');
  await expect(nav.locator('.note-nav-link').nth(0)).toContainText('Later note · 28 May 2026');
  await expect(nav.locator('.note-nav-link').nth(1)).toHaveAttribute('href', '/insights/the-thirty-six-hour-window/');
  await expect(nav.locator('.note-nav-link').nth(1)).toContainText('Earlier note · 30 April 2026');
  await expect(nav.locator('.note-nav-all')).toHaveAttribute('href', '/insights/');
  // The newest note has only an earlier one; the oldest only a later one.
  await page.goto('/insights/accountability-theatre/');
  await expect(page.locator('.note-nav .note-nav-link')).toHaveCount(1);
  await expect(page.locator('.note-nav .note-nav-link')).toContainText('Earlier note');
  await page.goto('/insights/the-thirty-six-hour-window/');
  await expect(page.locator('.note-nav .note-nav-link')).toContainText('Later note');
  // Reading pages carry no figure, canvas, video or running animation.
  await expect(page.locator('article svg, article canvas, article video, article figure')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
  // Body text is set in the ink colour, at a readable measure.
  const prose = await page.locator('.prose > p').nth(1).evaluate((el) => ({ size: parseFloat(getComputedStyle(el).fontSize), chars: el.getBoundingClientRect().width / (parseFloat(getComputedStyle(el).fontSize) * 0.5) }));
  expect(prose.size).toBeGreaterThanOrEqual(18);
  expect(prose.chars).toBeLessThan(95);
});

test('the research page keeps research, framework and instrument apart and discloses no unpublished detail', async ({ page }) => {
  await page.goto('/research/');
  await expect(page.locator('main h1')).toHaveCount(1);
  const main = page.locator('main');
  for (const term of ['Intervention readiness', 'SEDI', 'AGDA®']) await expect(main.locator('.terms .h3', { hasText: term })).toHaveCount(1);
  await expect(main).toContainText('AGDA® is not validated against real-world outcomes');
  await expect(main).toContainText('subject to client consent, confidentiality and research integrity requirements');
  await expect(main.locator('a[href="/contact/?enquiry=research"]')).toHaveText('Research enquiries');
  await expect(main.locator('a[href="/agda/"]')).toHaveText('AGDA® assessments');
  const text = ((await page.locator('main').innerText()) + (await page.title()) + (await page.locator('meta[name="description"]').getAttribute('content'))).toLowerCase();
  for (const banned of ['illusion of control', 'risk analysis', 'wiley', 'risa-', 'ssrn', 'peer-review', 'peer review', 'submitted', 'michalska', 'yampolskiy', 'accepted for publication']) {
    expect(text, banned).not.toContain(banned);
  }
});

test('Research is reachable from the menu, the footer, the homepage and the methodology', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#takeover-menu a[href$="/research/"]')).toHaveText('Research');
  await expect(page.locator('footer a[href="/research/"]')).toHaveText('Research');
  await expect(page.locator('#home-research')).toHaveText('Research and empirical evaluation');
  await expect(page.locator('main a[href="/research/"]')).toHaveText(/Explore our research/);
  // The commercial close still follows the research section.
  await expect(page.locator('.research-block + .close [data-primary-cta="discuss_system"]')).toHaveCount(1);
  await page.goto('/methodology/');
  await expect(page.locator('#research-scope a[href="/research/"]')).toHaveCount(1);
  await expect(page.locator('#basis')).toContainText('is not validated against real-world outcomes');
});
