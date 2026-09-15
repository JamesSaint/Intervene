import { describe, expect, it } from 'vitest';
import {
  scanRetired,
  PERMITTED_FIXTURES,
  PROHIBITED_FIXTURES,
} from '../../scripts/lib/retired-claims.mjs';

/**
 * The retired-claims scan must fail the withdrawn offers and the
 * unsupported claims, and must pass the truthful statements of absence
 * that the site is required to make. Both lists live beside the
 * patterns so a change to one is reviewed against the other.
 */

describe('retired-claims scan', () => {
  for (const fixture of PROHIBITED_FIXTURES) {
    it(`fails: ${fixture}`, () => {
      expect(scanRetired(fixture).length).toBeGreaterThan(0);
    });
  }

  for (const fixture of PERMITTED_FIXTURES) {
    it(`passes: ${fixture}`, () => {
      expect(scanRetired(fixture)).toEqual([]);
    });
  }

  it('distinguishes a statement of absence from an offer of evidence', () => {
    expect(scanRetired('There is no populated corpus and no outcome-validation evidence.')).toEqual([]);
    expect(scanRetired('outcome-validation evidence is not available')).toEqual([]);
    expect(scanRetired('supplied with populated-corpus and outcome-validation evidence').length).toBe(1);
  });

  it('does not ban the technical vocabulary the trust pages need', () => {
    const copy =
      'The Ed25519 signature is over the canonical attestation envelope. ' +
      'Repeatable computation is a separate property. The append-only registry ' +
      'ships with agda-verify. Signed SEDI result records are supplied where contracted.';
    expect(scanRetired(copy)).toEqual([]);
  });
});
