import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const directory = '.playwright/appearance-review';
const origin = process.env.APPEARANCE_ORIGIN ?? 'http://127.0.0.1:4399';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const captures = [];
for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, colorScheme: theme, reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
    const page = await context.newPage();
    for (const [name, route, selector] of [
      ['homepage', '/', null], ['agda', '/agda/', null],
      ['sample-verdict', '/sample-report/', null], ['enquiry', '/contact/', null],
      ['sedi', '/', '.intervention-window'], ['selector', '/', null],
      ['sample-verdict-cover', '/sample-report/', '.cover'],
      ['enquiry-form', '/contact/', 'form[data-contact]'],
      ['agda-hero', '/agda/', '.hero'],
    ]) {
      await page.goto(`${origin}${route}`);
      await page.evaluate(() => document.fonts.ready);
      if (name === 'selector') {
        await page.locator(width === 390 ? '[data-menu-trigger]' : '.appearance-header summary').click();
        await page.waitForTimeout(100);
      }
      const file = `${name}-${width}-${theme}.png`;
      if (selector) {
        // Component crops exclude the sticky navigation overlay. Complete
        // page and selector captures retain the production navigation.
        await page.locator('.site-header').evaluate(header => header.style.setProperty('position', 'relative', 'important'));
        await page.locator(selector).screenshot({ path: `${directory}/${file}` });
      }
      else await page.screenshot({ path: `${directory}/${file}`, fullPage: name !== 'selector' });
      captures.push({ name, width, theme, file });
    }
    await context.close();
  }
}
await browser.close();
const groups = [...new Set(captures.map(c => `${c.name}-${c.width}`))];
const html = `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Intervene appearance review</title>
<style>body{margin:32px;font:16px system-ui;background:#f4f4f2;color:#0a0a0a}section{margin:48px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0;min-width:0}img{width:100%;height:auto;border:1px solid #8c8c8c}figcaption{padding:12px 0}@media(max-width:720px){.pair{grid-template-columns:1fr}}</style>
<h1>Intervene appearance review</h1><p>Production build. Desktop and mobile views in Light and Dark. Select an image to inspect it at full size.</p>
${groups.map(group => `<section><h2>${group}</h2><div class="pair">${captures.filter(c => `${c.name}-${c.width}` === group).map(c => `<figure><figcaption>${c.theme === 'light' ? 'Light' : 'Dark'} · ${c.width}px</figcaption><a href="${c.file}"><img src="${c.file}" alt="${c.name}, ${c.theme}, ${c.width} pixels" loading="lazy"></a></figure>`).join('')}</div></section>`).join('')}</html>`;
await writeFile(`${directory}/review.html`, html);
console.log(`Captured ${captures.length} production screenshots in ${directory}/review.html`);
