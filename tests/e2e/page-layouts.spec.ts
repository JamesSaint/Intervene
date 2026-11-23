/**
 * The desktop compositions of the AGDA, Assessment options, Sample verdict,
 * Contact and Methodology pages. These check structure and the line breaks
 * that were chosen in the browser; they do not establish that a page looks
 * right, which is a visual judgement.
 */
import { test, expect, type Page } from '@playwright/test';
import { offers } from '../../src/lib/offers';

const DESKTOP = [[1440, 900], [1280, 800]] as const;

async function open(page: Page, route: string, size?: readonly [number, number]) {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  if (size) await page.setViewportSize({ width: size[0], height: size[1] });
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
}
/** The text of each rendered line of an element, top to bottom. */
const lines = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => {
  const range = document.createRange();
  const rows = new Map<number, string>();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = (node as Text).data;
    for (let i = 0; i < text.length; i += 1) {
      range.setStart(node, i); range.setEnd(node, i + 1);
      const box = range.getClientRects()[0];
      if (!box) continue;
      const key = Math.round(box.top / 4) * 4;
      rows.set(key, (rows.get(key) ?? '') + text[i]);
    }
  }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, t]) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
});
const left = async (page: Page, selector: string) => Math.round((await page.locator(selector).first().boundingBox())!.x);

test.describe('AGDA opening', () => {
  test('one wordmark, the heading and its sentence, with no detached label', async ({ page }) => {
    await open(page, '/agda/');
    const hero = page.locator('.product-hero');
    await expect(hero.locator('h1')).toHaveText('Assessing Intervention Readiness');
    // The wordmark appears once: the lockup. Not in the heading, not in the sentence.
    await expect(hero.locator('.product-identity img:visible')).toHaveCount(1);
    await expect(hero.locator('h1 [role="img"], .lede [role="img"]')).toHaveCount(0);
    await expect(hero.locator('.label')).toHaveCount(0);
    await expect(hero.locator('.lede')).toContainText('detect, escalate, decide and intervene');
    await expect(hero.locator('[data-primary-cta="discuss_system"]')).toHaveAttribute('href', '/contact/');
  });

  for (const size of [...DESKTOP, [1100, 800], [1024, 768]] as const) {
    test(`at ${size[0]} px the heading reads in phrases and shares a left edge with its sentence and actions`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'A desktop composition.');
      await open(page, '/agda/', size);
      const heading = await lines(page, '.product-hero h1');
      expect(['Assessing Intervention Readiness', 'Assessing|Intervention Readiness']).toContain(heading.join('|'));
      const edges = [await left(page, '.product-identity img:visible'), await left(page, '.product-hero h1'), await left(page, '.product-hero .lede'), await left(page, '.product-hero .hero-cta')];
      expect(new Set(edges).size, String(edges)).toBe(1);
      // The sentence follows the heading closely and keeps a reading width.
      const h1 = (await page.locator('.product-hero h1').boundingBox())!;
      const lede = (await page.locator('.product-hero .lede').boundingBox())!;
      expect(lede.y - (h1.y + h1.height)).toBeLessThanOrEqual(32);
      for (const line of await lines(page, '.product-hero .lede')) expect(line.length).toBeLessThanOrEqual(80);
    });
  }
});

test.describe('Assessment options opening', () => {
  test('the page opens on the comparison, under one heading', async ({ page }) => {
    await open(page, '/services/');
    await expect(page.locator('main h1')).toHaveText('Compare assessment options');
    await expect(page.locator('main')).not.toContainText('Where to begin.');
    await expect(page.locator('.oi-route')).toHaveCount(0);
    const items = page.locator('.options-hero .cmp-item');
    await expect(items).toHaveCount(offers.length);
    for (let i = 0; i < offers.length; i += 1) {
      await expect(items.nth(i).locator('.cmp-q')).toHaveText(offers[i].question);
      await expect(items.nth(i).locator('.cmp-price')).toHaveText(offers[i].price);
      await expect(items.nth(i).locator('.cmp-link')).toHaveAttribute('href', `/services/#${offers[i].slug}`);
      await expect(page.locator(`#${offers[i].slug}`)).toHaveCount(1);
      await expect(page.locator(`#${offers[i].slug} [data-enquire="${offers[i].slug}"]`)).toHaveAttribute('href', `/contact/?starting_point=${offers[i].slug}`);
    }
    await expect(page.locator('.options-hero .cmp-note')).toContainText('Only the full Assessment produces an');
  });

  for (const size of DESKTOP) {
    test(`at ${size[0]} by ${size[1]} the three options, their names and fees are in the first view and level`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'A desktop composition.');
      await open(page, '/services/', size);
      expect(await lines(page, 'main h1')).toEqual(['Compare assessment options']);
      for (const part of ['.cmp-name', '.cmp-price']) {
        const boxes = await page.locator(`.options-hero ${part}`).evaluateAll((els) => els.map((el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; }));
        expect(new Set(boxes.map((b) => b.top)).size, part).toBe(1);
        for (const b of boxes) expect(b.bottom, part).toBeLessThanOrEqual(size[1]);
      }
      // The questions are free to take different numbers of lines.
      const heights = await page.locator('.options-hero .cmp-q').evaluateAll((els) => els.map((el) => { const r = document.createRange(); r.selectNodeContents(el); return new Set([...r.getClientRects()].map((c) => Math.round(c.top))).size; }));
      expect(Math.max(...heights)).toBeGreaterThan(Math.min(...heights));
    });
  }

  test('following a comparison link lands on that engagement, clear of the header', async ({ page }) => {
    await open(page, '/services/', [1440, 900]);
    for (const o of offers) {
      await page.locator(`.options-hero .cmp-link[data-offer-select="${o.slug}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${o.slug}$`));
      await expect(page.locator(`#offer-${o.slug}-name`)).toBeInViewport();
    }
  });
});

test.describe('Sample verdict finding', () => {
  test('one finding leads the section, with its status and the comparison that explains it', async ({ page }) => {
    await open(page, '/sample-report/');
    const section = page.locator('#authority');
    await expect(section.locator('h2')).toHaveCount(1);
    await expect(section.locator('h2')).toHaveText('Detection works. Authority does not.');
    await expect(page.locator('main')).not.toContainText('The chain breaks');
    await expect(section.locator('.et-status')).toHaveText('Constructed illustration');
    await expect(section.locator('.et-flags')).toHaveText('Not issued · Not signed · No client data');
    const compare = section.locator('.et-compare > div');
    await expect(compare.nth(0)).toContainText('Assumed intervention window');
    await expect(compare.nth(0).locator('.et-compare-value')).toHaveText('About six hours');
    await expect(compare.nth(0)).toContainText('A scenario assumption, not a measurement.');
    await expect(compare.nth(1).locator('.et-compare-value')).toHaveText('At least seven days');
    await expect(compare.nth(1)).toContainText('Exceeds the window on its own');
    // The qualifications that were on the page are still on it.
    await expect(section).toContainText('not to scale and not added together');
    await expect(section).toContainText('May consume or exceed the window');
  });

  test('the status sits beside the finding and the trace follows within the same view', async ({ page, isMobile }) => {
    test.skip(isMobile, 'A desktop composition.');
    await open(page, '/sample-report/#authority', [1440, 900]);
    await page.waitForTimeout(400);
    const heading = (await page.locator('#authority h2').boundingBox())!;
    const status = (await page.locator('#authority .et-status').boundingBox())!;
    expect(Math.abs(status.x - heading.x)).toBeLessThanOrEqual(1);
    expect(heading.y - (status.y + status.height)).toBeLessThanOrEqual(24);
    const values = await page.locator('#authority .et-compare-value').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(values[0]).toBe(values[1]);
    await expect(page.locator('#authority h2')).toBeInViewport();
    await expect(page.locator('#authority .et-lenses')).toBeInViewport({ ratio: 0.5 });
    // Prose under the diagram keeps a reading column; the diagram is wider.
    const note = (await page.locator('#authority .callout-note').boundingBox())!;
    const map = (await page.locator('#authority .et-map').boundingBox())!;
    expect(note.width).toBeLessThan(map.width * 0.75);
  });

  test('the four questions still mark the trace, and reach uncertainty and limits', async ({ page }) => {
    await open(page, '/sample-report/');
    const trace = page.locator('#authority .evidence-trace');
    await expect(trace.locator('.et-lens')).toHaveCount(4);
    await trace.locator('[data-et-lens="open"]').click();
    await expect(trace.locator('[data-et-lens="open"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(trace.locator('[data-et-status]')).toContainText('Marked on the trace below');
    expect(await trace.locator('.is-marked').count()).toBeGreaterThan(0);
    await trace.locator('[data-et-lens="open"]').click();
    await expect(trace.locator('.is-marked')).toHaveCount(0);
    await expect(trace.locator('.et-foot')).toContainText('One pathway and one scenario.');
  });

  test('by keyboard: select a question, read the status after the questions, follow the link to the first mark', async ({ page }) => {
    await open(page, '/sample-report/');
    const trace = page.locator('#authority .evidence-trace');
    const status = trace.locator('[data-et-status]');
    const jump = trace.locator('[data-et-jump]');
    // Initial state: no status, no link.
    await expect(status).toHaveText('');
    await expect(jump).toBeHidden();
    await trace.locator('[data-et-lens="why"]').focus();
    await page.keyboard.press('Enter');
    await expect(trace.locator('[data-et-lens="why"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(status).toHaveText('Marked on the trace below: 1 stage, the conclusion.');
    // The status and the link sit beneath the four questions, and the link is the next stop.
    const lenses = (await trace.locator('.et-lenses').boundingBox())!;
    const foot = (await trace.locator('.et-lens-foot').boundingBox())!;
    const map = (await trace.locator('.et-map').boundingBox())!;
    expect(foot.y).toBeGreaterThanOrEqual(lenses.y + lenses.height);
    expect(foot.y + foot.height).toBeLessThanOrEqual(map.y + 1);
    await page.keyboard.press('Tab');
    await expect(jump).toBeFocused();
    await expect(jump).toHaveText(/Show the first on the trace/);
    await page.keyboard.press('Enter');
    const first = await trace.locator('.is-marked').evaluateAll((els) => els.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0].className);
    expect(first).toMatch(/is-marked/);
    await expect.poll(() => trace.locator('.is-marked').evaluateAll((els) => { const top = Math.min(...els.map((el) => el.getBoundingClientRect().top)); return top >= 0 && top < innerHeight; })).toBe(true);
    // Pressing the question again clears it.
    await trace.locator('[data-et-lens="why"]').focus();
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('');
    await expect(jump).toBeHidden();
  });

  test('pressing a question does not move the trace', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Measured at one desktop size.');
    await open(page, '/sample-report/', [1440, 900]);
    const top = () => page.locator('#authority .et-map').evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));
    const before = await top();
    await page.locator('#authority [data-et-lens="why"]').click();
    expect(await top()).toBe(before);
  });
});

test.describe('Contact', () => {
  test('the form is the page: one heading, the terms of the first conversation, then the fields', async ({ page }) => {
    await open(page, '/contact/');
    await expect(page.locator('main h1')).toHaveText('Discuss your system.');
    await expect(page.locator('main')).not.toContainText('Tell us what may need to be stopped');
    await expect(page.locator('main h2')).toHaveText(['How we handle your enquiry']);
    const intro = (await page.locator('.form-intro').boundingBox())!;
    const name = (await page.locator('#f-name').boundingBox())!;
    expect(name.y - (intro.y + intro.height)).toBeLessThanOrEqual(120);
    // The instruction to describe the system is given once, beside the message field.
    const main = await page.locator('main').innerText();
    expect(main.match(/the system, the decision/gi)).toHaveLength(2); // the conversation, and the field help
    expect(main).not.toMatch(/Name the system|Include the system|keep a first message/);
    await expect(page.locator('#f-msg-help')).toContainText('Leave out sensitive details.');
    await expect(page.locator('.info-list')).toContainText('Confidentiality');
    await expect(page.locator('.info-list a[href^="mailto:"]')).toBeVisible();
    await expect(page.locator('.submit-row a[href="/legal/privacy/"]')).toBeVisible();
  });

  test('the sidebar heading is a step below the page heading', async ({ page, isMobile }) => {
    test.skip(isMobile, 'A desktop composition.');
    await open(page, '/contact/', [1440, 900]);
    const size = (sel: string) => page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(await size('.info-heading')).toBeLessThan((await size('main h1')) / 2);
    await expect(page.locator('#f-name')).toBeInViewport();
    await expect(page.locator('#f-email')).toBeInViewport();
  });
});

test.describe('Methodology', () => {
  for (const size of [...DESKTOP, [1100, 800]] as const) {
    test(`at ${size[0]} px the emphasised phrase reads together on its own line`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'A desktop composition.');
      await open(page, '/methodology/', size);
      await expect(page.locator('.hero h1')).toHaveText('Follow the response from signal to effective intervention.');
      await expect(page.locator('.hero h1 em')).toHaveText('effective intervention.');
      expect((await lines(page, '.hero h1')).at(-1)).toBe('effective intervention.');
    });
  }

  for (const size of DESKTOP) {
    test(`at ${size[0]} px section introductions keep a reading width and diagrams keep the page width`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'A desktop composition.');
      await open(page, '/methodology/', size);
      const counts = await page.locator('main .block > .wrap > .h2 + .lede').evaluateAll((els) => els.map((el) => {
        const range = document.createRange();
        const rows = new Map<number, number>();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = (node as Text).data.replace(/\s+/g, ' ');
          for (let i = 0; i < (node as Text).length; i += 1) {
            range.setStart(node, i); range.setEnd(node, i + 1);
            const box = range.getClientRects()[0];
            if (box && box.width) rows.set(Math.round(box.top / 4) * 4, (rows.get(Math.round(box.top / 4) * 4) ?? 0) + 1);
          }
          void text;
        }
        return Math.max(...rows.values());
      }));
      expect(counts.length).toBeGreaterThan(4);
      for (const longest of counts) expect(longest).toBeLessThanOrEqual(82);
      // The diagram labels are apart: none runs into its neighbour.
      const labels = await page.locator('#layers li:nth-child(4) svg text').evaluateAll((els) => els.map((el) => { const b = el.getBoundingClientRect(); return [b.left, b.right]; }).sort((a, b) => a[0] - b[0]));
      for (let i = 1; i < labels.length; i += 1) expect(labels[i][0] - labels[i - 1][1], 'gap between Judgement labels').toBeGreaterThanOrEqual(4);
      const wrap = (await page.locator('#layers > .wrap').boundingBox())!;
      const layers = (await page.locator('#layers .lede + *').boundingBox())!;
      expect(layers.width).toBeGreaterThan(wrap.width * 0.9);
    });
  }
});

test.describe('Sample Authority Check finding', () => {
  test('is marked as constructed, separates what is documented from what is concluded, and reports no call-out', async ({ page }) => {
    await open(page, '/sample-authority-check/');
    await expect(page.locator('main h1')).toHaveText('Retail credit: intervention authority is not demonstrably established.');
    await expect(page.locator('.finding-status .status')).toHaveText('Constructed illustration');
    await expect(page.locator('.finding-status .flags')).toContainText('Not issued · No client data · Not an');
    await expect(page.locator('#finding-heading')).toHaveText('Can anyone stop this system?');
    await expect(page.locator('.answers dt')).toHaveText([
      'Who may halt it, and under which delegation',
      'Whether they can decide alone or need a quorum',
      'How they are reached out of hours',
      'Where the halt takes effect',
    ]);
    // Each answer names the record or control it rests on.
    for (const basis of await page.locator('.answers .basis').allInnerTexts()) expect(basis).toMatch(/[CE]-\d\d/);
    // Documented evidence, missing evidence and the conclusion are labelled apart in every answer.
    for (const dd of await page.locator('.answers dd').all()) {
      await expect(dd.locator('.basis-k')).toHaveText(['Documented', 'Not evidenced', 'Conclusion', 'Basis']);
    }
    // Out-of-hours reach is stated from the scenario. No call-out result is invented.
    const reach = page.locator('.call-out');
    await expect(reach).toContainText('The scenario identifies no documented on-call rota or reliable weekend escalation arrangement.');
    await expect(reach).toContainText('The available evidence does not establish that an authorised individual could be reached and an intervention executed outside normal operating hours.');
    await expect(reach).toContainText('contains no call-out and reports no result from one');
    expect(await page.locator('main').innerText()).not.toMatch(/Saturday|two hours|was reached|were reached/i);
    await expect(page.locator('.finding-limits')).toContainText('no real organisation');
    await expect(page.locator('.finding-limits')).toContainText('prepared without independent review');
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/Before impact|At risk|After impact|\bscore of\b|signed by/i);
    // One h1, sequential headings.
    const levels = await page.locator('main h1, main h2, main h3').evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    for (let i = 1; i < levels.length; i += 1) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });

  test('is reached from the Authority Check sheet and leads to an enquiry with that option selected', async ({ page }) => {
    await open(page, '/services/');
    await page.locator('#check .sheet-sample').click();
    await expect(page).toHaveURL(/\/sample-authority-check\/$/);
    await page.locator('main [data-enquire="check"]').click();
    await expect(page).toHaveURL(/\/contact\/\?starting_point=check$/);
    await expect(page.locator('input[name="starting_point"]:checked')).toHaveValue('check');
  });

  test('does not overflow at phone or desktop widths', async ({ page }) => {
    await open(page, '/sample-authority-check/');
    for (const width of [320, 390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${width}px` }).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('Reasons to act and to believe', () => {
  test('Assessment options names the moments to ask the question, and both decision points name the founder', async ({ page }) => {
    await open(page, '/services/');
    await expect(page.locator('#when h2')).toHaveText('When to ask the question.');
    await expect(page.locator('#when .lede')).toHaveText('Four illustrative circumstances in which an assessment may be appropriate.');
    await expect(page.locator('#when .moments > li')).toHaveCount(4);
    await expect(page.locator('.page-nav a[href="#when"]')).toHaveCount(1);
    const line = 'Intervene was founded by James Saint, after three decades across technology, systems architecture, digital products, payments and organisational risk.';
    await expect(page.locator('.founder-line')).toContainText(line);
    await expect(page.locator('.founder-line a[href="/about/"]')).toBeVisible();
    await open(page, '/contact/');
    await expect(page.locator('.info-col')).toContainText(line);
    await expect(page.locator('.info-col a[href="/about/"]')).toBeVisible();
  });
});
