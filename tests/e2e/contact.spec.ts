/**
 * The enquiry journey, with the endpoint mocked so nothing is sent.
 * Formspree is intercepted with page.route as snapshot.spec.ts does.
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/contact/';
const ENDPOINT = 'https://formspree.io/f/xvzwdyob';

async function fill(page: any) {
  await page.fill('#f-name', 'Test Person');
  await page.fill('#f-org', 'Test Org');
  await page.fill('#f-email', 'test@example.com');
  await page.fill('#f-role', 'CRO');
  await page.fill('#f-msg', 'Retail credit decisioning, auto-decline pathway.');
}

test.describe('contact form', () => {
  test('posts to the Formspree endpoint and nowhere else', async ({ page }) => {
    await page.goto(ROUTE);
    const form = page.locator('form[data-contact]');
    await expect(form).toHaveAttribute('action', ENDPOINT);
    await expect(form).toHaveAttribute('method', /post/i);
  });

  test('every field has a label; the message has helper text', async ({ page }) => {
    await page.goto(ROUTE);
    for (const id of ['f-name', 'f-org', 'f-email', 'f-role', 'f-msg']) {
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(page.locator('#f-msg')).toHaveAttribute('aria-describedby', 'f-msg-help');
    await expect(page.locator('#f-msg-help')).toContainText('what might require intervention');
    await expect(page.locator('fieldset.choice-set legend')).toHaveText('Starting point');
    await expect(page.locator('input[name="starting_point"][value="not-sure"]')).toBeChecked();
  });

  test('empty submit is blocked by validation and sends nothing', async ({ page }) => {
    await page.goto(ROUTE);
    let requests = 0;
    await page.route('**/formspree.io/**', async (route) => { requests += 1; await route.fulfill({ status: 200, body: '{"ok":true}' }); });
    await page.click('form[data-contact] button[type="submit"]');
    expect(requests).toBe(0);
    await expect(page.locator('#f-name')).toBeFocused();
    await expect(page.locator('.form-status')).toBeHidden();
  });

  test('valid submit posts the fields and shows success', async ({ page }) => {
    await page.goto(ROUTE);
    let body = '';
    await page.route('**/formspree.io/**', async (route) => {
      body = route.request().postData() ?? '';
      await route.fulfill({ status: 200, body: '{"ok":true}' });
    });
    await fill(page);
    await page.check('input[name="starting_point"][value="review"]');
    await page.click('form[data-contact] button[type="submit"]');
    const status = page.locator('.form-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('data-state', 'ok');
    await expect(status).toContainText('one to two working days');
    for (const name of ['name', 'organisation', 'email', 'role', 'message', 'starting_point']) {
      expect(body, name).toContain(`name="${name}"`);
    }
    expect(body).toMatch(/name="starting_point"\r?\n\r?\nreview/);
    expect(body).toMatch(/name="_gotcha"\r?\n\r?\n\r?\n/);
    await expect(page.locator('#f-name')).toHaveValue('');
    await expect(page.locator('form[data-contact] button[type="submit"]')).toHaveText('Send enquiry');
    await expect(page.locator('form[data-contact] button[type="submit"]')).toBeEnabled();
  });

  test('a failed post shows the error state and re-enables the button', async ({ page }) => {
    await page.goto(ROUTE);
    await page.route('**/formspree.io/**', async (route) => { await route.fulfill({ status: 500, body: '{}' }); });
    await fill(page);
    await page.click('form[data-contact] button[type="submit"]');
    const status = page.locator('.form-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('data-state', 'err');
    await expect(page.locator('form[data-contact] button[type="submit"]')).toBeEnabled();
    await expect(page.locator('#f-name')).toHaveValue('Test Person');
  });

  test('is reachable and submittable by keyboard', async ({ page }) => {
    await page.goto(ROUTE);
    let requests = 0;
    await page.route('**/formspree.io/**', async (route) => { requests += 1; await route.fulfill({ status: 200, body: '{"ok":true}' }); });
    await fill(page);
    await page.focus('#f-name');
    const order: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? el.id || el.getAttribute('name') || el.tagName : '';
      });
      order.push(id);
      if (id === 'BUTTON') break;
    }
    expect(order).toContain('f-msg');
    expect(order).toContain('starting_point');
    expect(order[order.length - 1]).toBe('BUTTON');
    await page.keyboard.press('Enter');
    await expect(page.locator('.form-status')).toHaveAttribute('data-state', 'ok');
    expect(requests).toBe(1);
  });

  test('status region announces', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.locator('.form-status')).toHaveAttribute('role', 'status');
  });
});
