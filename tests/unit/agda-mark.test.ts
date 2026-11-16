import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AGDA, markAgda } from '../../src/lib/marks';

/**
 * AGDA is a registered trade mark. In readable text the name is the literal
 * string AGDA®, written once in lib/marks.ts; it reaches templates through
 * <Agda /> and strings through markAgda(). These tests fail if the
 * unregistered ™ returns, or if markup, artwork or styling is put back
 * around the inline name.
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
  it('is the literal string, with no markup of its own', () => {
    expect(AGDA).toBe('AGDA®');
    expect(readFileSync('src/components/Agda.astro', 'utf8')).not.toMatch(/<span|<img|<svg|set:html|class=|style=/);
  });

  it('writes bare and registered AGDA alike as plain text, with one ®', () => {
    expect(markAgda('AGDA® assesses')).toBe('AGDA® assesses');
    expect(markAgda('How AGDA works')).toBe('How AGDA® works');
    expect(markAgda('AGDA and AGDA® FRAUD')).toBe('AGDA® and AGDA® FRAUD');
    expect(markAgda(markAgda('AGDA'))).toBe('AGDA®');
    expect(markAgda('/agda/')).toBe('/agda/');
  });

  it('no longer carries the unregistered ™', () => {
    const offending = sources.filter((f) => /AGDA\s*(™|&trade;|\\u2122)/i.test(readFileSync(f, 'utf8')));
    expect(offending).toEqual([]);
  });

  it('has no inline mark styling or wrapper anywhere on the site', () => {
    // The email signature and the OG card generator draw standalone artwork, not site copy.
    const offending = sources
      .filter((f) => f.startsWith('src') && !f.endsWith(join('lib', 'marks.ts')))
      .filter((f) => /agda-(mark|reg|text|wordmark)\b/.test(readFileSync(f, 'utf8')));
    expect(offending).toEqual([]);
  });
});
