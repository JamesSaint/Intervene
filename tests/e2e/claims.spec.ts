/**
 * Sample labelling and the claims the trust pages may and may not make.
 * This spec is the automated form of the C0 acceptance list in the
 * alignment plan and runs whether or not C0 shipped separately.
 */

import { test, expect } from '@playwright/test';

test.describe('sample verdict', () => {
  test('is labelled constructed, not issued, not signed', async ({ page }) => {
    await page.goto('/sample-report/');
    const cover = await page.locator('.cover').innerText();
    expect(cover.toLowerCase()).toContain('constructed example');
    expect(cover).toMatch(/Issued\s+No/i);
    expect(cover).toMatch(/Signed\s+No/i);
  });

  test('carries no unsupported figure, rating or score', async ({ page }) => {
    await page.goto('/sample-report/');
    const text = await page.locator('main').innerText();
    for (const banned of ['£', 'EXPOSED', 'PARTIAL', '/ 5', '108', 'disclosure threshold', 'G4', 'Stress-validated']) {
      expect(text, banned).not.toContain(banned);
    }
  });

  test('separates authority contact from quorum delay', async ({ page }) => {
    await page.goto('/sample-report/');
    const rows = page.locator('.stage-grid > li');
    await expect(rows).toHaveCount(4);
    const escalate = await rows.nth(1).innerText();
    const decide = await rows.nth(2).innerText();
    expect(escalate).toContain('4 to 96 hours');
    expect(escalate).not.toContain('7 days');
    expect(decide).toContain('7 days');
  });

  test('verification limits on the cover match the verify page', async ({ page }) => {
    await page.goto('/sample-report/');
    const text = await page.locator('.cover').innerText();
    expect(text).toMatch(/match the signed commitments associated with the stated engine version/);
    expect(text).toMatch(/does not independently establish that the engine was executed/);
    expect(text).not.toMatch(/came from a named engine/);
  });

  test('has no evidence-grade column', async ({ page }) => {
    await page.goto('/sample-report/');
    const headers = await page.locator('table th').allInnerTexts();
    expect(headers.join(' ')).not.toMatch(/Grade/);
  });
});

test.describe('validation and signing claims', () => {
  test('/methodology/ states the absence of validation evidence', async ({ page }) => {
    await page.goto('/methodology/');
    const text = await page.locator('main').innerText();
    expect(text).toContain('no outcome-validation evidence');
    expect(text).toContain('not validated against real-world outcomes');
    expect(text).not.toContain('Simulator');
    // Held for this release (plan D8b / P2): restore only with a released
    // capability or an adopted manual procedure behind it.
    expect(text).not.toMatch(/records what is measured/);
    // The sample summary rests on the quorum delay, not on the contact interval.
    expect(text).toMatch(/may exceed the assumed six-hour window, and the required quorum takes at least seven days/);
    expect(text).not.toMatch(/cannot be reached inside/);
  });

  test('/about/ offers no validation evidence and no universal signing', async ({ page }) => {
    await page.goto('/about/');
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/alongside populated-corpus/);
    expect(text).toContain('not validated against real-world outcomes');
    expect(text).toMatch(/where supplied/);
  });

  test('/network/ has four SEDI beats and no Index row', async ({ page }) => {
    await page.goto('/network/');
    const beats = await page.locator('.beats .beat-word').allInnerTexts();
    expect(beats.map((b) => b.toLowerCase())).toEqual(['detect', 'escalate', 'decide', 'intervene']);
    expect(await page.locator('main').innerText()).not.toContain('Intervention Readiness Index');
  });

  test('/verify/ states coverage, exclusions and limits', async ({ page }) => {
    await page.goto('/verify/');
    const text = await page.locator('main').innerText();
    expect(text).toMatch(/Covered by the signature/i);
    expect(text).toMatch(/Not covered by the signature/i);
    expect(text).toMatch(/report header/i);
    expect(text).toMatch(/audience layer/);
    expect(text).toMatch(/Not established by verification/i);
    expect(text).toMatch(/does not rerun the assessment engine/);
    expect(text).toMatch(/match the signed commitments associated with the stated engine version/);
    expect(text).toMatch(/does not independently establish that the engine was executed/);
    expect(text).not.toMatch(/came from a named engine/);
    expect(text).not.toMatch(/without us/);
    expect(text).not.toMatch(/Big-4/);
  });

  test('authority and issuance are stated as commitments, not as an operational role structure', async ({ page }) => {
    for (const route of ['/', '/agda/', '/services/', '/verify/']) {
      await page.goto(route);
      const text = await page.locator('main').innerText();
      expect(text, route).not.toMatch(/Assessment Lead|Technical Assessment Lead|approved assessor|Authorised Reviewer/);
      expect(text, route).not.toMatch(/reviewed for compliance with the AGDA™ methodology/);
    }
    await page.goto('/services/');
    const services = await page.locator('main').innerText();
    expect(services).toMatch(/Intervene retains Assessment Authority/);
    expect(services).toMatch(/Issuance requires approval separate from the assessor's own judgement/);
    expect(services).not.toMatch(/not issued on the assessor's own approval/);
    expect(services).not.toMatch(/does not depend on any named/);
    expect(services).toMatch(/A signed record is not by itself an issued assessment/);
  });

  test('records are not a deliverable; distribution requires an approved output-access arrangement', async ({ page }) => {
    for (const route of ['/', '/agda/', '/services/', '/methodology/', '/verify/']) {
      await page.goto(route);
      const text = await page.locator('main').innerText();
      expect(text, route).toMatch(/not a standard deliverable/);
      expect(text, route).not.toMatch(/form part of the agreed outputs|ships? with the verifier|Take the record from the supervised entity|delivered with an engagement/);
    }
    await page.goto('/services/');
    const deliverables = await page.locator('#assessment .plain').allInnerTexts();
    expect(deliverables.join(' ')).not.toMatch(/Signed SEDI/);
  });

  test('signing is conditional on every page that mentions it', async ({ page }) => {
    for (const route of ['/', '/agda/', '/services/', '/methodology/', '/intervention-readiness/', '/sample-report/']) {
      await page.goto(route);
      const text = await page.locator('main').innerText();
      if (/[Ss]igned SEDI/.test(text)) {
        expect(text, route).toMatch(/approved output-access arrangement/);
      }
      expect(text, route).not.toMatch(/Every (AGDA™ )?(SEDI )?assessment (ships|includes)/);
    }
  });
});
