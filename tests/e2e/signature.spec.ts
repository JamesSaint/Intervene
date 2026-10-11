import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { signatureNotices, signatureText } from '../../src/lib/email-signature';

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  // New assets cannot be live before deployment. Resolve the exact production URLs
  // against this production build; do not replace URLs in the copied HTML.
  await page.route(/^https:\/\/intervene\.uk\/assets\/brand\/.*\.png(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    const response = await page.request.get(`${baseURL}${url.pathname}`);
    expect(response.status()).toBe(200);
    await route.fulfill({ response });
  });
});

test('previews and standalone email remain readable at desktop and phone widths', async ({ page }, testInfo) => {
  await page.goto('/signature/');
  for (const theme of ['light', 'dark']) {
    const frame = page.frameLocator(`iframe[title="${theme === 'light' ? 'Light' : 'Dark'} signature preview"]`);
    await expect(frame.getByText('James Saint', { exact: true })).toBeVisible();
    await expect(frame.locator('img')).toHaveCount(2);
    await expect(frame.locator('img').first()).toBeVisible();
    expect(await frame.locator('img').first().getAttribute('src')).toContain(`-${theme === 'light' ? 'black' : 'white'}-transparent.png`);
    for (const [name, wording] of Object.entries(signatureNotices)) {
      expect(await frame.locator(`[data-notice="${name}"]`).textContent()).toBe(wording);
    }
    await expect.poll(() => frame.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const theme of ['light', 'dark']) {
    const bounds = await page.locator(`.signature-preview-${theme}`).evaluate(figure => {
      const box = figure.getBoundingClientRect();
      return { left: box.left, width: box.width, viewport: innerWidth };
    });
    expect(bounds.left).toBe(0);
    expect(bounds.width).toBe(bounds.viewport);
  }
  await mkdir('.playwright/signature-review', { recursive: true });
  await page.locator('.site-header').evaluate(header => (header as HTMLElement).style.position = 'relative');
  for (const theme of ['light', 'dark']) {
    await page.locator(`.signature-preview-${theme}`).screenshot({ path: `.playwright/signature-review/signature-${theme}-${testInfo.project.name}.png` });
  }
  await page.screenshot({ path: `.playwright/signature-review/page-${testInfo.project.name}.png`, fullPage: true });

  await page.goto('/signature/email.html');
  expect(await page.locator('script').count()).toBe(0);
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect(page.locator('img')).toHaveCount(2);
    await expect.poll(() => page.locator('img').first().evaluate(image => (image as HTMLImageElement).currentSrc)).toContain(`-${scheme === 'light' ? 'black' : 'white'}-transparent.png`);
  }
  await page.locator('style').evaluateAll(styles => styles.forEach(style => style.remove()));
  for (const [background, colour] of [['#ffffff', '#1a1a1a'], ['#1a1a1a', '#f0f0f0']]) {
    await page.emulateMedia({ colorScheme: background === '#ffffff' ? 'light' : 'dark' });
    await page.locator('body').evaluate((body, values) => {
      body.style.margin = '0'; body.style.background = values[0]; body.style.color = values[1];
    }, [background, colour]);
    const metrics = await page.locator('.sig-root').evaluate(root => {
      return { colour: getComputedStyle(root).color, background: getComputedStyle(root).backgroundColor, padding: getComputedStyle(root).padding, width: root.getBoundingClientRect().width, viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(metrics.colour).toBe(colour === '#1a1a1a' ? 'rgb(26, 26, 26)' : 'rgb(240, 240, 240)');
    expect(metrics.background).toBe('rgba(0, 0, 0, 0)');
    expect(metrics.padding).toBe('24px 0px');
    expect(metrics.width).toBe(metrics.viewport);
    expect(metrics.overflow).toBe(false);
    await expect(page.locator('img')).toHaveCount(2);
    await expect.poll(() => page.locator('img').first().evaluate(image => (image as HTMLImageElement).currentSrc)).toContain(`-${background === '#ffffff' ? 'black' : 'white'}-transparent.png`);
    for (const [name, wording] of Object.entries(signatureNotices)) expect(await page.locator(`[data-notice="${name}"]`).textContent()).toBe(wording);
    await page.screenshot({ path: `.playwright/signature-review/without-css-${colour === '#1a1a1a' ? 'light' : 'dark'}-${testInfo.project.name}.png`, fullPage: true });
  }
});

test('Copy Signature writes both clipboard types and only the email fragment', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Native clipboard read permissions are Chromium-specific.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/signature/');
  await page.getByRole('button', { name: 'Copy Signature', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Signature copied.');
  const clipboard = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    return { types: item.types, html: await (await item.getType('text/html')).text(), text: await (await item.getType('text/plain')).text() };
  });
  expect(clipboard.types).toEqual(expect.arrayContaining(['text/html', 'text/plain']));
  expect(clipboard.text).toBe(signatureText);
  expect(clipboard.html).toContain('class="sig-root"');
  expect(clipboard.html).not.toMatch(/<style|<script|<iframe|Copy Signature|Install in Apple Mail|data-theme=/);
  expect(clipboard.html).not.toMatch(/src="\//);
  await page.setContent(`<html><body style="margin:0;background:#1a1a1a;color:#f0f0f0"><div contenteditable="true"></div></body></html>`);
  await page.locator('[contenteditable]').focus();
  await page.keyboard.press('ControlOrMeta+V');
  await expect(page.locator('[contenteditable] .sig-root')).toBeVisible();
  // Editor sanitisation must never leave duplicate black and white images.
  await expect(page.locator('[contenteditable] img')).toHaveCount(2);
  await expect(page.locator('[contenteditable] img').first()).toBeVisible();
  await expect(page.locator('[contenteditable] .sig-link').first()).toHaveCSS('color', 'rgb(107, 107, 107)');
  await expect(page.locator('[contenteditable] .sig-link').first()).toHaveCSS('text-decoration-line', 'none');
  // Chromium's editor normalises NBSP to ordinary spaces during paste. Wording is unchanged.
  for (const [name, wording] of Object.entries(signatureNotices)) expect((await page.locator(`[data-notice="${name}"]`).textContent())?.replace(/\u00a0/g, ' ')).toBe(wording.replace(/\u00a0/g, ' '));
  // The pasted notices must keep using the available width after resizing.
  for (const width of [1200, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.locator('[data-notice="confidentiality"]').boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBe(width);
    expect(bounds!.x).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: `.playwright/signature-review/pasted-${test.info().project.name}.png`, fullPage: true });
});

test('blocked images and stripped picture sources keep one compact logo per brand', async ({ page }) => {
  await page.route(/^https:\/\/intervene\.uk\/assets\/brand\/.*\.png(?:\?.*)?$/, route => route.abort());
  await page.goto('/signature/email.html');
  await page.locator('style, source').evaluateAll(elements => elements.forEach(element => element.remove()));
  await expect(page.locator('img')).toHaveCount(2);
  const dimensions = await page.locator('img').evaluateAll(images => images.map(image => {
    const box = image.getBoundingClientRect();
    return { width: box.width, height: box.height, src: image.getAttribute('src') };
  }));
  expect(dimensions[0].width).toBe(120);
  expect(dimensions[0].height).toBeCloseTo(13.4, 1);
  expect(dimensions[1].width).toBe(80);
  expect(dimensions[1].height).toBeCloseTo(17.8667, 1);
  for (const image of dimensions) expect(image.src).toContain('-black-transparent.png?v=');
  for (const [name, wording] of Object.entries(signatureNotices)) expect(await page.locator(`[data-notice="${name}"]`).textContent()).toBe(wording);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('fallback copies rich HTML and reports a blocked manual copy honestly', async ({ page }) => {
  await page.goto('/signature/');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }));
  await page.evaluate(() => {
    (window as Window & { copied?: Record<string, string> }).copied = {};
    document.execCommand = () => {
      const data: Record<string, string> = {};
      const event = new Event('copy', { cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: { setData: (type: string, value: string) => { data[type] = value; } } });
      document.dispatchEvent(event);
      (window as Window & { copied?: Record<string, string> }).copied = data;
      return true;
    };
  });
  await page.getByRole('button', { name: 'Copy Signature', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Signature copied.');
  const data = await page.evaluate(() => (window as Window & { copied?: Record<string, string> }).copied!);
  expect(data['text/plain']).toBe(signatureText);
  expect(data['text/html']).toContain('class="sig-root"');
  expect(data['text/html']).not.toContain('<iframe');
  await page.evaluate(() => { document.execCommand = () => false; });
  await page.getByRole('button', { name: 'Copy Signature', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Copy was blocked.');
  await expect(page.getByRole('button', { name: 'Copy Signature', exact: true })).toBeEnabled();
});

test('WebKit can copy the signature during a native click gesture', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'Safari-engine clipboard smoke check.');
  await page.goto('/signature/');
  await page.getByRole('button', { name: 'Copy Signature', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Signature copied.');
});

test('hosted assets are byte-identical approved transparent PNGs', async ({ request }) => {
  // SHA-256 values of the approved brand kit v3.0.0 masters, recorded before copying.
  const masters: Record<string, string> = {
    'intervene-wordmark-black-transparent': '1ccb487dfebc057aea9a0086837d96d864fa1e6632731b2b9b6eaa3f54c00410',
    'intervene-wordmark-white-transparent': 'ccdb32192a6140c403389536e3d3147a380fa5f75be20feeb1bba85702977c28',
    'agda-wordmark-no-reg-black-transparent': '2b27cc4e60af4bf63b4e6b3f4120cc35214fbc543feaa68244a6843974a2e8af',
    'agda-wordmark-no-reg-white-transparent': '38f8aa6aab1008abd2af175df3515c2cc5e1d2788920f12e44b9cf9112058ac8',
  };
  for (const stem of ['intervene-wordmark', 'agda-wordmark-no-reg']) {
    for (const tone of ['black', 'white']) {
      const name = `${stem}-${tone}-transparent`;
      const response = await request.get(`/assets/brand/${name}.png`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
      const bytes = await response.body();
      expect(bytes[25]).toBe(6); // PNG RGBA colour type.
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(masters[name]);
    }
  }
});
