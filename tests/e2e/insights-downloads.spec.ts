/**
 * The papers on /insights/ and the short campaign links that lead to them.
 * Every card must open its own PDF, and every /r/<slug> link must resolve,
 * with or without a trailing slash, carrying its query string across.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { downloadGroups, downloadHref } from '../../src/lib/insight-downloads';
import { campaignLinks } from '../../src/lib/campaign-links';

const downloads = downloadGroups.flatMap((group) => group.items);
const pdfInfo = (body: Buffer) => {
  const text = body.toString('latin1');
  return {
    signature: text.slice(0, 5),
    closed: text.trimEnd().endsWith('%%EOF'),
    pages: (text.match(/\/Type\s*\/Page\b/g) ?? []).length,
  };
};

test('each paper on Insights links to its own PDF, and the PDF is served intact', async ({ page, request }) => {
  await page.goto('/insights/');
  await expect(page.locator('.paper')).toHaveCount(downloads.length);
  expect(new Set(downloads.map((d) => d.id)).size).toBe(downloads.length);
  expect(new Set(downloads.map((d) => d.file)).size).toBe(downloads.length);
  for (const d of downloads) {
    const card = page.locator(`#${d.id}`);
    await expect(card.locator('.paper-title')).toHaveText(d.title);
    const link = card.locator('a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', downloadHref(d));
    await expect(link).toHaveAttribute('aria-label', `Download PDF: ${d.title}`);
    await expect(card.locator('.paper-pages')).toHaveText(`${d.pages} ${d.pages === 1 ? 'page' : 'pages'}`);

    const response = await request.get(downloadHref(d));
    expect(response.status(), d.file).toBe(200);
    expect(response.headers()['content-type'], d.file).toContain('application/pdf');
    const body = await response.body();
    // The bytes served are the file in the repository, and it is the length the card states.
    expect(body.equals(readFileSync(`public${downloadHref(d)}`)), d.file).toBe(true);
    const info = pdfInfo(body);
    expect(info.signature, d.file).toBe('%PDF-');
    expect(info.closed, d.file).toBe(true);
    expect(info.pages, d.file).toBe(d.pages);
  }
});

test('a campaign link resolves with and without a trailing slash and keeps its query string', async ({ page, request }) => {
  for (const [slug, target] of Object.entries(campaignLinks)) {
    const [path, fragment] = target.split('#');
    // GitHub Pages serves /r/<slug>.html at /r/<slug>; the local preview does not
    // drop the extension, so the file is requested by its full name here.
    for (const url of [`/r/${slug}.html`, `/r/${slug}/`]) {
      const stub = await request.get(url);
      expect(stub.status(), url).toBe(200);
      const html = await stub.text();
      expect(html, url).toContain('<meta name="robots" content="noindex, follow" />');
      expect(html, url).toContain(`<meta http-equiv="refresh" content="0; url=${target}" />`);
      expect(html, url).toContain(`<a href="${target}">`);
    }
    if (path.endsWith('.pdf')) {
      // A PDF target: the file exists and is a PDF. Chromium hands it to the viewer, so it is not navigated here.
      const pdf = await request.get(path);
      expect(pdf.status(), path).toBe(200);
      expect(pdfInfo(await pdf.body()).signature, path).toBe('%PDF-');
      continue;
    }
    await page.goto(`/r/${slug}.html?src=li&c=wave1`);
    await expect(page, slug).toHaveURL(new RegExp(`${path}\\?src=li&c=wave1#${fragment}$`));
    const card = page.locator(`#${fragment}`);
    await expect(card).toBeInViewport();
    // The card clears the sticky header rather than landing beneath it.
    const header = await page.locator('[data-site-header]').boundingBox();
    expect((await card.boundingBox())!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
  }
});

test('the papers list holds its layout at phone and desktop widths', async ({ page }) => {
  await page.goto('/insights/');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${width}px` }).toBeLessThanOrEqual(0);
    for (const box of await page.locator('.paper-get a').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
      expect(box).toBeGreaterThanOrEqual(44);
    }
  }
});
