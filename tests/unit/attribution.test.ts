/**
 * The attribution parameter.
 *
 * Three things are load bearing and all three are asserted here. A
 * malformed code is discarded rather than kept. The parameter is taken
 * out of the address bar either way, which is what keeps the code out
 * of the one place the recipient could read it. And nothing is written
 * to the visitor's device, so a reload loses the code.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  attributionCode,
  captureAttribution,
  isValidCode,
  resetAttributionForTest,
} from '../../src/lib/snapshot/attribution';

/**
 * A stand-in for the browser globals the module touches, and no others.
 * There is deliberately no storage stub: the module must not reach for
 * one, and this test would still pass if it did, so the assertion that
 * matters is `loses the code on a reload` below.
 */
function visit(href: string) {
  let current = href;

  globalThis.window = {
    get location() {
      return { href: current };
    },
    history: {
      state: null,
      replaceState: (_s: unknown, _t: string, url: string) => {
        current = new URL(url, 'https://intervene.uk').href;
      },
    },
  } as unknown as Window & typeof globalThis;

  return () => current;
}

beforeEach(() => resetAttributionForTest());
afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

describe('isValidCode', () => {
  it('accepts exactly eight lowercase alphanumerics', () => {
    expect(isValidCode('ffsw9hg2')).toBe(true);
    expect(isValidCode('12345678')).toBe(true);
  });

  it('rejects anything else', () => {
    for (const bad of ['', 'short', 'toolongcode', 'FFSW9HG2', 'ffsw-hg2', 'ffsw hg2', 'ffsw9hg2 ']) {
      expect(isValidCode(bad)).toBe(false);
    }
  });
});

describe('captureAttribution', () => {
  it('keeps a well-formed code and removes it from the address bar', () => {
    const href = visit('https://intervene.uk/readiness-snapshot/?p=ffsw9hg2');
    captureAttribution();
    expect(attributionCode()).toBe('ffsw9hg2');
    expect(href()).toBe('https://intervene.uk/readiness-snapshot/');
  });

  it('discards a malformed code, and still removes it from the address bar', () => {
    const href = visit('https://intervene.uk/readiness-snapshot/?p=NOT-A-CODE');
    captureAttribution();
    expect(attributionCode()).toBe('');
    expect(href()).toBe('https://intervene.uk/readiness-snapshot/');
  });

  it('leaves a visit with no code untouched', () => {
    const href = visit('https://intervene.uk/readiness-snapshot/');
    captureAttribution();
    expect(attributionCode()).toBe('');
    expect(href()).toBe('https://intervene.uk/readiness-snapshot/');
  });

  it('keeps other parameters and the fragment', () => {
    const href = visit('https://intervene.uk/readiness-snapshot/?preview=decide-tested&p=ffsw9hg2#snapshot');
    captureAttribution();
    expect(attributionCode()).toBe('ffsw9hg2');
    expect(href()).toBe('https://intervene.uk/readiness-snapshot/?preview=decide-tested#snapshot');
  });

  it('loses the code on a reload, which is the accepted Phase 0 cost', () => {
    visit('https://intervene.uk/readiness-snapshot/?p=ffsw9hg2');
    captureAttribution();
    expect(attributionCode()).toBe('ffsw9hg2');

    // A reload gives the module a fresh page and an address bar the
    // capture already cleaned, so there is nothing left to recover.
    resetAttributionForTest();
    const href = visit('https://intervene.uk/readiness-snapshot/');
    captureAttribution();
    expect(attributionCode()).toBe('');
    expect(href()).toBe('https://intervene.uk/readiness-snapshot/');
  });
});
