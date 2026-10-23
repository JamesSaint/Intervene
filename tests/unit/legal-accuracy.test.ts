import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const legal = ['privacy', 'gdpr'].map((n) => readFileSync(join(root, `src/pages/legal/${n}.astro`), 'utf8'));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sources(full);
    return /\.(astro|ts|mjs|css|html)$/.test(entry) ? [readFileSync(full, 'utf8')] : [];
  });
}

describe('legal copy matches the third parties the site contacts', () => {
  const code = [...sources(join(root, 'src')), ...sources(join(root, 'public'))].join('\n');

  it('names Google Fonts only if the site actually requests it', () => {
    const requestsGoogleFonts = /fonts\.(googleapis|gstatic)\.com/.test(code);
    for (const page of legal) {
      expect(/Google Fonts/i.test(page)).toBe(requestsGoogleFonts);
    }
  });

  it('discloses GitHub Pages hosting in both notices', () => {
    for (const page of legal) expect(page).toMatch(/GitHub/);
  });

  it('still names the processors the code contacts', () => {
    expect(code).toMatch(/formspree\.io/);
    expect(code).toMatch(/googletagmanager\.com/);
    for (const page of legal) expect(page).toMatch(/Formspree/);
  });

  const [privacy, gdpr] = legal;
  const contact = readFileSync(join(root, 'src/pages/contact/index.astro'), 'utf8');

  it('names the email host and every browser-storage item the code writes', () => {
    for (const page of legal) expect(page).toMatch(/GoDaddy/);
    expect(code).toMatch(/'intervene:appearance'/);
    expect(privacy).toContain('intervene:appearance');
    expect(code).toMatch(/'intv-consent'/);
  });

  it('does not claim consent is never transmitted, or describe a truncated IP', () => {
    expect(privacy).not.toMatch(/never sent anywhere/i);
    expect(privacy).not.toMatch(/truncated IP/i);
    expect(privacy).toMatch(/If you decline, nothing is sent to Google/);
    // The code really does pass a consent state to Google when analytics is accepted.
    expect(code).toMatch(/consent', 'update', \{ analytics_storage: 'granted'/);
  });

  it('does not state a retention period for processors it has not verified', () => {
    for (const page of [privacy, gdpr]) expect(page).toMatch(/not\s+independently\s+verified/);
  });

  it('keeps contact-page confidentiality wording measured and consistent with the notice', () => {
    expect(contact).not.toMatch(/off record|strict confidence|absolute|privileged/i);
    expect(contact).toMatch(/Formspree/);
    expect(contact).toMatch(/discreetly/);
  });

  it('terms do not promise that correspondence will never be shared', () => {
    const terms = readFileSync(join(root, 'src/pages/legal/terms.astro'), 'utf8');
    expect(terms).not.toMatch(/will not be\s+shared/i);
    expect(terms).toMatch(/service\s+providers/);
    expect(terms).toMatch(/law,\s+a\s+court\s+or\s+a\s+regulator/);
    expect(terms).toMatch(/cannot\s+guarantee/);
    expect(terms).toMatch(/\/legal\/privacy\//);
  });
});
