import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

// Text flow and content width, on every rendered page, at the seven
// acceptance widths, in both appearances. Standards: docs/design-standards.md.
// The static half of this guard is scripts/check-text-flow.mjs, which runs
// in CI; this half checks what the browser actually lays out.

// /method/ and the /r/ campaign links are forwarding stubs with no layout of their own.
const routes = readdirSync('dist', { recursive: true })
  .map(String)
  .filter((path) => path.endsWith('.html') && !path.startsWith('assets/') && path !== 'method/index.html' && !path.startsWith('r/'))
  .map((path) => path === 'index.html' ? '/' : `/${path.replace(/index\.html$/, '')}`);

const WIDTHS = [320, 390, 768, 1024, 1280, 1440, 1920];

// Justified exceptions, each recorded in docs/design-standards.md:
// - .wd-readout is the dial's key and is aligned to the dial face above it.
// - A two-tone heading sets its quieter clause on its own line (an em set to
//   display: block); the heading is as wide as its longest clause by design.
const EXEMPT = '.wd-readout, .wd-readout *';

for (const scheme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test(`text fills its layout at ${width}px in ${scheme} appearance`, async ({ page }, testInfo) => {
      // Widths are set explicitly, so one browser project covers them all.
      test.skip(testInfo.project.name !== 'desktop', 'viewport widths are set by the test');
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
      await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
      for (const route of routes) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate((exempt) => {
          const name = (el: Element) => `${el.tagName.toLowerCase()}${[...el.classList].map((c) => `.${c}`).join('')}`;
          const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          const overflowing = overflow > 0
            ? [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map(name).slice(0, 8)
            : [];

          // No balanced or "pretty" wrapping: text breaks where the column ends.
          const balanced = [...document.querySelectorAll('main *, footer *')]
            .filter((el) => /balance|pretty/.test(getComputedStyle(el).textWrap || ''))
            .map(name);

          // A text block with nothing beside it fills the width its parent
          // gives it, at every level up to the page frame. A multi-column
          // grid ends the climb: its columns are the layout's decision.
          const narrow: string[] = [];
          for (const el of document.querySelectorAll('main :is(p, h1, h2, h3, h4, blockquote, figcaption, .lede, .body)')) {
            const twoTone = [...el.querySelectorAll(':scope > :is(em, .em)')].some((e) => getComputedStyle(e).display === 'block');
            if (el.matches(exempt) || twoTone) continue;
            const box = el.getBoundingClientRect();
            const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
            if (!box.width || box.height < lineHeight * 1.6) continue; // single lines cannot wrap early
            let node: Element = el;
            let parent = el.parentElement;
            while (parent && parent.tagName !== 'MAIN') {
              const ps = getComputedStyle(parent);
              const cs = getComputedStyle(node);
              const nb = node.getBoundingClientRect();
              const tracks = ps.display.includes('grid') ? ps.gridTemplateColumns.split(' ').filter(Boolean).length : 1;
              const beside = [...parent.children].some((s) => {
                if (s === node || !s.getClientRects().length) return false;
                const sb = s.getBoundingClientRect();
                return sb.width > 0 && sb.bottom > nb.top + 2 && sb.top < nb.bottom - 2;
              });
              const rowLayout = ps.display.includes('flex') && !ps.flexDirection.startsWith('column');
              if (tracks > 1 || beside || rowLayout || /inline/.test(ps.display) || /inline/.test(cs.display) || cs.position === 'absolute' || cs.float !== 'none') break;
              const pr = parent.getBoundingClientRect();
              const inner = pr.width - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight) - parseFloat(ps.borderLeftWidth) - parseFloat(ps.borderRightWidth);
              const used = nb.width + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
              if (inner - used > 24) {
                narrow.push(`${name(el)} uses ${Math.round(used)} of ${Math.round(inner)}px in ${name(parent)}: "${el.textContent!.trim().slice(0, 40)}"`);
                break;
              }
              if (parent.matches('.wrap, .wrap-narrow, .wrap-reading')) break;
              node = parent;
              parent = parent.parentElement;
            }
          }
          return { overflow, overflowing, balanced, narrow };
        }, EXEMPT);
        expect(result.overflow, `${route}: horizontal overflow from ${result.overflowing.join(', ')}`).toBeLessThanOrEqual(0);
        expect(result.balanced, `${route}: balanced or pretty wrapping`).toEqual([]);
        expect(result.narrow, `${route}: text narrower than its layout`).toEqual([]);
      }
    });
  }
}
