/**
 * Renders an Open Graph card matching the twenty hand-made cards in
 * public/assets/og/.
 *
 * Those were produced by hand in June and there was no way to make a
 * twenty-first that matched. This reproduces the template: corner
 * brackets, wordmark, mono kicker, two or three headline lines with the
 * last one in accent, a mono meta row, and the hallmark bottom right.
 *
 * Usage:
 *   node scripts/generate-og-card.mjs <slug>
 *
 * Cards are defined in CARDS below rather than passed as arguments, so
 * the copy on a published card is reviewable in the repository.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CARDS = {
  'readiness-snapshot': {
    kicker: 'Readiness Snapshot',
    // Last line renders in accent, as on every other card.
    lines: ['Which part of stopping it', 'can you actually evidence?'],
    // Deliberately NOT the "deterministic · signed · independently
    // verifiable" row the AGDA cards carry. None of those three words is
    // true of the Snapshot, and the card is the one part of this page
    // that travels without the page's own disclaimers attached.
    meta: ['Ten questions', 'Self-reported', 'Not an assessment'],
  },
};

const html = (card) => `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --paper: #0a0a0a;
    --ink: #f0f0f0;
    --accent: #c9b694;
    --muted: #9a9a9a;
    --hair-strong: rgba(201, 182, 148, 0.3);
    --font-sans: 'Montserrat', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px;
    height: 630px;
    background: var(--paper);
    font-family: var(--font-sans);
    position: relative;
    overflow: hidden;
  }

  /* The lift across the upper left, present on every existing card. */
  .wash {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 90% at 22% 8%, rgba(255,255,255,0.028), transparent 66%),
      radial-gradient(90% 70% at 78% 96%, rgba(201,182,148,0.018), transparent 62%);
  }

  .bracket { position: absolute; width: 30px; height: 30px; }
  .bracket.tl { top: 50px; left: 50px; border-top: 1px solid var(--hair-strong); border-left: 1px solid var(--hair-strong); }
  .bracket.tr { top: 50px; right: 50px; border-top: 1px solid var(--hair-strong); border-right: 1px solid var(--hair-strong); }
  .bracket.bl { bottom: 50px; left: 50px; border-bottom: 1px solid var(--hair-strong); border-left: 1px solid var(--hair-strong); }
  .bracket.br { bottom: 50px; right: 50px; border-bottom: 1px solid var(--hair-strong); border-right: 1px solid var(--hair-strong); }

  .wordmark {
    position: absolute; top: 78px; left: 80px;
    font-size: 29px; font-weight: 600; letter-spacing: -0.015em; color: var(--ink);
  }

  .stack { position: absolute; left: 80px; top: 196px; right: 80px; }

  .kicker {
    display: flex; align-items: center; gap: 16px;
    font-family: var(--font-mono); font-size: 14px; font-weight: 400;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent);
  }
  .kicker::before { content: ''; width: 6px; height: 6px; background: var(--accent); }

  .headline {
    /* Held clear of the right-hand bracket at 80px + 30px. */
    margin-top: 26px; max-width: 1000px;
    font-size: 56px; font-weight: 800; line-height: 1.08;
    letter-spacing: -0.012em; text-transform: uppercase; color: var(--ink);
  }
  .headline .accent { color: var(--accent); }

  .meta {
    margin-top: 34px; display: flex; gap: 32px;
    font-family: var(--font-mono); font-size: 13px; font-weight: 400;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
  }
  .meta span { display: flex; align-items: center; gap: 11px; }
  .meta span::before { content: ''; width: 5px; height: 5px; background: var(--accent); }

  /* The hallmark, matching src/components/Hallmark.astro. It is a house
     mark and already sits in the footer of every page including this
     one, so the card carries it too. */
  .hallmark {
    position: absolute; right: 80px; bottom: 75px;
    display: inline-flex; align-items: stretch;
    border: 1px solid var(--hair-strong); background: var(--paper);
    font-family: var(--font-mono);
  }
  .hm-cell {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 7px 11px; border-right: 1px solid var(--hair-strong);
    font-size: 11px;
  }
  .hm-cell:last-child { border-right: 0; }
  .hm-word { letter-spacing: 0.14em; color: var(--ink); }
  .hm-tm { font-size: 7px; vertical-align: super; }
  .hm-serial { letter-spacing: 0.06em; color: var(--muted); text-transform: uppercase; }
  .seal { width: 12px; height: 12px; border: 1px solid var(--accent); position: relative; }
  .seal::after {
    content: ''; position: absolute; inset: 3px; background: var(--accent);
  }
</style>

<div class="wash"></div>
<div class="bracket tl"></div><div class="bracket tr"></div>
<div class="bracket bl"></div><div class="bracket br"></div>

<div class="wordmark">intervene</div>

<div class="stack">
  <div class="kicker">${card.kicker}</div>
  <div class="headline">${card.lines
    .map((l, i) =>
      i === card.lines.length - 1
        ? `<div class="accent">${l}</div>`
        : `<div>${l}</div>`,
    )
    .join('')}</div>
  <div class="meta">${card.meta.map((m) => `<span>${m}</span>`).join('')}</div>
</div>

<div class="hallmark">
  <span class="hm-cell hm-word">AGDA<span class="hm-tm">™</span></span>
  <span class="hm-cell hm-serial">Assay · 2026</span>
  <span class="hm-cell"><span class="seal"></span></span>
</div>
`;

const slug = process.argv[2];
const card = CARDS[slug];
if (!card) {
  console.error(
    `Unknown card "${slug}". Known: ${Object.keys(CARDS).join(', ')}`,
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html(card));
// The card is entirely type. A missing webfont would ship a card in
// Helvetica, so wait for the fonts rather than for the network.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const out = resolve(root, `public/assets/og/og-${slug}.png`);
await page.screenshot({ path: out });
await browser.close();

console.log(`og-${slug}.png written to public/assets/og/`);
