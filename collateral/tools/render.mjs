// Render a collateral source to PDF with Chromium: A4 from the source's CSS
// page size, backgrounds on, tagged, with an outline.
// Usage: BRAND_FONTS=<folder with Montserrat-*.ttf> node collateral/tools/render.mjs <in.html> <out.pdf>
//
// The sources link Montserrat from Google Fonts, which serves a variable font
// that Chromium embeds as Type 3. The render serves the brand kit's static
// TTFs instead, so the PDF carries CID TrueType fonts.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

const [, , input, output] = process.argv;
const fontDir = process.env.BRAND_FONTS;
if (!input || !output || !fontDir) {
  console.error('Usage: BRAND_FONTS=<dir> node collateral/tools/render.mjs <in.html> <out.pdf>');
  process.exit(1);
}
const weights = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };
for (const n of Object.values(weights)) {
  if (!existsSync(path.join(fontDir, `Montserrat-${n}.ttf`))) { console.error(`Missing Montserrat-${n}.ttf in ${fontDir}`); process.exit(1); }
}
const fontCss = Object.entries(weights).map(([w, n]) =>
  `@font-face{font-family:'Montserrat';font-style:normal;font-weight:${w};src:url('${pathToFileURL(path.join(fontDir, `Montserrat-${n}.ttf`)).href}') format('truetype');}`).join('\n');

const browser = await chromium.launch();
const page = await browser.newPage();
// Only a Montserrat-only request is replaced; any other family (the sample
// verdict also loads a monospace face) is fetched as the source asks.
await page.route('https://fonts.googleapis.com/**', (r) => {
  const families = new URL(r.request().url()).searchParams.getAll('family');
  return families.every((f) => f.startsWith('Montserrat')) ? r.fulfill({ contentType: 'text/css', body: fontCss }) : r.continue();
});
await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// Each source marks a page whose content overflows its A4 box.
const overflow = await page.evaluate(() => [...document.body.attributes].filter((a) => a.name.startsWith('data-overflow-')).map((a) => `${a.name}=${a.value}px`));
await page.pdf({ path: output, printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
await browser.close();
console.log(`${output}  overflow: ${overflow.join(' ') || 'none'}`);
if (overflow.length) process.exitCode = 2;
