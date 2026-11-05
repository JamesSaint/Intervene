import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { offers, offerFaqs, PRICE_QUALIFIER, FEE_BASIS, AVAILABILITY, RECORDS_NOTE, SELF_APPROVAL } from '../../src/lib/offers';
import { terms } from '../../src/lib/terms';

/**
 * public/llms.txt is hand-mirrored from src/lib/offers.ts and
 * src/lib/terms.ts. These tests fail when the mirror drifts, so the
 * LLM-facing summary cannot describe a different offer from the pages.
 */

const llms = readFileSync('public/llms.txt', 'utf8');

describe('llms.txt mirrors the offers', () => {
  for (const o of offers) {
    it(`names ${o.name} with its price`, () => {
      expect(llms).toContain(o.name);
      expect(llms).toContain(o.price);
    });
  }

  it('carries the price qualifier, the fee basis and the availability wording', () => {
    expect(llms).toContain(PRICE_QUALIFIER);
    expect(llms).toContain(FEE_BASIS);
    expect(llms).toContain(AVAILABILITY);
    expect(llms).toContain('Neither the Authority Check nor a Review is required first');
    expect(llms).not.toMatch(/available now|accepted now|immediately available/i);
  });

  it('qualifies the four-week figure as an estimated duration once an engagement begins', () => {
    const a = offers.find((o) => o.slug === 'assessment')!;
    expect(a.timing).toMatch(/^Once an engagement begins/);
    expect(a.timing).toMatch(/estimated/);
  });

  it('mirrors the records note and the issuance requirement', () => {
    expect(llms).toContain('not a standard deliverable');
    expect(llms).toContain('approved output-access arrangement');
    expect(llms).toContain(SELF_APPROVAL);
  });

  it('states that the Review does not include the verdict', () => {
    expect(llms.toLowerCase()).toContain('does not include the agda® verdict');
  });

  it('states the Authority Check claim limits', () => {
    expect(llms).toContain('not an AGDA® verdict, SEDI result or score');
    expect(llms).toContain('carries no attestation');
    expect(llms).toContain('prepared without independent review');
    expect(llms).toContain('one test at one time');
    expect(llms).not.toMatch(/credit/i);
  });

  it('carries the canonical AGDA® definition verbatim', () => {
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

describe('the shared FAQ answers whether a Review is required first', () => {
  it('has a direct answer', () => {
    const q = offerFaqs.find((f) => /Review first/.test(f.question))!;
    expect(q.answer).toMatch(/^No\./);
    expect(q.answer).toMatch(/discuss a full AGDA® Assessment directly/);
    expect(q.answer).not.toMatch(/credit/i);
  });
});

describe('offers are internally consistent', () => {
  const by = (slug: string) => offers.find((o) => o.slug === slug)!;

  it('has exactly three current engagements, in ladder order', () => {
    expect(offers.map((o) => o.slug)).toEqual(['check', 'review', 'assessment']);
  });

  it('carries the agreed indicative prices and no retired range', () => {
    expect(by('check').price).toBe('£12,500 fixed + VAT');
    expect(by('review').price).toMatch(/£25,000 \+ VAT/);
    expect(by('assessment').price).toMatch(/£75,000 \+ VAT/);
    for (const o of offers) expect(o.price).not.toMatch(/20,000|35,000|95,000| to /);
  });

  it('the Authority Check states its limits and promises no fee credit', () => {
    const c = by('check');
    expect(c.exclusion).toMatch(/not an AGDA® verdict, SEDI result or score, and carries no attestation/);
    expect(c.exclusion).toMatch(/without independent review/);
    expect(c.exclusion).toMatch(/one test at one time/);
    expect(c.exclusion).toMatch(/not a finding about the organisation/);
    const all = JSON.stringify(offers) + JSON.stringify(offerFaqs);
    expect(all).not.toMatch(/credit|ongoing reachability|signed report|independently reviewed/i);
  });

  it('the Review says what it does not include', () => {
    expect(by('review').exclusion).toMatch(/does not include the AGDA® verdict/);
  });

  it('the Assessment lists the evidence register as a deliverable', () => {
    expect(by('assessment').receive.join(' ')).toMatch(/evidence register/);
  });

  it('signed records are not listed as a deliverable; the note states the condition', () => {
    expect(by('assessment').receive.find((r) => /Signed SEDI/.test(r))).toBeUndefined();
    expect(RECORDS_NOTE).toMatch(/not a standard deliverable/);
    expect(RECORDS_NOTE).toMatch(/approved output-access arrangement/);
  });

  it('self-approval is stated as an issuance requirement, not an operational process', () => {
    expect(SELF_APPROVAL).toBe("Issuance requires approval separate from the assessor's own judgement.");
  });
});
