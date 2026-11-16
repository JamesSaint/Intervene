import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// These regressions exercise the overlay states that a static page audit
// cannot reach: focus recovery, banner overlap and short-screen navigation.
test('menu traps focus, closes from the keyboard and preserves existing inert states', async ({ page }) => {
  await page.goto('/services/');
  await page.evaluate(() => {
    const existing = document.createElement('div');
    existing.id = 'already-inert';
    existing.inert = true;
    document.body.append(existing);
  });
  const trigger = page.locator('[data-menu-trigger]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('dialog', { name: 'Primary navigation' });
  const links = menu.locator('.takeover-body a');
  await expect(links.first()).toBeFocused();
  await expect(page.locator('main')).toHaveJSProperty('inert', true);
  await expect(page.locator('.site-header')).toHaveJSProperty('inert', true);
  await expect(page.locator('.consent')).toHaveJSProperty('inert', true);

  const lastControl = menu.locator('[data-appearance-option="system"]');
  await links.last().focus();
  await page.keyboard.press('Tab');
  await expect(menu.locator('[data-appearance-option="light"]')).toBeFocused();
  await lastControl.focus();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link', { name: 'Intervene · home' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(lastControl).toBeFocused();
  await links.first().focus();
  await page.keyboard.press('Shift+Tab');
  await expect(menu.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
  await expect(page.locator('#already-inert')).toHaveJSProperty('inert', true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('the menu clears consent and remains usable on short screens', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 393, height: 568 },
    { width: 768, height: 568 },
    { width: 1440, height: 650 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/services/');
    await page.locator('[data-menu-trigger]').click();
    const menu = page.locator('[data-takeover]');
    await expect(menu).toHaveClass(/\bopen\b/);
    await page.waitForTimeout(900);
    const layout = await menu.evaluate((el) => {
      const links = [...el.querySelectorAll('a')];
      const close = el.querySelector('[data-menu-close]')!.getBoundingClientRect();
      return {
        overflow: el.scrollWidth > el.clientWidth + 1,
        linksClear: links.every((link) => {
          const box = link.getBoundingClientRect();
          return box.left >= 0 && box.right <= window.innerWidth + 1 && box.bottom <= window.innerHeight;
        }),
        closeWidth: close.width,
        closeHeight: close.height,
        menuIsTopSurface: el.contains(document.elementFromPoint(30, window.innerHeight - 20)),
      };
    });
    expect(layout.overflow, JSON.stringify(viewport)).toBe(false);
    expect(layout.linksClear, JSON.stringify(viewport)).toBe(true);
    expect(layout.closeWidth).toBeGreaterThanOrEqual(44);
    expect(layout.closeHeight).toBeGreaterThanOrEqual(44);
    expect(layout.menuIsTopSurface).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  }

  // A landscape phone may need to scroll the menu. The close control
  // remains available while the last destination is brought into view.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.locator('[data-menu-trigger]').click();
  const last = page.locator('.takeover-body a').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  await expect(page.locator('[data-menu-close]')).toBeInViewport();
  await page.locator('[data-menu-close]').click();
  await expect(page.locator('[data-takeover]')).toBeHidden();
});

// The appearance control sits under the eight links. On a laptop screen the
// links used to push it below the fold, so it was only found by scrolling.
for (const scheme of ['light', 'dark'] as const) {
  test(`the open menu shows every link and the whole appearance control without scrolling (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
    for (const viewport of [
      // The two sizes that failed, with the link type they must keep.
      { width: 1440, height: 900, font: '56px' },
      { width: 1280, height: 720, font: '38.4px' },
      // Sizes that already fitted.
      { width: 1920, height: 1080, font: '56px' },
      { width: 390, height: 844, font: '23px' },
    ]) {
      const at = `${viewport.width}x${viewport.height}`;
      await page.setViewportSize(viewport);
      await page.goto('/services/');
      await page.evaluate(() => document.fonts.ready);
      // Opened from the keyboard, so focus indicators are shown as a keyboard user sees them.
      await page.locator('[data-menu-trigger]').focus();
      await page.keyboard.press('Enter');
      const menu = page.locator('[data-takeover]');
      await expect(menu).toHaveClass(/\bopen\b/);
      await page.waitForTimeout(900);
      const layout = await menu.evaluate((el) => {
        const inside = (node: Element) => {
          const box = node.getBoundingClientRect();
          return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight + 0.5 && box.left >= 0 && box.right <= window.innerWidth + 0.5;
        };
        const links = [...el.querySelectorAll('.takeover-body a')];
        const control = el.querySelector('.takeover-appearance')!;
        return {
          scrolled: el.scrollTop,
          needsScroll: el.scrollHeight > el.clientHeight + 1,
          links: links.length,
          linksInside: links.every(inside),
          oneLine: links.every((link) => link.getClientRects().length === 1),
          targets: links.every((link) => link.getBoundingClientRect().height >= 48 - 0.5),
          controlInside: inside(control),
          partsInside: [...control.querySelectorAll('.appearance-label, button, [data-appearance-current]')].every(inside),
          font: getComputedStyle(links[0]).fontSize,
          weight: getComputedStyle(links[0]).fontWeight,
          lineHeight: parseFloat(getComputedStyle(links[0]).lineHeight) / parseFloat(getComputedStyle(links[0]).fontSize),
          marks: links.map((link) => link.textContent!).filter((text) => text.includes('AGDA')),
          wrapped: links.some((link) => link.children.length > 0),
        };
      });
      expect(layout.scrolled, at).toBe(0);
      expect(layout.links, at).toBe(8);
      expect(layout.linksInside, at).toBe(true);
      expect(layout.controlInside, at).toBe(true);
      expect(layout.partsInside, at).toBe(true);
      expect(layout.needsScroll, at).toBe(false);
      expect(layout.oneLine, at).toBe(true);
      expect(layout.targets, at).toBe(true);
      // The fit comes from spacing: the link type and the plain AGDA® text are as they were.
      expect(layout.font, at).toBe(viewport.font);
      expect(layout.weight, at).toBe('600');
      expect(layout.lineHeight, at).toBeCloseTo(1.15, 2);
      expect(layout.marks, at).toEqual(['AGDA®', 'How AGDA® works']);
      expect(layout.wrapped, at).toBe(false);

      // Keyboard: every control takes focus in order, in view, with a visible indicator.
      const seen: string[] = [];
      for (let i = 0; i < 12; i += 1) {
        const focus = await page.evaluate(() => {
          const node = document.activeElement as HTMLElement;
          const box = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            name: node.getAttribute('aria-label') ?? node.textContent!.trim(),
            inMenu: !!node.closest('[data-takeover]'),
            inside: box.top >= 0 && box.bottom <= window.innerHeight + 0.5,
            indicated: (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2) || style.textDecorationLine.includes('underline'),
          };
        });
        expect(focus.inMenu, `${at} ${focus.name}`).toBe(true);
        expect(focus.inside, `${at} ${focus.name}`).toBe(true);
        expect(focus.indicated, `${at} ${focus.name}`).toBe(true);
        seen.push(focus.name);
        await page.keyboard.press('Tab');
      }
      expect(seen, at).toEqual([
        'Intervention Readiness', 'Why it matters', 'AGDA®', 'How AGDA® works', 'View sample verdict',
        'Assessment options', 'Insights', 'Discuss your system', 'Light', 'Dark', 'System', 'Intervene · home',
      ]);
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
    }
  });
}

test('on a screen too short for the whole menu it scrolls, and every control stays reachable', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('intv-consent', 'denied'));
  for (const viewport of [{ width: 1280, height: 520 }, { width: 390, height: 520 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/services/');
    await page.locator('[data-menu-trigger]').click();
    const menu = page.locator('[data-takeover]');
    await expect(menu).toHaveClass(/\bopen\b/);
    expect(await menu.evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');
    expect(await menu.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    // By pointer: the control scrolls into view and works.
    const system = page.locator('.appearance-menu [data-appearance-option="system"]');
    await system.scrollIntoViewIfNeeded();
    await expect(system).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.appearance-menu [data-appearance-current]')).toBeInViewport({ ratio: 1 });
    // By keyboard: focus brings each appearance button into view, with the close control still on screen.
    await menu.evaluate((el) => el.scrollTo(0, 0));
    await page.locator('.takeover-body a').last().focus();
    for (const option of ['light', 'dark', 'system']) {
      await page.keyboard.press('Tab');
      const button = page.locator(`.appearance-menu [data-appearance-option="${option}"]`);
      await expect(button).toBeFocused();
      await expect(button).toBeInViewport({ ratio: 1 });
    }
    await expect(page.locator('[data-menu-close]')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  }
});

test('the footer can scroll clear of consent, including after resizing', async ({ page }) => {
  await page.goto('/');
  for (const width of [393, 320, 1440]) {
    await page.setViewportSize({ width, height: 568 });
    await expect(page.locator('.consent')).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => {
      const footer = document.querySelector('.trade-mark-notice')!.getBoundingClientRect();
      const banner = document.querySelector('.consent')!.getBoundingClientRect();
      return footer.bottom <= banner.top;
    })).toBe(true);
  }
});

test('reopening cookies moves focus to the choices and returns it after closing', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-consent="denied"]').click();
  await expect(page.locator('.consent')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('intv-consent'))).toBe('denied');
  const cookies = page.locator('[data-consent-reopen]');
  await cookies.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-consent="denied"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cookies).toBeFocused();
  // Reopen during the outgoing transition: an old hide callback must
  // not remove a banner that is open again.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(450);
  await expect(page.locator('.consent')).toBeVisible();
  await expect(page.locator('[data-consent="denied"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.consent')).toBeHidden();
  await expect(cookies).toBeFocused();
});

test('Accept retains readable contrast on hover', async ({ page }) => {
  await page.goto('/contact/');
  await page.locator('.consent-accept').hover();
  await page.waitForTimeout(200);
  const results = await new AxeBuilder({ page }).include('.consent').withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('a missing address returns a branded 404 with working recovery links', async ({ page, request }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found · Intervene');
  await expect(page.locator('main h1')).toHaveText('This page is unavailable.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  for (const link of await page.locator('.missing-page a').all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href!)).status()).toBe(200);
  }
  await page.locator('.missing-page .btn').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.display-xl')).toBeVisible();
});


test('technical charts keep direct labels readable and plot the stated values on their scale', async ({ page }) => {
  await page.goto('/methodology/');
  const ceiling = page.locator('.ceiling');
  await ceiling.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const values = await ceiling.evaluate((el) => {
    const plot = el.querySelector('.bars')!.getBoundingClientRect();
    return [...el.querySelectorAll('.col')].map((col) => {
      const bar = col.querySelector('.bar')!.getBoundingClientRect();
      const score = col.querySelector('.score')!;
      return {
        stated: Number(score.textContent),
        drawn: bar.height / plot.height * 5,
        scoreSize: parseFloat(getComputedStyle(score).fontSize),
        baseline: Math.abs(bar.bottom - plot.bottom),
      };
    });
  });
  expect(values.map((v) => v.stated)).toEqual([2, 3, 3.5, 4]);
  for (const value of values) {
    expect(value.drawn).toBeCloseTo(value.stated, 2);
    expect(value.baseline).toBeLessThan(1);
    expect(value.scoreSize).toBeGreaterThanOrEqual(12);
  }
  const evidence = page.locator('.ev-cap');
  await evidence.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  for (const row of await evidence.locator('.row').all()) {
    await expect(row.locator('.cap-text')).toBeVisible();
    const label = await row.locator('.cap-text').textContent();
    const ratio = await row.evaluate((el) =>
      el.querySelector('.bar')!.getBoundingClientRect().width / el.querySelector('.track')!.getBoundingClientRect().width,
    );
    expect(ratio * 5).toBeCloseTo(Number(label?.match(/confidence (\d)/)?.[1]), 2);
  }
});


test('a page-navigation anchor marks the section it actually opens', async ({ page }) => {
  await page.goto('/services/');
  await page.locator('[data-consent="denied"]').click();
  const scope = page.locator('.page-nav a[href="#scope"]');
  await scope.click();
  await expect(scope).toHaveAttribute('aria-current', 'true');
  await expect(page).toHaveURL(/#scope$/);
});

test('secondary actions retain the same transparent hover treatment in heroes and page sections', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/agda/');
  await page.locator('[data-consent="denied"]').click();
  const actions = [page.locator('.hero .btn-ghost'), page.locator('.cta-band .btn-ghost')];
  const states = [];
  for (const action of actions) {
    await action.scrollIntoViewIfNeeded();
    const normal = await action.boundingBox();
    await action.hover();
    await page.waitForTimeout(100);
    const hovered = await action.boundingBox();
    expect(hovered?.width).toBe(normal?.width);
    expect(hovered?.height).toBe(normal?.height);
    states.push(await action.evaluate((el) => {
      const style = getComputedStyle(el);
      return { background: style.backgroundColor, colour: style.color, border: style.borderColor, borderWidth: style.borderWidth };
    }));
    await page.mouse.move(0, 0);
  }
  expect(states[0]).toEqual(states[1]);
  expect(states[0].background).toBe('rgba(0, 0, 0, 0)');
  expect(states[0].borderWidth).toBe('1px');
});

test('disabled actions remain inactive when hovered', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/style-guide/');
  await page.locator('[data-consent="denied"]').click();
  const buttons = page.locator('main button:disabled');
  await expect(buttons).toHaveCount(2);
  for (const button of await buttons.all()) {
    await button.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const appearance = (el: HTMLElement | SVGElement) => {
      const style = getComputedStyle(el);
      return { background: style.backgroundColor, colour: style.color, border: style.borderColor, opacity: style.opacity };
    };
    const normal = await button.evaluate(appearance);
    await button.hover();
    await page.waitForTimeout(100);
    expect(await button.evaluate(appearance)).toEqual(normal);
    await expect(button).toBeDisabled();
  }
});

test('desktop headings fill their container and only wrap when the next word cannot fit', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop line filling is checked at desktop viewport widths.');
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/services/', '/methodology/']) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.locator('main h1').evaluate((heading) => {
        const bounds = heading.getBoundingClientRect();
        const parent = heading.parentElement!;
        const style = getComputedStyle(parent);
        const available = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const words: { right: number; top: number; width: number }[] = [];
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (const word of node.textContent!.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, word.index!);
            range.setEnd(node, word.index! + word[0].length);
            const box = range.getBoundingClientRect();
            // A phrase kept together (an inline-block run) moves to the next
            // line as one unit, so it is measured as one.
            const kept = node.parentElement !== heading && getComputedStyle(node.parentElement!).display === 'inline-block' ? node.parentElement! : null;
            const first = kept && word.index === node.textContent!.search(/\S/) && node === kept.firstChild;
            words.push({ right: box.right, top: box.top, width: first ? kept!.getBoundingClientRect().width : box.width });
          }
        }
        const earlyBreaks = words.slice(1).filter((word, index) => {
          const previous = words[index];
          const space = parseFloat(getComputedStyle(heading).fontSize) * 0.3;
          return word.top > previous.top + 2 && word.width + space < bounds.right - previous.right - 2;
        });
        // On wide screens the hero sets the heading in the left of a two-column
        // opening, as the homepage does; below that it takes the full width.
        const split = getComputedStyle(parent).display === 'grid';
        return { width: bounds.width, available: split ? parseFloat(getComputedStyle(parent).gridTemplateColumns) : available, earlyBreaks };
      });
      expect(layout.width, `${route} at ${width}px`).toBeCloseTo(layout.available, 0);
      expect(layout.earlyBreaks, `${route} at ${width}px`).toEqual([]);
    }
  }
});


test('text uses its available column width across page layouts', async ({ page, isMobile }) => {
  const routes = ['/', '/about/', '/agda/', '/services/', '/methodology/', '/intervention-readiness/',
    '/intervention-readiness/halt-authority/', '/intervention-readiness/vs-audit/', '/verify/',
    '/contact/', '/sectors/', '/network/', '/insights/coincidence-is-not-a-margin/', '/legal/privacy/'];
  for (const width of isMobile ? [320, 393] : [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const capped = await page.locator('main .lede, main .body, main .reading-content, main .hero-sub').evaluateAll(nodes => nodes.flatMap(node => {
        const element = node as HTMLElement;
        const actual = element.getBoundingClientRect().width;
        if (!actual) return [];
        const original = element.getAttribute('style');
        // Resolve the width offered by the actual grid or block, rather than
        // mistaking a sibling's column for unused space in this one.
        element.style.maxWidth = 'none';
        const available = element.getBoundingClientRect().width;
        if (original === null) element.removeAttribute('style');
        else element.setAttribute('style', original);
        return available - actual > 1 ? [{ className: element.className, actual, available }] : [];
      }));
      expect(capped, `${route} at ${width}px`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `${route} at ${width}px`).toBe(false);
    }
  }
});

test('both homepage questions share sentence case and normal heading spacing', async ({ page }) => {
  await page.goto('/');
  const reference = await page.locator('.situations .h2').evaluate((el) => {
    const style = getComputedStyle(el);
    return { tracking: parseFloat(style.letterSpacing) / parseFloat(style.fontSize), weight: style.fontWeight, family: style.fontFamily };
  });
  for (const question of [page.locator('main h1'), page.locator('.close-q')]) {
    await expect(question).toHaveText('Can you stop it in time?');
    const style = await question.evaluate((el) => {
      const css = getComputedStyle(el);
      return { tracking: parseFloat(css.letterSpacing) / parseFloat(css.fontSize), transform: css.textTransform, weight: css.fontWeight, family: css.fontFamily };
    });
    expect(style.transform).toBe('none');
    expect(style.tracking).toBeCloseTo(reference.tracking, 3);
    expect(style.weight).toBe(reference.weight);
    expect(style.family).toBe(reference.family);
  }
});
