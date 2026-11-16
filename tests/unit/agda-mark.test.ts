import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AGDA, AGDA_MARK, markAgda } from '../../src/lib/marks';

/**
 * AGDA is a registered trade mark. In readable text the name is AGDA in the
 * surrounding typography with only the ® wrapped, written once in
 * lib/marks.ts; it reaches templates through <Agda /> and strings through
 * markAgda(). One rule, .agda-reg in global.css, sets the ® small and raised.
 * These tests fail if the unregistered ™ returns, if the selected values
 * drift, or if artwork, a wrapper round the whole name or a second rule is
 * put back.
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

const MARK = 'AGDA<span class="agda-reg">®</span>';
/** The marked name as it reads: the one known wrapper taken away, nothing else touched. */
const text = (html: string) => html.split('<span class="agda-reg">®</span>').join('®');

describe('the AGDA® mark', () => {
  it('wraps only the ®, with no space before it', () => {
    expect(AGDA).toBe('AGDA®');
    expect(AGDA_MARK).toBe(MARK);
    expect(text(AGDA_MARK)).toBe('AGDA®');
    const component = readFileSync('src/components/Agda.astro', 'utf8');
    expect(component).toContain('<Fragment set:html={AGDA_MARK} />');
    expect(component).not.toMatch(/<span|<img|<svg|class=|style=|role=|aria-label=/);
  });

  it('marks bare and registered AGDA alike, with one ®', () => {
    expect(markAgda('AGDA® assesses')).toBe(`${MARK} assesses`);
    expect(markAgda('How AGDA works')).toBe(`How ${MARK} works`);
    expect(markAgda('AGDA and AGDA® FRAUD')).toBe(`${MARK} and ${MARK} FRAUD`);
    expect(markAgda(markAgda('AGDA'))).toBe(MARK);
    expect(text(markAgda('How AGDA works'))).toBe('How AGDA® works');
    expect(markAgda('/agda/')).toBe('/agda/');
  });

  it('no longer carries the unregistered ™', () => {
    const offending = sources.filter((f) => /AGDA\s*(™|&trade;|\\u2122)/i.test(readFileSync(f, 'utf8')));
    expect(offending).toEqual([]);
  });

  it('sets the ® with one shared rule, at the selected values', () => {
    const css = readFileSync('src/styles/global.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...css.matchAll(/([^{}]*\.agda-reg[^{}]*)\{([^}]*)\}/g)];
    expect(rules).toHaveLength(1);
    expect(rules[0][1].trim()).toBe('.agda-reg');
    const declarations = rules[0][2].split(';').map((d) => d.trim()).filter(Boolean).sort();
    expect(declarations).toEqual(['font-size: 0.4em', 'line-height: 0', 'vertical-align: 1.3em']);
  });

  it('keeps the mark in the shared helper and the rule in the shared stylesheet', () => {
    // No hand-typed wrappers, no second rule, and none of the retired wordmark classes.
    const elsewhere = sources.filter((f) => f.startsWith('src') && !f.endsWith(join('lib', 'marks.ts')));
    expect(elsewhere.filter((f) => /agda-(mark|text|wordmark)\b/.test(read(f)))).toEqual([]);
    expect(elsewhere.filter((f) => !f.endsWith(join('styles', 'global.css')) && /(?<![\w-])agda-reg\b/.test(read(f)))).toEqual([]);
  });

  it('never puts the markup where only plain text can go', () => {
    // markAgda() returns markup: every use in a template is rendered with set:html.
    const escaped = sources
      .filter((f) => f.endsWith('.astro'))
      .filter((f) => /(?<!set:html=)\{markAgda\(/.test(read(f)));
    expect(escaped).toEqual([]);
  });
});

function read(f: string): string {
  return readFileSync(f, 'utf8');
}
