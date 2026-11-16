/**
 * The inline AGDA® name: AGDA in the surrounding typography, with only the ®
 * wrapped and set by one shared rule (.agda-reg in global.css) at 0.4em,
 * raised 1.3em, line-height 0. Checked as rendered: in a large heading, body
 * copy, a footer link and the open menu, in both themes, on the desktop and
 * mobile projects.
 */
import { test, expect, type Page } from '@playwright/test';

const HEADING = 'What a full AGDA® Assessment delivers.';

/** Measures every .agda-reg inside the scope against the element that holds it. */
async function measure(page: Page, scope: string) {
  return page.locator(scope).evaluateAll((roots) => roots.flatMap((root) => [...root.querySelectorAll('.agda-reg')].map((reg) => {
    const parent = reg.parentElement!;
    const own = getComputedStyle(reg);
    const around = getComputedStyle(parent);
    const before = reg.previousSibling;
    const letters = before?.nodeType === Node.TEXT_NODE ? before.textContent! : '';
    // The final A, as drawn.
    const range = document.createRange();
    if (letters) { range.setStart(before!, letters.length - 1); range.setEnd(before!, letters.length); }
    const a = range.getBoundingClientRect();
    const mark = reg.getBoundingClientRect();
    const size = parseFloat(around.fontSize);
    return {
      text: reg.textContent,
      precededBy: letters.slice(-4),
      children: reg.children.length,
      attributes: reg.getAttributeNames(),
      sizeRatio: parseFloat(own.fontSize) / size,
      liftRatio: parseFloat(own.verticalAlign) / size,
      lineHeight: own.lineHeight,
      sameColour: own.color === around.color,
      sameFamily: own.fontFamily === around.fontFamily,
      sameWeight: own.fontWeight === around.fontWeight,
      sameStyle: own.fontStyle === around.fontStyle,
      // Attached: part of the same run of text, starting where the A ends, on the A's line and above its middle.
      inline: own.display === 'inline' && !/flex|grid/.test(around.display),
      gap: (mark.left - a.right) / size,
      onTheLine: mark.bottom > a.top && mark.top < a.bottom,
      raised: (mark.top + mark.bottom) / 2 < (a.top + a.bottom) / 2,
    };
  })));
}

function expectSelectedTreatment(marks: Awaited<ReturnType<typeof measure>>, where: string) {
  expect(marks.length, where).toBeGreaterThan(0);
  for (const mark of marks) {
    expect(mark.text, where).toBe('®');
    expect(mark.precededBy, where).toBe('AGDA');
    expect(mark.children, where).toBe(0);
    expect(mark.attributes, where).toEqual(['class']);
    expect(mark.sizeRatio, where).toBeCloseTo(0.4, 2);
    expect(mark.liftRatio, where).toBeCloseTo(0.52, 2);
    expect(mark.lineHeight, where).toBe('0px');
    expect(mark.sameColour, where).toBe(true);
    expect(mark.sameFamily, where).toBe(true);
    expect(mark.sameWeight, where).toBe(true);
    expect(mark.sameStyle, where).toBe(true);
    expect(mark.inline, where).toBe(true);
    expect(Math.abs(mark.gap), where).toBeLessThan(0.08);
    expect(mark.onTheLine, where).toBe(true);
    expect(mark.raised, where).toBe(true);
  }
}

/** Heights of the scope's elements, with the mark raised and with it left on the baseline. */
async function heights(page: Page, scope: string) {
  return page.evaluate((selector) => {
    const read = () => [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect().height);
    const raised = read();
    const style = document.head.appendChild(document.createElement('style'));
    // Same width, so nothing rewraps: only the lift is taken away.
    style.textContent = '.agda-reg { vertical-align: baseline !important; }';
    const level = read();
    style.remove();
    return { raised, level, page: document.documentElement.scrollHeight };
  }, scope);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`the registered mark on inline AGDA® (${scheme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
    });

    test('in a large heading, body copy and the footer', async ({ page }) => {
      await page.goto('/agda/');
      await page.evaluate(() => document.fonts.ready);
      const heading = page.locator('h2', { hasText: 'What a full' });
      await expect(heading).toHaveText(HEADING);
      await heading.evaluate((el) => el.classList.add('agda-check-heading'));

      for (const scope of ['.agda-check-heading', 'main p', 'main li', 'footer a', 'footer span']) {
        expectSelectedTreatment(await measure(page, scope), `${scope} (${scheme})`);
        const spacing = await heights(page, scope);
        expect(spacing.raised, `${scope} line spacing`).toEqual(spacing.level);
      }

      // It copies as the plain name: the selection and the text are AGDA®, with nothing between the A and the ®.
      const selected = await heading.evaluate((el) => {
        const selection = getSelection()!;
        selection.selectAllChildren(el);
        return selection.toString();
      });
      expect(selected.replace(/\s+/g, ' ').trim()).toBe(HEADING);
      await expect(page.locator('footer a[href="/agda/"]').first()).toHaveText('AGDA®');
      expect(await page.locator('footer a[href="/agda/"]').first().evaluate((el) => (el as HTMLElement).innerText)).toBe('AGDA®');
      // The trade mark notice keeps its own wording, without the mark.
      const notice = page.locator('.trade-mark-notice');
      await expect(notice).toHaveText('AGDA is a registered trade mark of Intervene Limited in the United Kingdom (UK00004416503).');
      await expect(notice.locator('.agda-reg')).toHaveCount(0);
    });

    test('in the open menu', async ({ page }) => {
      await page.goto('/services/');
      await page.evaluate(() => document.fonts.ready);
      await page.locator('[data-menu-trigger]').click();
      await expect(page.locator('[data-takeover]')).toHaveClass(/\bopen\b/);
      await page.waitForTimeout(900);
      expectSelectedTreatment(await measure(page, '.takeover-body a'), `menu (${scheme})`);
      const links = page.locator('.takeover-body a');
      expect(await links.evaluateAll((all) => all.map((link) => (link as HTMLElement).innerText).filter((text) => text.includes('AGDA')))).toEqual(['AGDA®', 'How AGDA® works']);
      // A link with the mark is exactly as tall as one without.
      const tall = await links.evaluateAll((all) => all.map((link) => link.getBoundingClientRect().height));
      expect(new Set(tall.map((height) => Math.round(height * 10))).size).toBe(1);
    });
  });
}

test('every inline AGDA® on the site carries the wrapped mark, and nothing else does', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'markup is the same on every project');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  const paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((match) => match[1]);
  expect(paths.length).toBeGreaterThan(20);
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  let marks = 0;
  for (const path of paths) {
    await page.goto(path);
    const found = await page.evaluate(() => {
      const unwrapped: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement!;
        // Scripts, styles and the plain-text email signature cannot hold markup.
        if (parent.closest('script, style, noscript, textarea, pre, template')) continue;
        if (/AGDA\s*®/.test(node.textContent!)) unwrapped.push(node.textContent!.trim().slice(0, 80));
      }
      const regs = [...document.querySelectorAll('.agda-reg')];
      return {
        unwrapped,
        marks: regs.length,
        detached: regs.filter((reg) => !(reg.previousSibling?.nodeType === Node.TEXT_NODE && reg.previousSibling.textContent!.endsWith('AGDA'))).length,
        // In a flex or grid container the ® would become an item of its own and come away from the A:
        // there, the label is wrapped in a plain span so the name stays one run of text.
        split: regs.filter((reg) => getComputedStyle(reg).display !== 'inline' || /AGDA\s+®/.test((reg.parentElement as HTMLElement).innerText)).length,
        // The mark is never drawn in an attribute or the document title.
        leaked: document.title.includes('agda-reg') || !!document.querySelector('[aria-label*="agda-reg"], [title*="agda-reg"], [alt*="agda-reg"], meta[content*="agda-reg"]'),
      };
    });
    expect(found.unwrapped, path).toEqual([]);
    expect(found.detached, path).toBe(0);
    expect(found.split, path).toBe(0);
    expect(found.leaked, path).toBe(false);
    marks += found.marks;
  }
  expect(marks).toBeGreaterThan(200);
});
