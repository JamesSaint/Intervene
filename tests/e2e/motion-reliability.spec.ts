import { test, expect, type Page } from '@playwright/test';

async function prepare(page: Page, reducedMotion: 'reduce' | 'no-preference' = 'no-preference') {
  await page.emulateMedia({ reducedMotion });
  await page.addInitScript(() => {
    localStorage.setItem('intv-consent', 'denied');
    (window as any).__starts = [];
    document.addEventListener('animationstart', (event) => {
      const node = event.target as HTMLElement;
      const box = node.getBoundingClientRect();
      const sequence = node.closest('.window-sequence')?.getBoundingClientRect();
      (window as any).__starts.push({
        name: event.animationName, top: box.top, bottom: box.bottom,
        transform: getComputedStyle(node).transform, opacity: getComputedStyle(node).opacity, fonts: document.fonts.status,
        sequence: sequence ? { top: sequence.top, bottom: sequence.bottom } : null,
        viewport: innerHeight,
      });
    });
  });
}
async function showSequence(page: Page) {
  await page.locator('.window-view:visible .window-sequence').evaluate(node => {
    window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - 150, behavior: 'instant' });
  });
}
async function trace(page: Page) {
  return page.locator('.window-view:visible .window-trace').evaluate(node => {
    const box = node.getBoundingClientRect();
    return innerWidth <= 720 ? box.height : box.width;
  });
}
async function replay(page: Page) {
  await expect(page.locator('[data-window-replay]')).toBeVisible();
  await showSequence(page);
  // The replay control can be above the sticky header on short screens.
  // Dispatching its native click preserves the sequence's scroll position.
  await page.locator('[data-window-replay]').evaluate((button: HTMLButtonElement) => button.click());
  const line = page.locator('.window-view:visible .window-trace');
  await expect.poll(() => line.evaluate(node => {
    getComputedStyle(node).transform;
    return node.getAnimations().some(animation => animation.playState === 'running');
  })).toBe(true);
  await line.evaluate(async node => {
    await Promise.all(node.getAnimations().map(animation => animation.ready));
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
}

test('opening waits for font layout, moves visibly, settles and never restarts on blur', async ({ page }) => {
  await prepare(page);
  await page.route('**/*.woff2', async route => {
    await new Promise(resolve => setTimeout(resolve, 450));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  if (await page.evaluate(() => document.fonts.status === 'loading')) {
    expect(await page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'headline-enter').length)).toBe(0);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'headline-enter').length)).toBe(2);
  const starts = await page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'headline-enter'));
  for (const start of starts) {
    expect(start.fonts).toBe('loaded');
    expect(Number(start.transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/)?.[1])).toBeGreaterThan(3);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'support-enter').length)).toBe(2);
  expect(await page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'support-enter').every((s: any) => s.opacity === '1'))).toBe(true);
  const hero = page.locator('.hero-home');
  await expect.poll(() => hero.evaluate(node => node.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
  await page.locator('.hero-home [data-primary-cta]').focus();
  await page.locator('[data-menu-trigger]').focus();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'headline-enter').length)).toBe(2);
  expect(await page.locator('.motion-line > span').first().evaluate(node => getComputedStyle(node).transform)).toBe('none');
});

test('story headings stay fixed in the document during scrolling and repeated entry', async ({ page }) => {
  await prepare(page);
  await page.addInitScript(() => {
    (window as any).__headingStarts = 0;
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
      if (this.matches('main .block h2')) (window as any).__headingStarts++;
      return original.apply(this, args);
    };
  });
  for (const route of ['/', '/agda/', '/methodology/', '/intervention-readiness/', '/about/']) {
    await page.goto(route); await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const headings = page.locator('main .block h2');
    const index = await headings.evaluateAll(nodes => nodes.findIndex(node => node.getBoundingClientRect().top > innerHeight + 80));
    expect(index, route).toBeGreaterThanOrEqual(0);
    const samples = await headings.nth(index).evaluate(async node => {
      const position = node.getBoundingClientRect().top + scrollY;
      const states = [];
      // Cross the former reveal threshold frame by frame, then revisit
      // it in the other direction. Compare document position, not the
      // viewport position that must change with normal scrolling.
      for (const direction of [1, -1]) {
        for (let frame = 0; frame <= 30; frame++) {
          const progress = direction === 1 ? frame / 30 : 1 - frame / 30;
          scrollTo({ top: position - innerHeight - 80 + (innerHeight / 2 + 80) * progress, behavior: 'instant' });
          await new Promise(resolve => requestAnimationFrame(resolve));
          const styles = getComputedStyle(node);
          states.push({ position: node.getBoundingClientRect().top + scrollY, transform: styles.transform, clipPath: styles.clipPath, opacity: styles.opacity });
        }
      }
      return { position, states };
    });
    for (const sample of samples.states) {
      expect(Math.abs(sample.position - samples.position), route).toBeLessThanOrEqual(0.5);
      expect(sample.transform, route).toBe('none');
      expect(sample.clipPath, route).toBe('none');
      expect(sample.opacity, route).toBe('1');
    }
    expect(await page.evaluate(() => (window as any).__headingStarts), route).toBe(0);
  }
});

test('automatic SEDI progression starts with the stages in view, not just its title', async ({ page }) => {
  await prepare(page); await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  const instrument = page.locator('.intervention-window');
  await instrument.evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - innerHeight + 120, behavior: 'instant' }));
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).__starts.filter((s: any) => s.name.includes('window-trace')).length)).toBe(0);
  await showSequence(page);
  await expect.poll(() => page.evaluate(() => (window as any).__starts.filter((s: any) => s.name.includes('window-trace')).length)).toBe(1);
  const event = await page.evaluate(() => (window as any).__starts.find((s: any) => s.name.includes('window-trace')));
  expect(event.sequence.top).toBeGreaterThanOrEqual(88);
  expect(event.sequence.bottom).toBeLessThan(event.viewport);
  const early = await trace(page); await page.waitForTimeout(180);
  expect(await trace(page)).toBeGreaterThan(early + 10);
});

test('height-only viewport changes preserve the running trace', async ({ page }) => {
  await prepare(page); await page.goto('/');
  await page.locator('input[value="too-late"]').evaluate((radio: HTMLInputElement) => radio.click());
  await replay(page); await page.waitForTimeout(100);
  const initial = await trace(page);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ ...viewport, height: viewport.height + 60 });
  await page.waitForTimeout(180);
  const later = await trace(page);
  expect(later).toBeGreaterThan(initial + 10);
  const playing = await page.locator('.window-view:visible .window-trace').evaluate(node => {
    getComputedStyle(node).transform;
    return node.getAnimations().some(a => a.playState === 'running');
  });
  expect(playing).toBe(true);
  await expect.poll(() => page.locator('.window-view:visible').evaluate(node => node.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
});

for (const initial of ['reduce', 'no-preference'] as const) {
  test(`motion recovers after preference changes from ${initial}`, async ({ page }) => {
    await prepare(page, initial); await page.goto('/');
    if (initial === 'no-preference') { await replay(page); await page.emulateMedia({ reducedMotion: 'reduce' }); }
    await expect(page.locator('[data-window-replay]')).toBeHidden();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('[data-window-replay]')).toBeVisible();
    await replay(page);
    const early = await trace(page); await page.waitForTimeout(200);
    expect(await trace(page)).toBeGreaterThan(early + 10);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => page.locator('.window-sequence').evaluateAll(nodes => nodes.flatMap(node => node.getAnimations({ subtree: true })).filter(a => a.playState === 'running').length)).toBe(0);
  });
}

test('an interrupted automatic trace restarts on return after rapid scrolling', async ({ page }) => {
  await prepare(page); await page.goto('/'); await showSequence(page); await page.waitForTimeout(180);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(150);
  await showSequence(page);
  await expect.poll(() => page.evaluate(() => (window as any).__starts.filter((s: any) => s.name.includes('window-trace')).length)).toBe(2);
  const early = await trace(page); await page.waitForTimeout(180);
  expect(await trace(page)).toBeGreaterThan(early + 10);
});

test('evidence cues animate their own visible targets rather than an offscreen figure', async ({ page }) => {
  await prepare(page); await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  const node = page.locator('.fc-exceeds .fc-node');
  await node.evaluate(n => window.scrollTo({ top: n.getBoundingClientRect().top + scrollY - innerHeight - 50, behavior: 'instant' }));
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'evidence-focus').length)).toBe(0);
  await node.evaluate(n => window.scrollTo({ top: n.getBoundingClientRect().top + scrollY - 180, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'evidence-focus').length)).toBe(1);
  const event = await page.evaluate(() => (window as any).__starts.find((s: any) => s.name === 'evidence-focus'));
  expect(event.top).toBeGreaterThan(88); expect(event.bottom).toBeLessThan(event.viewport);
  const result = page.locator('.fc-result'); await result.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => (window as any).__starts.filter((s: any) => s.name === 'evidence-rule').length)).toBe(1);
  expect(await page.locator('.fc-value').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).opacity === '1' && getComputedStyle(node).transform === 'none'))).toBe(true);
});

test('navigation fades on repeated opens and keyboard focus does not restart a link entrance', async ({ page }) => {
  await prepare(page); await page.goto('/services/');
  const menu = page.locator('[data-takeover]');
  for (let i = 0; i < 2; i++) {
    await page.locator('[data-menu-trigger]').focus(); await page.keyboard.press('Enter');
    await expect(menu.locator('.takeover-body a').first()).toBeFocused();
    const early = await menu.evaluate(node => Number(getComputedStyle(node).opacity));
    await page.waitForTimeout(100);
    const later = await menu.evaluate(node => Number(getComputedStyle(node).opacity));
    expect(later).toBeGreaterThan(early); expect(later).toBeLessThanOrEqual(1);
    await page.keyboard.press('Tab');
    expect(await menu.locator('.takeover-body li').first().evaluate(node => getComputedStyle(node).animationName)).toBe('none');
    await page.keyboard.press('Escape'); await expect(menu).toBeHidden();
  }
});

test('real browser history retains a usable selected outcome and replay', async ({ page }) => {
  await prepare(page); await page.goto('/');
  await page.locator('input[value="too-late"]').evaluate((radio: HTMLInputElement) => radio.click());
  await replay(page); await page.waitForTimeout(200);
  await page.goto('/services/'); await page.goBack(); await page.evaluate(() => document.fonts.ready);
  const checked = page.locator('.intervention-window input:checked');
  const value = await checked.inputValue();
  await expect(page.locator(`[data-window-view="${value}"]`)).toBeVisible();
  await replay(page); const early = await trace(page); await page.waitForTimeout(200);
  expect(await trace(page)).toBeGreaterThan(early + 10);
  await page.goForward(); await expect(page).toHaveURL(/\/services\/$/);
  await page.goBack(); await expect(page.locator('[data-window-replay]')).toBeVisible();
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
});

test('persisted lifecycle cleanup preserves content, preference recovery and unfinished observation', async ({ page }) => {
  await prepare(page); await page.goto('/'); await showSequence(page); await page.waitForTimeout(120);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect.poll(() => page.locator('.window-view:visible').evaluate(node => node.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-window-replay]')).toBeHidden();
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await replay(page);
  const early = await trace(page); await page.waitForTimeout(200);
  expect(await trace(page)).toBeGreaterThan(early + 10);
  await page.locator('[data-menu-trigger]').click();
  await expect(page.locator('main')).toHaveJSProperty('inert', true);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
  await expect(page.locator('[data-takeover]')).toBeHidden();
});


test('touch comparison and replay visibly progress without hover', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'Touch gestures require a touch browser context.');
  await prepare(page); await page.goto('/');
  await page.locator('.intervention-window').evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
  await page.evaluate(() => { (window as any).__pointerTypes = []; document.addEventListener('pointerdown', event => (window as any).__pointerTypes.push(event.pointerType)); });
  await page.getByRole('radio', { name: 'Too late', exact: true }).tap();
  await expect(page.getByRole('radio', { name: 'Too late', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Replay sequence' }).tap();
  const line = page.locator('.window-view:visible .window-trace');
  await expect.poll(() => line.evaluate(node => node.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
  await line.evaluate(async node => { await Promise.all(node.getAnimations().map(animation => animation.ready)); });
  const early = await trace(page); await page.waitForTimeout(160);
  expect(await trace(page)).toBeGreaterThan(early + 10);
  expect(await page.evaluate(() => (window as any).__pointerTypes.filter((type: string) => type === 'touch').length)).toBeGreaterThanOrEqual(2);
});


test('manual replay visibly advances when only part of the sequence is on screen', async ({ page }) => {
  await prepare(page); await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  await page.locator('.window-view:visible .window-sequence').evaluate(node => {
    scrollTo({ top: node.getBoundingClientRect().top + scrollY - innerHeight + 120, behavior: 'instant' });
  });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => (window as any).__starts.filter((s: any) => s.name.includes('window-trace')).length)).toBe(0);
  await page.getByRole('button', { name: 'Replay sequence' }).click();
  const line = page.locator('.window-view:visible .window-trace');
  await expect.poll(() => line.evaluate(node => node.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
  await line.evaluate(async node => { await Promise.all(node.getAnimations().map(animation => animation.ready)); });
  const early = await trace(page); await page.waitForTimeout(180);
  expect(await trace(page)).toBeGreaterThan(early + 10);
});


test('stage pulses grow and fade without moving their node or leaving a halo', async ({ page }) => {
  await prepare(page); await page.goto('/'); await replay(page);
  const samples = await page.locator('.window-view:visible .window-stage-1 .window-node').evaluate(async node => {
    const animation = node.getAnimations({ subtree: true }).find(a => (a as CSSAnimation).animationName === 'window-stage')!;
    await animation.ready;
    animation.pause();
    const duration = Number(animation.effect!.getTiming().duration);
    const sample = (time: number) => {
      animation.currentTime = time;
      const halo = getComputedStyle(node, '::after');
      const bounds = node.getBoundingClientRect();
      return {
        top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height,
        nodeOpacity: getComputedStyle(node).opacity, nodeTransform: getComputedStyle(node).transform,
        opacity: Number(halo.opacity), scale: new DOMMatrixReadOnly(halo.transform).a,
        shadow: getComputedStyle(node).boxShadow,
      };
    };
    const states = [sample(0), sample(duration * 0.45), sample(duration)];
    animation.play();
    return states;
  });
  const [start, peak, end] = samples;
  expect(peak.scale).toBeGreaterThan(start.scale);
  expect(peak.opacity).toBeGreaterThan(start.opacity);
  expect(end.opacity).toBe(0);
  for (const sample of samples) {
    expect([sample.top, sample.left, sample.width, sample.height]).toEqual([start.top, start.left, start.width, start.height]);
    expect(sample.nodeOpacity).toBe('1');
    expect(sample.nodeTransform).toBe('none');
    expect(sample.shadow).toBe('none');
  }
  await expect.poll(() => page.locator('.window-view:visible').evaluate(node => node.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
  expect(await page.locator('.window-view:visible .window-node').evaluateAll(nodes => nodes.every(node => getComputedStyle(node, '::after').opacity === '0'))).toBe(true);
});
