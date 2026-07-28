import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/readiness-snapshot/';

/** Answers the visible screen by selecting the first option of each question. */
async function answerVisibleScreen(page: Page) {
  const screen = page.locator('[data-screen]:not([hidden])');
  const fieldsets = screen.locator('[data-question]');
  const count = await fieldsets.count();
  for (let i = 0; i < count; i += 1) {
    await fieldsets.nth(i).locator('input[type="radio"]').first().check();
  }
}

async function completeSnapshot(page: Page) {
  await page.getByRole('link', { name: 'Begin', exact: true }).click();
  for (let screen = 1; screen <= 5; screen += 1) {
    await answerVisibleScreen(page);
    const generate = page.locator('[data-snapshot-generate]:visible');
    if (await generate.count()) {
      await generate.click();
      break;
    }
    await page.locator('[data-snapshot-next]:visible').click();
  }
}

test.describe('Snapshot journey', () => {
  test('completes and shows a result without asking for contact details', async ({ page }) => {
    await page.goto(ROUTE);
    await completeSnapshot(page);

    const result = page.locator('[data-snapshot-result]');
    await expect(result).toBeVisible();
    await expect(page.locator('[data-result-headline]')).toContainText(/^\s*You (describe|expect|are not certain)\b/);
    await expect(page.locator('[data-result-strength]')).toContainText('You were most confident about');

    // The whole point: a full result with nothing identifying requested.
    await expect(page.locator('[data-followup]')).toBeHidden();
    await expect(page.locator('input[name="business_email"]')).toBeHidden();
  });

  test('moves focus to the result headline when the result appears', async ({ page }) => {
    await page.goto(ROUTE);
    await completeSnapshot(page);
    await expect(page.locator('[data-result-headline]')).toBeFocused();
  });

  test('shows the headline and hypothesis within the fold, clear of the sticky header', async ({
    page,
  }) => {
    // Acceptance criterion: both must be fully visible at 1440x900
    // without scrolling. The header is sticky, so the focus target needs
    // a scroll margin; without it the headline lands underneath it.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTE);
    await completeSnapshot(page);

    const headerBottom = await page
      .locator('.site-header')
      .evaluate((el) => el.getBoundingClientRect().bottom);

    const headline = await page
      .locator('[data-result-headline]')
      .evaluate((el) => el.getBoundingClientRect());
    const hypothesis = await page
      .locator('[data-result-hypothesis]')
      .evaluate((el) => el.getBoundingClientRect());

    expect(headline.top, 'headline is under the sticky header').toBeGreaterThanOrEqual(
      headerBottom,
    );
    expect(headline.bottom, 'headline is cut off at the fold').toBeLessThanOrEqual(900);
    expect(hypothesis.bottom, 'hypothesis is below the fold').toBeLessThanOrEqual(900);
  });

  test('shows the AGDA contrast block and the disclaimer in every result', async ({ page }) => {
    await page.goto(ROUTE);
    await completeSnapshot(page);
    await expect(page.locator('[data-snapshot-result]')).toContainText(
      'Everything above is your own answer',
    );
    await expect(page.locator('[data-result-disclaimer]')).toContainText(
      /not an AGDA™ assessment/i,
    );
  });

  test('refuses to advance with an unanswered question and explains why', async ({ page }) => {
    await page.goto(ROUTE);
    await page.getByRole('link', { name: 'Begin', exact: true }).click();
    await page.locator('[data-snapshot-next]:visible').click();

    const summary = page.locator('[data-error-summary]:visible');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(page.locator('[data-question-error]').first()).toContainText("'Not known'");
    // Still on screen one.
    await expect(page.locator('[data-screen="1"]')).toBeVisible();
  });

  test('preserves answers across a reload', async ({ page }) => {
    await page.goto(ROUTE);
    await page.getByRole('link', { name: 'Begin', exact: true }).click();
    await answerVisibleScreen(page);
    await page.locator('[data-snapshot-next]:visible').click();

    await page.reload();
    await expect(page.locator('[data-screen="2"]')).toBeVisible();
    const firstAnswered = page.locator('[data-screen="1"] input[type="radio"]:checked');
    await expect(firstAnswered).toHaveCount(2);
  });

  test('goes back without losing answers', async ({ page }) => {
    await page.goto(ROUTE);
    await page.getByRole('link', { name: 'Begin', exact: true }).click();
    await answerVisibleScreen(page);
    await page.locator('[data-snapshot-next]:visible').click();
    await page.locator('[data-snapshot-back]:visible').click();

    await expect(page.locator('[data-screen="1"]')).toBeVisible();
    await expect(page.locator('[data-screen="1"] input:checked')).toHaveCount(2);
  });
});

test.describe('preview selector', () => {
  const cases = [
    ['decide-documented', 'You describe halt authority that has never been used.'],
    ['intervene-assumed', 'You expect you can act on the system.'],
    ['detect-unknown', 'You are not certain you would know.'],
    ['escalate-tested', 'You describe an escalation path you have exercised.'],
  ] as const;

  for (const [key, expected] of cases) {
    test(`renders ${key}`, async ({ page }) => {
      await page.goto(`${ROUTE}?preview=${key}`);
      await completeSnapshot(page);
      await expect(page.locator('[data-result-headline]')).toContainText(expected);
    });
  }
});

test.describe('accessibility', () => {
  test('can be completed with the keyboard alone', async ({ page }) => {
    await page.goto(ROUTE);
    await page.getByRole('link', { name: 'Begin', exact: true }).focus();
    await page.keyboard.press('Enter');

    for (let screen = 1; screen <= 5; screen += 1) {
      const visible = page.locator('[data-screen]:not([hidden])');
      const groups = visible.locator('[data-question]');
      const count = await groups.count();
      for (let i = 0; i < count; i += 1) {
        // Arrow keys are the correct interaction for a radio group.
        await groups.nth(i).locator('input[type="radio"]').first().focus();
        await page.keyboard.press('ArrowDown');
      }
      const generate = page.locator('[data-snapshot-generate]:visible');
      if (await generate.count()) {
        await generate.focus();
        await page.keyboard.press('Enter');
        break;
      }
      const next = page.locator('[data-snapshot-next]:visible');
      await next.focus();
      await page.keyboard.press('Enter');
    }

    await expect(page.locator('[data-snapshot-result]')).toBeVisible();
  });

  test('gives every question a fieldset and a legend', async ({ page }) => {
    await page.goto(ROUTE);
    const fieldsets = page.locator('[data-question]');
    await expect(fieldsets).toHaveCount(10);
    for (let i = 0; i < 10; i += 1) {
      await expect(fieldsets.nth(i).locator('legend')).not.toBeEmpty();
    }
  });

  test('announces state changes through a live region', async ({ page }) => {
    await page.goto(ROUTE);
    const region = page.locator('[data-snapshot-announce]');
    await expect(region).toHaveAttribute('aria-live', 'polite');

    await page.getByRole('link', { name: 'Begin', exact: true }).click();
    await answerVisibleScreen(page);
    await page.locator('[data-snapshot-next]:visible').click();
    await expect(region).toContainText('Detect');
  });

  test('imposes no time limit and sets no autofocus trap', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.locator('[autofocus]')).toHaveCount(0);
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0);
  });
});

test.describe('privacy and AGDA protection', () => {
  test('transmits no answer data while the visitor is answering', async ({ page }) => {
    // The site already loads Google Fonts and fires a consent-denied GA4
    // page ping; that is pre-existing behaviour and carries no answers.
    // What must never happen is an answer value leaving the browser.
    const KNOWN_THIRD_PARTIES = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'googletagmanager.com',
      'google-analytics.com',
    ];

    // A sample of semantic option values from across the question set.
    const ANSWER_VALUES = [
      'staffed_rota_path',
      'documented_standing',
      'automated_named_team',
      'full_range',
      'tested_recent_recorded',
      'live_or_simulation_recent',
      'severe',
    ];

    const leaks: string[] = [];
    const unexpectedHosts: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      const isLocal = url.startsWith('http://localhost');
      const isKnown = KNOWN_THIRD_PARTIES.some((host) => url.includes(host));

      if (!isLocal && !isKnown) unexpectedHosts.push(url);

      const body = request.postData() ?? '';
      const haystack = `${url} ${body}`;
      for (const value of ANSWER_VALUES) {
        if (haystack.includes(value)) leaks.push(`${value} in ${url.slice(0, 120)}`);
      }
    });

    await page.goto(ROUTE);
    await completeSnapshot(page);

    expect(leaks, `answer values left the browser: ${leaks.join('; ')}`).toHaveLength(0);
    expect(
      unexpectedHosts,
      `requests to unexpected hosts: ${unexpectedHosts.join(', ')}`,
    ).toHaveLength(0);
  });

  test('sends no Snapshot analytics event without consent', async ({ page }) => {
    const events: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.includes('google-analytics.com')) return;
      const match = url.match(/[?&]en=([^&]+)/);
      if (match) events.push(decodeURIComponent(match[1]));
    });

    await page.goto(ROUTE);
    await completeSnapshot(page);

    // GA4 enhanced measurement fires its own events (page_view, scroll,
    // user_engagement) regardless, which is existing site behaviour.
    // What must not fire without consent is any Snapshot event.
    const SNAPSHOT_EVENTS = [
      'readiness_page_viewed',
      'snapshot_started',
      'snapshot_step_completed',
      'snapshot_abandoned',
      'snapshot_completed',
      'result_generated',
      'result_printed',
      'benchmark_contributed',
      'follow_up_opened',
      'email_snapshot_requested',
      'learn_agda_clicked',
      'contact_intervene_requested',
    ];

    const fired = events.filter((e) => SNAPSHOT_EVENTS.includes(e));
    expect(
      fired,
      `Snapshot events fired without consent: ${fired.join(', ')}`,
    ).toHaveLength(0);
  });

  test('is noindex and absent from the sitemap in Phase 1', async ({ page, request }) => {
    await page.goto(ROUTE);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    const sitemap = await request.get('/sitemap-0.xml');
    expect(await sitemap.text()).not.toContain('readiness-snapshot');
  });

  test('ships no ordering values, thresholds or bands to the browser', async ({ page }) => {
    await page.goto(ROUTE);
    const scripts = await page.evaluate(async () => {
      const urls = Array.from(document.querySelectorAll('script[src]')).map(
        (s) => (s as HTMLScriptElement).src,
      );
      const bodies = await Promise.all(
        urls
          .filter((u) => u.includes('/_astro/'))
          .map((u) => fetch(u).then((r) => r.text())),
      );
      return bodies.join('\n');
    });

    for (const term of ['RESPONSE_ORDER_VALUE', 'chainCeiling', 'threshold', 'areaValue']) {
      expect(scripts.toLowerCase(), `bundle contains "${term}"`).not.toContain(
        term.toLowerCase(),
      );
    }
  });

  test('collects nothing in the prototype: follow-up and benchmark are inert', async ({ page }) => {
    await page.goto(ROUTE);
    await completeSnapshot(page);

    await expect(page.locator('[data-benchmark-submit]')).toBeDisabled();
    await expect(page.locator('[data-benchmark-consent]')).toBeDisabled();

    await page.locator('[data-action-open="email_snapshot_and_sample"]').click();
    await expect(page.locator('[data-followup]')).toBeVisible();
    await expect(page.locator('[data-followup-submit]')).toBeDisabled();
    await expect(page.locator('input[name="business_email"]')).toBeDisabled();
  });
});
