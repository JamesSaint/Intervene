import { test, expect } from '@playwright/test';
import { downloadGroups, downloadHref } from '../../src/lib/insight-downloads';
import { campaignLinks } from '../../src/lib/campaign-links';

const cards = downloadGroups.flatMap((g) => g.items);
const UNLISTED = '/insights/pdf/intervene-agda-overview.pdf';
const QUERY = '?src=li&c=wave1';
const google = /https:\/\/[^/]*(?:googletagmanager\.com|google-analytics\.com)\//;

test('insights: seven papers in three groups, then the closing block, then the notes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  await page.goto('/insights/');
  await expect(page).toHaveTitle('Insights | Intervene');
  await expect(page.locator('main h1')).toHaveText('Insights');
  await expect(page.locator('.paper-group-title')).toHaveText(['Start here', 'White papers', 'Reference']);
  expect(cards).toHaveLength(7);
  await expect(page.locator('.paper')).toHaveCount(7);
  expect(await page.locator('.paper').evaluateAll((els) => els.map((el) => el.id))).toEqual([
    'agda-one-pager', 'agda-fraud-one-pager', 'cro-paper', 'ciso-paper', 'fraud-paper', 'obligation-map', 'sample-verdict',
  ]);
  for (const card of cards) {
    const row = page.locator(`#${card.id}`);
    await expect(row.locator('.paper-pages')).toHaveText(`${card.pages} ${card.pages === 1 ? 'page' : 'pages'}`);
    const link = row.locator('a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText('Download PDF');
    await expect(link).toHaveAttribute('href', downloadHref(card));
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
    // Seven links share one visible label, so each carries its paper's title.
    await expect(link).toHaveAttribute('aria-label', `Download PDF: ${card.title}`);
  }
  // The version without prices is hosted but not listed.
  await expect(page.locator(`a[href="${UNLISTED}"]`)).toHaveCount(0);

  const cta = page.locator('main .cta-band');
  await expect(cta.locator('h2')).toHaveText('Which of your systems would you most need to stop at short notice?');
  await expect(cta.locator('a.btn')).toHaveText('Talk to us');
  await expect(cta.locator('a.btn')).toHaveAttribute('href', '/contact/');

  // Reading order: papers, closing block, Evidence notes.
  const notes = page.locator('#evidence-notes');
  await expect(notes.locator('#evidence-notes-title')).toHaveText('Evidence notes');
  await expect(notes.locator('.note-lead')).toHaveCount(1);
  await expect(notes.locator('.insights-list a')).toHaveCount(2);
  const y = (selector: string) => page.locator(selector).first().evaluate((el) => el.getBoundingClientRect().top + scrollY);
  expect(await y('.paper-list')).toBeLessThan(await y('main .cta-band'));
  expect(await y('main .cta-band')).toBeLessThan(await y('#evidence-notes'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('insights: metadata names the page and its own share image', async ({ page, request }) => {
  await page.goto('/insights/');
  const meta = (selector: string) => page.locator(selector).getAttribute('content');
  const description = 'Papers and briefings on one question: when an AI-enabled or automated system starts to cause harm, can someone with authority stop it in time?';
  expect(await meta('meta[name="description"]')).toBe(description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://intervene.uk/insights/');
  expect(await meta('meta[name="robots"]')).toBe('index, follow');
  expect(await meta('meta[property="og:title"]')).toBe('Insights | Intervene');
  expect(await meta('meta[property="og:description"]')).toBe(description);
  expect(await meta('meta[property="og:url"]')).toBe('https://intervene.uk/insights/');
  expect(await meta('meta[property="og:image"]')).toBe('https://intervene.uk/assets/og/og-insights.png');
  expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  expect(await meta('meta[name="twitter:image"]')).toBe('https://intervene.uk/assets/og/og-insights.png');
  const image = await request.get('/assets/og/og-insights.png');
  expect(image.status()).toBe(200);
  const png = await image.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});

test('insights: all eight PDFs are served as PDFs', async ({ request }) => {
  const files = [...cards.map(downloadHref), UNLISTED];
  expect(new Set(files).size).toBe(8);
  for (const file of files) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect(response.headers()['content-type'], file).toContain('application/pdf');
    expect((await response.body()).subarray(0, 5).toString(), file).toBe('%PDF-');
  }
});

test('insights: the sitemap lists the page and neither the PDFs nor the campaign links', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('<loc>https://intervene.uk/insights/</loc>');
  expect(sitemap).not.toContain('/r/');
  expect(sitemap).not.toContain('.pdf');
});

// Both built forms of each link: /r/<slug>/ and /r/<slug>.html. GitHub Pages
// serves the second at /r/<slug>; the local preview does not, so the
// extensionless form is checked against production, not here.
for (const form of ['/', '.html']) {
  test(`campaign links (${form}) land on their card with the query string, clear of the header`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
    for (const card of cards) {
      await page.goto(`/r/${card.id}${form}${QUERY}`);
      await page.waitForURL(`**/insights/${QUERY}#${card.id}`);
      const row = page.locator(`#${card.id}`);
      await expect(row).toBeInViewport();
      const [top, header] = await Promise.all([
        row.evaluate((el) => el.getBoundingClientRect().top),
        page.locator('header.site-header').evaluate((el) => el.getBoundingClientRect().bottom),
      ]);
      expect(top, card.id).toBeGreaterThanOrEqual(header);
    }
  });

  test(`campaign link to the unlisted overview (${form}) forwards to the PDF with the query string`, async ({ page }) => {
    await page.route(`**${UNLISTED}*`, (route) => route.fulfill({ contentType: 'text/html', body: '<title>pdf</title>' }));
    await page.goto(`/r/agda-overview${form}${QUERY}`);
    await page.waitForURL(`**${UNLISTED}${QUERY}`);
  });
}

test('campaign links cover exactly the seven cards and the overview, and say what they are', async ({ request }) => {
  expect(Object.keys(campaignLinks).sort()).toEqual([...cards.map((c) => c.id), 'agda-overview'].sort());
  for (const [slug, target] of Object.entries(campaignLinks)) {
    for (const form of ['/', '.html']) {
      const response = await request.get(`/r/${slug}${form}`, { maxRedirects: 0 });
      // A page that forwards, not an HTTP redirect.
      expect(response.status(), slug).toBe(200);
      const html = await response.text();
      expect(html).toContain('<meta name="robots" content="noindex, follow"');
      expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${target}"`);
      expect(html).toContain(`<a href="${target}">`);
      // One inline forwarding script; nothing loaded, so no analytics.
      expect(html.match(/<script/g)).toHaveLength(1);
      expect(html).not.toMatch(/<script[^>]*\ssrc=|gtag\(|dataLayer/);
    }
  }
});

test('campaign links still forward without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/r/cro-paper/?src=li');
  await page.waitForURL('**/insights/#cro-paper');
  await expect(page.locator('#cro-paper')).toBeVisible();
  await context.close();
});

test('campaign parameters never reach analytics, with or without consent', async ({ browser, baseURL }) => {
  for (const choice of ['denied', 'granted']) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    const requests: string[] = [];
    page.on('request', (request) => { if (google.test(request.url())) requests.push(request.url()); });
    await page.route(google, (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.addInitScript((value) => localStorage.setItem('intv-consent', value), choice);
    await page.goto(`/r/cro-paper/${QUERY}`);
    await page.waitForURL(/\/insights\/.*#cro-paper$/);
    await page.waitForTimeout(600);
    const layer = await page.evaluate(() => JSON.stringify(((window as any).dataLayer ?? []).map((args: any) => Array.from(args))));
    expect(layer).not.toContain('wave1');
    expect(layer).not.toContain('src=li');
    expect(requests.join(' ')).not.toContain('wave1');
    if (choice === 'denied') {
      expect(requests).toEqual([]);
      expect(layer).toBe('[]');
    } else {
      // One tag load, one config, canonical location, query-free referrer and address.
      expect(requests).toHaveLength(1);
      const config = JSON.parse(layer).filter((args: any) => args[0] === 'config');
      expect(config).toHaveLength(1);
      expect(config[0][2].page_location).toBe('https://intervene.uk/insights/');
      expect(config[0][2].page_referrer).toBe(`${baseURL}/r/cro-paper/`);
      expect(page.url()).toBe(`${baseURL}/insights/#cro-paper`);
      expect(JSON.parse(layer).filter((args: any) => args[0] === 'event')).toEqual([]);
    }
    await context.close();
  }
});
