/**
 * Renders the Open Graph cards in public/assets/og/ using the approved
 * Intervene wordmark from Logo.astro.
 *
 * The card is set as the site's hero is set (typography.css, tokens.css):
 * the light appearance on the hero's deep paper, one gold label, a
 * sentence-case Montserrat 600 headline at the heading tracking, and an
 * IBM Plex Mono note row on a hairline. No ornament: no brackets, wash,
 * hallmark or gold headline line. Fonts are bundled in
 * public/assets/fonts/ so generation works offline.
 *
 * Usage:
 *   node scripts/generate-og-card.mjs <slug>
 *   node scripts/generate-og-card.mjs all
 *
 * Cards are defined in CARDS below rather than passed as arguments, so
 * the copy on a published card is reviewable in the repository.
 */

import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/* AGDA® in card copy: the ® set as the site sets it (lib/marks.ts). */
const markAgda = (v) => v.replace(/AGDA®/g, 'AGDA<span class="agda-reg">®</span>');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Reuse the site's approved artwork, including its currentColor fill.
// Fail if the component changes rather than silently reverting to typed text.
const logoSource = readFileSync(resolve(root, 'src/components/Logo.astro'), 'utf8');
const wordmark = logoSource.match(/<svg class="intervene-wordmark"[\s\S]*?<\/svg>/)?.[0];
if (!wordmark) throw new Error('Approved Intervene wordmark not found in Logo.astro.');

/* The four SEDI stages: descriptive, not a claim. The previous
   "deterministic · signed · independently verifiable" row asserted that
   every assessment is signed and that judgement plays no part, which the
   14 September 2026 commercial strategy does not support. Signed SEDI
   result records are supplied where the agreed scope includes them; the
   card cannot carry that condition, so it carries no claim. */
const SEDI = ['Detect', 'Escalate', 'Decide', 'Intervene'];

const CARDS = {
  home: {
    kicker: 'Intervention Readiness',
    lines: ['If an AI system fails,', 'can you stop it', 'before harm is irreversible?'],
    meta: SEDI,
  },
  about: {
    kicker: 'Why it matters',
    lines: ['Oversight only matters', 'if intervention', 'remains possible.'],
    meta: SEDI,
  },
  agda: {
    kicker: 'The assessment',
    lines: ['AGDA® assesses', 'Intervention Readiness.'],
    meta: SEDI,
  },
  'category-map': {
    kicker: 'Category map',
    lines: ['Every component of', 'Intervention Readiness.'],
    meta: SEDI,
  },
  contact: {
    kicker: 'Book a conversation',
    lines: ['Can you stop it', 'in time?'],
    meta: SEDI,
  },
  'halt-authority': {
    kicker: 'Component',
    lines: ['Authority to stop it,', 'held by someone', 'who can act in time.'],
    meta: SEDI,
  },
  'human-oversight': {
    kicker: 'Component',
    lines: ['Informed, authorised,', 'and able to act', 'before the window closes.'],
    meta: SEDI,
  },
  insights: {
    kicker: 'Evidence notes',
    lines: ['Where accountability', 'fails to evidence', 'intervention.'],
    meta: SEDI,
  },
  'intervention-chain': {
    kicker: 'Component',
    lines: ['The chain is only', 'as strong as its', 'weakest stage.'],
    meta: SEDI,
  },
  'intervention-readiness': {
    kicker: 'The category',
    lines: ['Detect, escalate,', 'decide, intervene.', 'Before harm is irreversible.'],
    meta: SEDI,
  },
  methodology: {
    kicker: 'How AGDA® works',
    lines: ['Follow the response', 'from signal to', 'effective intervention.'],
    meta: SEDI,
  },
  'reversibility-window': {
    kicker: 'Component',
    lines: ['From deviation to', 'the point of', 'no return.'],
    meta: SEDI,
  },
  'sample-report': {
    kicker: 'Sample verdict',
    lines: ['The shape of a finding.', 'Constructed. Not signed.'],
    meta: SEDI,
  },
  sectors: {
    kicker: 'Where it matters',
    lines: ['When systems move faster', 'than authority can.'],
    meta: SEDI,
  },
  services: {
    kicker: 'Assessment options',
    lines: ['Two ways to begin.', 'One named system.'],
    meta: SEDI,
  },
  'vs-ai-governance': {
    kicker: 'Comparison',
    lines: ['Governance assigns', 'responsibility.', 'Readiness proves action.'],
    meta: SEDI,
  },
  'vs-audit': {
    kicker: 'Comparison',
    lines: ['Audit looks back.', 'Readiness looks forward.'],
    meta: SEDI,
  },
  'vs-compliance': {
    kicker: 'Comparison',
    lines: ['Compliance confirms', 'obligations.', 'Readiness proves capability.'],
    meta: SEDI,
  },
  'vs-operational-resilience': {
    kicker: 'Comparison',
    lines: ['Resilience absorbs', 'the shock.', 'Readiness intervenes.'],
    meta: SEDI,
  },
  'vs-risk-management': {
    kicker: 'Comparison',
    lines: ['Risk scores', 'likelihood.', 'Readiness completes in time.'],
    meta: SEDI,
  },
  network: {
    kicker: 'Intervention Readiness Network',
    lines: ['Who should be asked', 'whether they could stop it?'],
    // No commercial word anywhere. The card travels without the page's
    // sixth section attached, and a card reading like a referral offer
    // would be the first thing anyone saw.
    meta: ['One question', 'One link', 'No fee to take part'],
  },
  'readiness-snapshot': {
    kicker: 'Readiness Snapshot',
    lines: ['Which part of stopping it', 'can you actually evidence?'],
    // Deliberately NOT the "deterministic · signed · independently
    // verifiable" row the AGDA cards carry. None of those three words is
    // true of the Snapshot, and the card is the one part of this page
    // that travels without the page's own disclaimers attached.
    meta: ['Ten questions', 'Self-reported', 'Not an assessment'],
  },
};

const fontFace = (family, weight, filename) => {
  const data = readFileSync(resolve(root, 'public/assets/fonts', filename)).toString('base64');
  return `@font-face {
    font-family: '${family}'; font-style: normal; font-weight: ${weight};
    src: url('data:font/woff2;base64,${data}') format('woff2');
  }`;
};
const fonts = [
  fontFace('Montserrat', 600, 'montserrat-semibold.woff2'),
  fontFace('IBM Plex Mono', 400, 'ibm-plex-mono-regular.woff2'),
].join('\n');

const productWordmark = `data:image/svg+xml;base64,${readFileSync(resolve(root, 'public/assets/brand/agda-by-intervene-stacked-ink.svg')).toString('base64')}`;
const productCards = new Set(['agda', 'methodology', 'sample-report']);
const html = (card, slug) => `
<style>
  ${fonts}

  /* Light appearance values from tokens.css. */
  :root {
    --paper-deep: #f4f4f2;
    --ink: #1a1a1a;
    --faint: #6b6b6b;
    --hair: #e0e0e0;
    --accent: #c9b694;
    --accent-text: #7a6c55;
    --font-sans: 'Montserrat', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px;
    height: 630px;
    background: var(--paper-deep);
    color: var(--ink);
    font-family: var(--font-sans);
    position: relative;
    overflow: hidden;
  }

  .wordmark { position: absolute; top: 72px; left: 88px; color: var(--ink); }
  .intervene-wordmark {
    display: block; height: 26px; width: auto; aspect-ratio: 9196 / 1027.7;
  }
  .wordmark.product { top: 64px; }
  .product-wordmark { display: block; height: 72px; width: auto; }

  .stack { position: absolute; left: 88px; right: 88px; top: 200px; }

  .kicker {
    font-size: 15px; font-weight: 600; line-height: 1.5;
    letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap;
    color: var(--accent-text);
  }

  .headline {
    margin-top: 20px;
    font-size: 68px; font-weight: 600; line-height: 1.06;
    letter-spacing: -0.025em; color: var(--ink);
  }
  .headline > div { white-space: nowrap; }

  .foot {
    position: absolute; left: 88px; right: 88px; bottom: 64px;
    display: flex; justify-content: space-between; align-items: baseline; gap: 32px;
    border-top: 1px solid var(--hair); padding-top: 20px;
    font-family: var(--font-mono); font-size: 16px; font-weight: 400;
    line-height: 1.5; letter-spacing: 0; color: var(--faint); white-space: nowrap;
  }
  .meta span + span::before { content: '·'; margin: 0 14px; }

  /* The ® as the site sets it: .agda-reg in global.css. */
  .agda-reg {
    color: var(--accent); display: inline-block; font-size: 0.24em;
    letter-spacing: 0; line-height: 1; margin-left: 0.06em; vertical-align: top;
  }
  .kicker .agda-reg { font-size: 0.6em; }
</style>

<div class="wordmark${productCards.has(slug) ? ' product' : ''}">${productCards.has(slug) ? `<img class="product-wordmark" src="${productWordmark}" alt="AGDA® by Intervene">` : wordmark}</div>

<div class="stack">
  <div class="kicker">${markAgda(card.kicker)}</div>
  <div class="headline">${card.lines.map((l) => `<div>${markAgda(l)}</div>`).join('')}</div>
</div>

<div class="foot">
  <div class="meta">${card.meta.map((m) => `<span>${m}</span>`).join('')}</div>
  <div>intervene.uk</div>
</div>
`;

const arg = process.argv[2];
const slugs = arg === 'all' ? Object.keys(CARDS) : [arg];
for (const slug of slugs) {
  if (!CARDS[slug]) {
    console.error(
      `Unknown card "${slug}". Known: all, ${Object.keys(CARDS).join(', ')}`,
    );
    process.exit(1);
  }
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  // All assets are embedded. Reject network requests to keep rendering offline.
  await page.route('**/*', (route) => route.abort());
  for (const slug of slugs) {
    await page.setContent(html(CARDS[slug], slug));
    // Wait for the bundled fonts and fail if either cannot be decoded.
    // document.fonts.ready alone also resolves after failed font downloads.
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const font of ['600 68px Montserrat', '400 16px "IBM Plex Mono"']) {
        const loaded = await document.fonts.load(font);
        if (!loaded.length || loaded.some((face) => face.status !== 'loaded')) {
          throw new Error(`Required Open Graph font did not load: ${font}`);
        }
      }
    });
    // Keep the authored line breaks and fit tracked headlines to their box.
    // Check every card before saving so a future copy change cannot be clipped.
    const size = await page.evaluate(() => {
      const headline = document.querySelector('.headline');
      const width = headline.getBoundingClientRect().width;
      const lines = [...headline.children];
      const textWidth = (element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect().width;
      };
      let size = 68;
      while (lines.some((line) => textWidth(line) > width) && size > 52) {
        headline.style.fontSize = `${--size}px`;
      }
      if (lines.some((line) => textWidth(line) > width)) {
        throw new Error('Headline exceeds its box at the minimum 52px size.');
      }
      const kicker = document.querySelector('.kicker');
      if (kicker.scrollWidth > kicker.clientWidth) throw new Error('Kicker overflows.');
      const foot = document.querySelector('.foot');
      if (foot.scrollWidth > foot.clientWidth) throw new Error('Note row overflows.');
      if (headline.getBoundingClientRect().bottom > foot.getBoundingClientRect().top - 40) {
        throw new Error('Headline exceeds the vertical space above the note row.');
      }
      return size;
    });
    await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    const out = resolve(root, `public/assets/og/og-${slug}.png`);
    await page.screenshot({ path: out });
    console.log(`og-${slug}.png written to public/assets/og/ (headline ${size}px)`);
  }
} finally {
  await browser.close();
}
