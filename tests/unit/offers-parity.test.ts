import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { offers, PRICE_QUALIFIER } from '../../src/lib/offers';
import { terms } from '../../src/lib/terms';

/**
 * public/llms.txt is hand-mirrored from src/lib/offers.ts and
 * src/lib/terms.ts. These tests fail when the mirror drifts, so the
 * LLM-facing summary cannot describe a different offer from the pages.
 */

const llms = readFileSync('public/llms.txt', 'utf8');

describe('llms.txt mirrors the offers', () => {
  for (const o of offers) {
    it(`names ${o.name} with its range`, () => {
      expect(llms).toContain(o.name);
      expect(llms).toContain(o.price);
    });
  }

  it('carries the price qualifier', () => {
    expect(llms).toContain(PRICE_QUALIFIER);
  });

  it('states that the Review does not include the verdict', () => {
    expect(llms.toLowerCase()).toContain('does not include the agda™ verdict');
  });

  it('carries the canonical AGDA™ definition verbatim', () => {
    const agda = terms.find((t) => t.slug === 'agda')!;
    expect(llms).toContain(agda.definition);
  });

  it('carries every glossary definition verbatim', () => {
    for (const t of terms) {
      expect(llms, t.name).toContain(t.definition);
    }
  });

  it('does not list the withdrawn Snapshot as a core page', () => {
    expect(llms).not.toContain('/readiness-snapshot/');
  });
});

describe('offers are internally consistent', () => {
  it('has exactly two current engagements', () => {
    expect(offers.map((o) => o.slug)).toEqual(['review', 'assessment']);
  });

  it('the Review says what it does not include', () => {
    expect(offers[0].exclusion).toMatch(/does not include the AGDA™ verdict/);
  });

  it('the Assessment lists the evidence register as a deliverable', () => {
    expect(offers[1].receive.join(' ')).toMatch(/evidence register/);
  });

  it('signed records are conditional, never standard', () => {
    const signed = offers[1].receive.find((r) => /Signed SEDI/.test(r))!;
    expect(signed).toMatch(/where the agreed scope includes them and the delivery configuration supports them/);
  });
});
