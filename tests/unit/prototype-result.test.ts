import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  resolvePrototypeResult,
  allPreviewKeys,
  AREAS,
  BASES,
  contrastBlock,
  disclaimer,
} from '../../src/lib/snapshot/prototype-result';

/**
 * PHASE 1 ONLY. These tests are deleted with the fixtures in Phase 2,
 * except the result-discipline ones, which move to the Worker suite.
 */

describe('prototype result', () => {
  it('covers all sixteen area and basis combinations', () => {
    expect(allPreviewKeys).toHaveLength(16);
    expect(new Set(allPreviewKeys).size).toBe(16);
  });

  it('returns complete, distinct copy for every combination', () => {
    const headlines = new Set<string>();
    const hypotheses = new Set<string>();

    for (const area of AREAS) {
      for (const basis of BASES) {
        const result = resolvePrototypeResult(`${area}-${basis}`);
        expect(result.leastConfidentArea).toBe(area);
        expect(result.confidenceBasis).toBe(basis);
        expect(result.headline.trim()).not.toBe('');
        expect(result.priorityHypothesis.trim()).not.toBe('');
        expect(result.boardQuestion.trim()).not.toBe('');
        expect(result.practicalTest.trim()).not.toBe('');
        headlines.add(result.headline);
        hypotheses.add(result.priorityHypothesis);
      }
    }

    expect(headlines.size, 'every headline must be distinct').toBe(16);
    expect(hypotheses.size, 'every hypothesis must be distinct').toBe(16);
  });

  it('never names the least confident area as the most confident', () => {
    for (const key of allPreviewKeys) {
      const result = resolvePrototypeResult(key);
      expect(result.mostConfidentArea).not.toBe(result.leastConfidentArea);
    }
  });

  it('falls back to the review default for unknown or absent previews', () => {
    for (const input of [null, '', 'nonsense', 'decide-', '-documented', 'foo-bar']) {
      const result = resolvePrototypeResult(input);
      expect(AREAS).toContain(result.leastConfidentArea);
      expect(BASES).toContain(result.confidenceBasis);
    }
  });

  it('always carries the full AGDA contrast block and disclaimer', () => {
    for (const key of allPreviewKeys) {
      const result = resolvePrototypeResult(key);
      expect(result.contrastBlock).toEqual(contrastBlock);
      expect(result.contrastBlock).toHaveLength(3);
      expect(result.disclaimer).toBe(disclaimer);
    }
  });
});

describe('result discipline', () => {
  const everyString = allPreviewKeys.flatMap((key) => {
    const r = resolvePrototypeResult(key);
    return [
      r.headline,
      r.mostConfidentText,
      r.priorityHypothesis,
      r.confidenceCommentary,
      r.boardQuestion,
      r.practicalTest,
      ...r.contrastBlock,
      r.disclaimer,
    ];
  });

  it('shows no readiness figure of any kind to the visitor', () => {
    // Permitted numerals are version strings and the ordinary numbers
    // that appear in prose, such as "three people" or "2am". What must
    // never appear is a score, a percentage or an "n out of m" grade.
    for (const text of everyString) {
      expect(text, `percentage in: ${text}`).not.toMatch(/\d+\s?%/);
      expect(text, `x out of y in: ${text}`).not.toMatch(/\b\d+\s*(?:\/|out of)\s*\d+\b/);
      expect(text, `score wording in: ${text}`).not.toMatch(/\bscored?\b/i);
    }
  });

  it('uses no assessment, grading or deficiency vocabulary', () => {
    const banned = [
      /\bpass(?:ed|es)?\b/i,
      /\bfail(?:ed|s|ure)?\b/i,
      /\bnot ready\b/i,
      /\bmaturity\b/i,
      /\bcertified\b/i,
      /\bassured\b/i,
      /\bcompliant\b/i,
      /\bweakest\b/i,
      /\bweakness\b/i,
      /\bdeficienc/i,
      /\binadequate\b/i,
      /\binsufficient\b/i,
      /\bagda (?:found|assessed)\b/i,
      /\byour organisation (?:is|cannot)\b/i,
    ];
    for (const text of everyString) {
      for (const pattern of banned) {
        expect(pattern.test(text), `"${pattern}" matched: ${text}`).toBe(false);
      }
    }
  });

  it('makes no unevidenced frequency claim', () => {
    const banned = [
      /\bmost organisations\b/i,
      /\bmost companies\b/i,
      /\btypically\b/i,
      /\busually\b/i,
      /\bin our experience\b/i,
    ];
    for (const text of everyString) {
      for (const pattern of banned) {
        expect(pattern.test(text), `"${pattern}" matched: ${text}`).toBe(false);
      }
    }
  });

  it('uses no em or en dashes', () => {
    for (const text of everyString) {
      expect(/[—–]/.test(text), `dash in: ${text}`).toBe(false);
    }
  });

  it('states plainly that this is not an AGDA assessment', () => {
    expect(disclaimer).toMatch(/not an AGDA™ assessment/);
    expect(disclaimer).toMatch(/no submitted claim has been tested against evidence/i);
    expect(disclaimer).toMatch(/proprietary/i);
  });
});

/**
 * Strips comments and string literals so structural assertions see code
 * rather than prose. The Snapshot copy legitimately contains words such
 * as "verdict" and "answers"; what must be absent is the machinery.
 */
const stripToCode = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');

describe('AGDA separation', () => {
  it('keeps ordering values out of the public repository', () => {
    // The Response Model lives only in the private Worker repository.
    // Nothing in the public Snapshot library may carry ordinals,
    // thresholds, weights or band boundaries.
    //
    // Comments and string literals are stripped first. The contrast
    // block legitimately uses the word "verdict" when describing what
    // AGDA returns, and that is visitor-facing copy, not verdict logic.
    // What this asserts is the absence of the machinery, not of the noun.
    for (const file of [
      'src/lib/snapshot/prototype-result.ts',
      'src/lib/snapshot/questions.ts',
      'src/lib/snapshot/client.ts',
      'src/lib/snapshot/prototype-preview.ts',
    ]) {
      const code = stripToCode(readFileSync(file, 'utf8'));
      expect(code, `${file} declares an ordinal map`).not.toMatch(
        /RESPONSE_ORDER_VALUE|OPTION_ORDINAL|areaValue|ordinal/i,
      );
      expect(code, `${file} implements a chain ceiling`).not.toMatch(/chain[_\s]?ceiling/i);
      expect(code, `${file} implements verdict logic`).not.toMatch(/verdict/i);
      expect(code, `${file} declares a threshold`).not.toMatch(/threshold/i);
      expect(code, `${file} declares a weighting`).not.toMatch(/\bweight/i);
    }
  });

  it('selects the prototype result from a query parameter, never from answers', () => {
    // The one property that matters most in Phase 1: no code path may
    // derive a result from what the visitor answered. Selection is by
    // explicit preview key only.
    const code = stripToCode(readFileSync('src/lib/snapshot/prototype-result.ts', 'utf8'));
    expect(code, 'reads the answer state').not.toMatch(/\banswers\b/i);
    expect(code, 'reads persisted answers').not.toMatch(/sessionStorage|localStorage/i);
  });
});
