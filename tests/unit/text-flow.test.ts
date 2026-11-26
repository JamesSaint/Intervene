import { describe, it, expect } from 'vitest';
import { scanTextFlow, scanRepository } from '../../scripts/check-text-flow.mjs';

const rules = (source: string) => scanTextFlow(source).map((f: { rule: string }) => f.rule);

describe('text-flow guard', () => {
  it('the repository has no unjustified text-flow restriction', () => {
    expect(scanRepository()).toEqual([]);
  });

  it('rejects balanced and pretty wrapping', () => {
    expect(rules('.h1 { text-wrap: balance; }')).toEqual(['balanced or pretty text-wrap']);
    expect(rules('p { text-wrap: pretty }')).toEqual(['balanced or pretty text-wrap']);
    expect(rules('p { text-wrap-style: balance; }')).toEqual(['balanced or pretty text-wrap']);
    expect(rules('p { text-wrap: wrap; }')).toEqual([]);
  });

  it('rejects character measures and fixed caps on width', () => {
    expect(rules('.x { max-width: 62ch; }')).toEqual(['character-based max-width']);
    expect(rules('.x { width: 40ch; }')).toEqual(['character-based width']);
    expect(rules('.x { max-width: 40rem; }')).toEqual(['fixed max-width (40rem)']);
    expect(rules('.x { max-inline-size: 520px; }')).toEqual(['fixed max-inline-size (520px)']);
  });

  it('allows widths that never narrow text below its column', () => {
    for (const value of ['none', '100%', 'var(--max)', 'var(--measure-body)', 'var(--measure-lede)', 'none !important']) {
      expect(rules(`.x { max-width: ${value}; }`), value).toEqual([]);
    }
    expect(rules('.x { min-width: 0; width: 100%; }')).toEqual([]);
  });

  it('ignores breakpoints in media queries and media attributes', () => {
    expect(rules('@media (max-width: 720px) { .x { display: block; } }')).toEqual([]);
    expect(rules('<source media="(max-width: 360px)" srcset="a.svg" />')).toEqual([]);
  });

  it('rejects a reading measure built from grid tracks', () => {
    expect(rules('.w { grid-template-columns: minmax(0, 52rem); }')).toEqual(['text measure in grid tracks']);
    expect(rules('.w { grid-template-columns: minmax(0, calc(var(--type-support) * 40)) 1fr; }')).toEqual(['text measure in grid tracks']);
    expect(rules('.w { grid-template-columns: 40ch 1fr; }')).toContain('text measure in grid tracks');
    expect(rules('.w { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }')).toEqual([]);
    expect(rules('.w { grid-template-columns: var(--spec-col) minmax(0, 1fr); }')).toEqual([]);
  });

  it('rejects manual line breaks in templates', () => {
    expect(rules('<h2>Can you stop it<br />in time?</h2>')).toEqual(['manual line break']);
    expect(rules('<p>One<br>two</p>')).toEqual(['manual line break']);
  });

  it('accepts a restriction with a written reason on the same line', () => {
    expect(rules('.d { max-width: 640px; } /* text-flow-exception: dial face has a largest drawn size */')).toEqual([]);
    expect(rules('<span>A<br />B</span>{/* text-flow-exception: diagram terminal label */}')).toEqual([]);
  });

  it('does not accept an exception without a reason', () => {
    expect(rules('.d { max-width: 640px; } /* text-flow-exception: */')).toEqual(['fixed max-width (640px)']);
  });
});
