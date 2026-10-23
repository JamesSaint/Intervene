import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';

const routes = readdirSync('dist', { recursive: true }).map(String)
  // The email document intentionally has no website chrome or appearance script.
  .filter(path => path.endsWith('.html') && !path.startsWith('assets/') && path !== 'method/index.html' && path !== 'signature/email.html')
  .map(path => path === 'index.html' ? '/' : `/${path.replace(/index\.html$/, '')}`);

async function expectFavicon(page: Page, theme: string) {
  await expect(page.locator('[data-appearance-icon]')).toHaveAttribute('href', `/assets/images/favicons/favicon-${theme}.svg`);
  await expect(page.locator('[data-appearance-icon-fallback]')).toHaveAttribute('href', `/assets/images/favicons/favicon-${theme}.png`);
}

async function choose(page: Page, preference: string) {
  if (page.viewportSize()!.width < 720) {
    if (!await page.locator('[data-takeover]').isVisible()) await page.locator('[data-menu-trigger]').click();
    await page.locator(`.appearance-menu [data-appearance-option="${preference}"]`).click();
  } else {
    if (await page.locator('.appearance-header').getAttribute('open') === null) await page.locator('.appearance-header summary').click();
    await page.locator(`.appearance-header [data-appearance-option="${preference}"]`).click();
  }
}

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  // New email assets are verified against the local production build before deployment.
  await page.route('https://intervene.uk/assets/brand/*.png', async route => {
    const response = await page.request.get(`${baseURL}${new URL(route.request().url()).pathname}`);
    await route.fulfill({ response });
  });
});

for (const scheme of ['light', 'dark'] as const) {
  test(`first visit follows System ${scheme}, including live changes`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-appearance', 'system');
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    await expectFavicon(page, scheme);
    expect(await page.evaluate(() => localStorage.getItem('intervene:appearance'))).toBeNull();
    await page.emulateMedia({ colorScheme: scheme === 'dark' ? 'light' : 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme === 'dark' ? 'light' : 'dark');
    await expectFavicon(page, scheme === 'dark' ? 'light' : 'dark');
  });

  test(`explicit ${scheme} overrides the OS, persists and returns to System`, async ({ page }) => {
    const opposite = scheme === 'dark' ? 'light' : 'dark';
    await page.emulateMedia({ colorScheme: opposite });
    await page.goto('/');
    await choose(page, scheme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    await expectFavicon(page, opposite);
    await expect(page.locator(`[data-appearance-option="${scheme}"]`).first()).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('intervene:appearance'))).toBe(scheme);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    await expectFavicon(page, opposite);
    await page.goto('/agda/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    await expectFavicon(page, opposite);
    await page.emulateMedia({ colorScheme: scheme });
    await expectFavicon(page, scheme);
    await page.emulateMedia({ colorScheme: opposite });
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    await expectFavicon(page, opposite);
    await choose(page, 'system');
    await expect(page.locator('html')).toHaveAttribute('data-theme', opposite);
    await expectFavicon(page, opposite);
    expect(await page.evaluate(() => localStorage.getItem('intervene:appearance'))).toBe('system');
  });

  test(`all production routes render in ${scheme} with readable content and intact assets`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // The email signature artwork uses absolute https://intervene.uk URLs, which email clients need.
    // The meta CSP allows them only as 'self', i.e. on the real origin; the local preview origin is
    // different, so that one img-src report is expected here and nowhere else.
    const expectedLocalOnly = (text: string) => {
      if (!/img-src|load the image/i.test(text)) return false;
      const raw = /https:\/\/[^\s"')]+/.exec(text)?.[0];
      if (!raw) return false;
      const url = new URL(raw);
      return url.origin === 'https://intervene.uk' && url.pathname.startsWith('/assets/');
    };
    page.on('console', message => { if (message.type() === 'error' && !expectedLocalOnly(message.text())) errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400 && !response.url().includes('googletagmanager')) errors.push(response.url()); });
    for (const route of routes) {
      await page.goto(route); await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      await expectFavicon(page, scheme);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), route).toBe(scheme);
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), route).toBe(scheme === 'dark' ? 'rgb(10, 10, 10)' : 'rgb(255, 255, 255)');
      const broken = await page.locator('img').evaluateAll(images => images.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement).filter(image => image.getBoundingClientRect().width > 0 && (!image.complete || !image.naturalWidth)).map(image => image.src));
      expect(broken, route).toEqual([]);
      const clipped = await page.locator('header *, main *, footer *').evaluateAll(elements => elements.filter(element => {
        if (element.closest('.code-block, .envelope, [hidden]')) return false;
        const box = element.getBoundingClientRect(); const style = getComputedStyle(element);
        return box.width > 0 && style.position !== 'absolute' && (box.left < -1 || box.right > innerWidth + 1);
      }).map(element => `${element.tagName}.${element.className}`));
      expect(clipped, route).toEqual([]);
    }
    expect(errors).toEqual([]);
  });

  test(`principal pages and selector pass WCAG AA scans in ${scheme}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const route of ['/', '/agda/', '/methodology/', '/sample-report/', '/services/', '/contact/', '/readiness-snapshot/', '/legal/privacy/', '/style-guide/']) {
      await page.goto(route); await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), route).toEqual([]);
    }
    await choose(page, scheme);
    if (page.viewportSize()!.width < 720) await expect.poll(() => page.locator('[data-takeover]').evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  });

  test(`no JavaScript uses system ${scheme} and retains navigation, forms and SEDI`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: scheme, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(scheme);
    await expect(page.locator('.no-script-menu')).toHaveAttribute('href', '#footer-nav');
    await expect(page.locator('.appearance-header')).toBeHidden();
    await expect(page.locator('.window-view').first()).toBeVisible();
    await page.goto('/contact/');
    await expect(page.locator('form[data-contact]')).toHaveAttribute('method', 'POST');
    await expect(page.locator('#f-name')).toBeVisible();
    await context.close();
  });
}

test('invalid preferences and blocked storage safely follow System', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('intervene:appearance', 'invalid'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'system');
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await choose(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await choose(page, 'system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('stored appearance is resolved before body parsing and first paint', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem('intervene:appearance', 'dark');
    (window as any).__bodyThemes = [];
    (window as any).__bodyIcons = [];
    const observer = new MutationObserver(() => {
      if (document.body) {
        (window as any).__bodyThemes.push(document.documentElement.dataset.theme);
        (window as any).__bodyIcons.push(Array.from(document.querySelectorAll('[data-appearance-icon], [data-appearance-icon-fallback]')).map(icon => icon.getAttribute('href')));
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto('/');
  expect(await page.evaluate(() => (window as any).__bodyThemes)).toEqual(['dark']);
  expect(await page.evaluate(() => (window as any).__bodyIcons)).toEqual([[
    '/assets/images/favicons/favicon-light.png', '/assets/images/favicons/favicon-light.svg',
  ]]);
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('paint').length)).toBeGreaterThan(0);
  await expectFavicon(page, 'light');
  expect(await page.locator('meta[name="theme-color"]').first().getAttribute('content')).toBe('#0a0a0a');
});

test('keyboard selection announces state, Escape restores focus and reduced motion is immediate', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  const mobile = page.viewportSize()!.width < 720;
  if (mobile) { await page.locator('[data-menu-trigger]').focus(); await page.keyboard.press('Enter'); await expect(page.locator('.takeover-body a').first()).toBeFocused(); }
  else { await page.locator('.appearance-header summary').focus(); await page.keyboard.press('Enter'); }
  const prefix = mobile ? '.appearance-menu' : '.appearance-header';
  await page.locator(`${prefix} [data-appearance-option="dark"]`).focus(); await page.keyboard.press('Enter');
  await expect(page.locator(`${prefix} [data-appearance-option="dark"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await expect(page.locator(`${prefix} [data-appearance-status]`)).toContainText('Appearance: dark');
  await page.keyboard.press('Escape');
  await expect(page.locator(mobile ? '[data-menu-trigger]' : '.appearance-header summary')).toBeFocused();
});

test('appearance changes preserve opening and SEDI timelines, selected outcome and geometry', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    (window as any).__headlineStarts = 0;
    document.addEventListener('animationstart', event => { if (event.animationName === 'headline-enter') (window as any).__headlineStarts++; });
  });
  await page.goto('/'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
  const starts = await page.evaluate(() => (window as any).__headlineStarts);
  const before = await page.locator('.hero-home').boundingBox();
  // A live OS change exercises the same appearance update without opening
  // navigation, which would itself scroll the running instrument off screen.
  await page.locator('.window-view:visible .window-sequence').evaluate(node => scrollTo({ top: node.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }));
  await page.locator('[data-window-replay]').evaluate((button: HTMLButtonElement) => button.click());
  const beforeTime = await page.locator('.window-view:visible .window-trace').evaluate(node => node.getAnimations()[0]?.currentTime);
  await page.emulateMedia({ colorScheme: 'light' }); await page.waitForTimeout(100);
  const afterTime = await page.locator('.window-view:visible .window-trace').evaluate(node => node.getAnimations()[0]?.currentTime);
  expect(Number(afterTime)).toBeGreaterThan(Number(beforeTime));
  expect(await page.evaluate(() => (window as any).__headlineStarts)).toBe(starts);
  const after = await page.locator('.hero-home').boundingBox();
  expect(after!.width).toBeCloseTo(before!.width, 2); expect(after!.height).toBeCloseTo(before!.height, 2);
  await expect(page.getByRole('radio', { name: 'In time', exact: true })).toBeChecked();
});

test('another tab updates the stored appearance and clearing it restores System', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const sibling = await context.newPage();
  await sibling.goto('/services/');
  await sibling.evaluate(() => localStorage.setItem('intervene:appearance', 'light'));
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await sibling.evaluate(() => localStorage.removeItem('intervene:appearance'));
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await sibling.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`enquiry submission errors remain readable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/contact/');
    await page.route('**/formspree.io/**', route => route.fulfill({ status: 500, body: '{}' }));
    await page.locator('#f-name').fill('Test Person');
    await page.locator('#f-org').fill('Test Organisation');
    await page.locator('#f-email').fill('test@example.com');
    await page.locator('#f-msg').fill('A test system requiring intervention.');
    await page.locator('form[data-contact] button[type="submit"]').click();
    await expect(page.locator('.form-status[data-state="err"]')).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}


test('controls, selected indicators and SEDI signals retain non-text contrast', async ({ page }) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/contact/');
    const ratios = await page.evaluate(() => {
      const channels = (colour: string) => colour.match(/[\d.]+/g)!.map(Number);
      const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      }).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
      // Resolve custom colours through CSS, including variable references.
      const probe = document.createElement('span'); document.body.append(probe);
      probe.style.backgroundColor = 'var(--paper)';
      const background = channels(getComputedStyle(probe).backgroundColor);
      const backgroundLuminance = luminance(background);
      const ratio = (token: string) => {
        probe.style.color = `var(${token})`;
        const foreground = channels(getComputedStyle(probe).color);
        const alpha = foreground[3] ?? 1;
        const foregroundLuminance = luminance(foreground.slice(0, 3).map((value, i) => value * alpha + background[i] * (1 - alpha)));
        return (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
      };
      const values = ['--control-border', '--control-active', '--focus', '--selected-bg', '--sedi-signal'].map(token => ({ token, contrast: ratio(token) }));
      probe.remove();
      return values;
    });
    for (const { token, contrast } of ratios) expect(contrast, `${theme} ${token}`).toBeGreaterThanOrEqual(3);
  }
});
