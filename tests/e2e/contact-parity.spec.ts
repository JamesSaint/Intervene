import { test, expect } from '@playwright/test';

/**
 * The contact form is the only working form on the site. Its styles were
 * lifted out of the page and into src/styles/forms.css so the Snapshot
 * does not duplicate them. This asserts the extraction changed nothing
 * a visitor can see.
 *
 * One deliberate exception, called out in the plan: focus indication.
 * The page previously removed the outline and signalled focus with a
 * border colour change alone, which fails WCAG 2.4.7. A visible ring
 * has been added. That is a fix, not a regression.
 */

const PAPER = 'rgb(10, 10, 10)';
const HAIR_STRONG = 'rgba(201, 182, 148, 0.3)';
const INK = 'rgb(240, 240, 240)';

test.describe('contact form parity after CSS extraction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
  });

  test('text inputs keep their original treatment', async ({ page }) => {
    const input = page.locator('#f-name');
    const styles = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize,
        color: s.color,
        backgroundColor: s.backgroundColor,
        borderBottomWidth: s.borderBottomWidth,
        borderBottomStyle: s.borderBottomStyle,
        borderBottomColor: s.borderBottomColor,
        borderTopWidth: s.borderTopWidth,
        borderRadius: s.borderTopLeftRadius,
        paddingTop: s.paddingTop,
        paddingLeft: s.paddingLeft,
      };
    });

    expect(styles.fontSize).toBe('16px');
    expect(styles.color).toBe(INK);
    expect(styles.backgroundColor).toBe(PAPER);
    expect(styles.borderBottomWidth).toBe('1px');
    expect(styles.borderBottomStyle).toBe('solid');
    expect(styles.borderBottomColor).toBe(HAIR_STRONG);
    expect(styles.borderTopWidth).toBe('0px');
    expect(styles.borderRadius).toBe('0px');
    expect(styles.paddingTop).toBe('10px');
    expect(styles.paddingLeft).toBe('0px');
  });

  test('labels keep the mono uppercase treatment', async ({ page }) => {
    const styles = await page
      .locator('label[for="f-name"]')
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          fontSize: s.fontSize,
          textTransform: s.textTransform,
          letterSpacing: s.letterSpacing,
          fontFamily: s.fontFamily,
        };
      });

    expect(styles.fontSize).toBe('11px');
    expect(styles.textTransform).toBe('uppercase');
    expect(styles.letterSpacing).toBe('0.44px');
    expect(styles.fontFamily).toContain('JetBrains Mono');
  });

  test('the textarea keeps its minimum height and vertical resize', async ({ page }) => {
    const styles = await page.locator('#f-msg').evaluate((el) => {
      const s = getComputedStyle(el);
      return { minHeight: s.minHeight, resize: s.resize, lineHeight: s.lineHeight };
    });
    expect(styles.minHeight).toBe('120px');
    expect(styles.resize).toBe('vertical');
  });

  test('the honeypot stays off screen', async ({ page }) => {
    const box = await page.locator('input[name="_gotcha"]').boundingBox();
    expect(box === null || box.x < 0).toBe(true);
  });

  test('the submit row keeps its rule and spacing', async ({ page }) => {
    const styles = await page.locator('.submit-row').evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        display: s.display,
        justifyContent: s.justifyContent,
        borderTopWidth: s.borderTopWidth,
        paddingTop: s.paddingTop,
      };
    });
    expect(styles.display).toBe('flex');
    expect(styles.justifyContent).toBe('space-between');
    expect(styles.borderTopWidth).toBe('1px');
    expect(styles.paddingTop).toBe('24px');
  });

  test('the form still posts to Formspree and is otherwise untouched', async ({ page }) => {
    const form = page.locator('form.form[data-contact]');
    await expect(form).toHaveAttribute('action', 'https://formspree.io/f/xvzwdyob');
    await expect(form).toHaveAttribute('method', 'POST');
    await expect(form).toHaveAttribute('novalidate', '');
  });

  test('inputs now show a visible focus ring, which they did not before', async ({ page }) => {
    const input = page.locator('#f-name');
    await input.focus();
    const outlineWidth = await input.evaluate(
      (el) => getComputedStyle(el).outlineWidth,
    );
    expect(outlineWidth).not.toBe('0px');
  });
});
