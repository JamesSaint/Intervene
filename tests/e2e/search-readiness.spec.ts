import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}
// The independently tested email document is an export, not a site page.
const paths = htmlFiles('dist').map((file) => '/' + relative('dist', file).replace(/index\.html$/, '')).filter(path => path !== '/signature/email.html');

test('rendered pages, canonicals, metadata and entity references agree with the sitemap', async ({ browser, baseURL, request }) => {
  // Content and all important navigation remain available without JavaScript.
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const publicUrls: string[] = [];
  for (const path of paths) {
    if (path === '/method/') {
      // Parse the redirect document without executing its native meta refresh.
      const stub = await request.get(path);
      expect(stub.status()).toBe(200);
      const redirect = await page.evaluate((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return {
          canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          robots: doc.querySelector('meta[name="robots"]')?.getAttribute('content'),
          refresh: doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content'),
        };
      }, await stub.text());
      expect(redirect.canonical).toBe('https://intervene.uk/methodology/');
      expect(redirect.robots).toContain('noindex');
      expect(redirect.refresh).toBe('0; url=/methodology/');
      continue;
    }
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    const data = await page.evaluate(() => {
      const get = (selector: string) => document.querySelector(selector)?.getAttribute('content');
      return {
        title: document.title, description: get('meta[name="description"]'),
        robots: get('meta[name="robots"]'), canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        ogUrl: get('meta[property="og:url"]'), ogTitle: get('meta[property="og:title"]'),
        ogDescription: get('meta[property="og:description"]'), ogImage: get('meta[property="og:image"]'),
        twitterImage: get('meta[name="twitter:image"]'),
        h1: document.querySelectorAll('main h1').length,
        graph: JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}')['@graph'],
        scriptSources: [...document.querySelectorAll('script[src]')].map((script) => script.getAttribute('src')),
      };
    });
    expect(data.canonical).toBe('https://intervene.uk' + path);
    expect(data.scriptSources.some((src) => /googletagmanager|google-analytics/.test(src ?? ''))).toBe(false);
    expect(data.h1, path).toBe(1);
    expect(data.description, path).toBeTruthy();
    expect(data.ogTitle).toBe(data.title);
    expect(data.ogDescription).toBe(data.description);
    expect(data.ogUrl).toBe(data.canonical);
    expect(data.twitterImage).toBe(data.ogImage);
    expect(data.ogImage).toMatch(/^https:\/\/intervene\.uk\//);
    expect((await request.get(data.ogImage!.replace('https://intervene.uk', ''))).status()).toBe(200);
    const graph: any[] = data.graph;
    expect(graph, path).toBeTruthy();
    const ids = graph.map((node) => node['@id']);
    expect(new Set(ids).size, path).toBe(ids.length);
    const org = graph.find((node) => node['@type'] === 'Organization');
    expect(org['@id']).toBe('https://intervene.uk/#organization');
    expect(org.legalName).toBe('Intervene Limited');
    const services = graph.filter((node) => node['@type'] === 'Service');
    expect(services.map((node) => node.name)).toEqual(['Intervention Readiness Review', 'AGDA® Assessment']);
    for (const offer of org.makesOffer) {
      expect(services.find((service) => service['@id'] === offer.itemOffered['@id'])?.name).toBe(offer.name);
    }
    for (const breadcrumb of graph.find((node) => node['@type'] === 'BreadcrumbList').itemListElement) {
      const target = breadcrumb.item.replace('https://intervene.uk', '');
      expect((await request.get(target)).status(), `${path} breadcrumb ${target}`).toBe(200);
    }
    if (data.robots?.includes('noindex')) continue;
    expect(data.robots).toBe('index, follow');
    expect(titles.has(data.title), path + ' duplicate title').toBe(false);
    expect(descriptions.has(data.description!), path + ' duplicate description').toBe(false);
    titles.add(data.title); descriptions.add(data.description!);
    publicUrls.push(data.canonical!);
  }
  expect((await request.get('/missing-search-audit-path/')).status()).toBe(404);
  const index = await request.get('/sitemap-index.xml');
  const sitemap = await request.get('/sitemap-0.xml');
  expect(index.status()).toBe(200); expect(sitemap.status()).toBe(200);
  const parseXml = async (xml: string) => page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    return { errors: doc.querySelectorAll('parsererror').length, urls: [...doc.querySelectorAll('loc')].map((node) => node.textContent) };
  }, xml);
  const indexData = await parseXml(await index.text());
  expect(indexData.errors).toBe(0);
  expect(indexData.urls).toEqual(['https://intervene.uk/sitemap-0.xml']);
  const sitemapData = await parseXml(await sitemap.text());
  expect(sitemapData.errors).toBe(0);
  expect(new Set(sitemapData.urls).size).toBe(sitemapData.urls.length);
  expect(sitemapData.urls.sort()).toEqual(publicUrls.sort());
  expect(await sitemap.text()).not.toContain('<lastmod>');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /style-guide/');
  expect(robots).toContain('Sitemap: https://intervene.uk/sitemap-index.xml');
  expect(robots).not.toContain('Disallow: /\n');
  // Every resource actually linked in llms.txt is a canonical indexable page.
  const llms = readFileSync('public/llms.txt', 'utf8');
  for (const match of llms.matchAll(/https:\/\/intervene\.uk\/[^\s]*/g)) expect(publicUrls).toContain(match[0]);
  await context.close();
});
