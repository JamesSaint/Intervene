import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AGDA, AGDA_MARK, markAgda } from '../../src/lib/marks';

/**
 * AGDA is a registered trade mark. The ® is set once, in lib/marks.ts,
 * and reaches templates through <Agda /> and strings through markAgda().
 * These tests fail if the unregistered ™ returns or the markup is
 * written by hand somewhere the shared treatment cannot reach.
 */

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const sources = ['src', 'public', 'scripts']
  .flatMap(files)
  .filter((f) => /\.(astro|ts|mjs|js|css|txt|json|md)$/.test(f));

describe('the AGDA® mark', () => {
  it('uses approved wordmark artwork, retains accessible text and accents only the ®', () => {
    expect(AGDA).toBe('AGDA®');
    expect(AGDA_MARK).toContain('src="/assets/brand/agda-small-white.svg"');
    expect(AGDA_MARK).toContain('alt="" aria-hidden="true"');
    expect(AGDA_MARK).toContain('role="img" aria-label="AGDA®"');
    expect(AGDA_MARK).toContain('<span class="agda-text">AGDA</span>');
    expect(AGDA_MARK).toContain('<span class="agda-reg">®</span>');
  });

  it('marks bare and registered AGDA alike, once', () => {
    expect(markAgda('AGDA® assesses')).toBe(`${AGDA_MARK} assesses`);
    expect(markAgda('How AGDA works')).toBe(`How ${AGDA_MARK} works`);
    expect(markAgda('/agda/')).toBe('/agda/');
  });

  it('no longer carries the unregistered ™', () => {
    const offending = sources.filter((f) => /AGDA\s*(™|&trade;|\\u2122)/i.test(readFileSync(f, 'utf8')));
    expect(offending).toEqual([]);
  });

  it('is never hand-written outside lib/marks.ts', () => {
    const offending = sources
      .filter((f) => !f.endsWith(join('lib', 'marks.ts')) && !f.endsWith('generate-og-card.mjs'))
      .filter((f) => /<span\b[^>]*class="agda-(mark|reg)"/.test(readFileSync(f, 'utf8')));
    expect(offending).toEqual([]);
  });
});
