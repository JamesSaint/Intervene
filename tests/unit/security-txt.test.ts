import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const text = readFileSync(join(__dirname, '..', '..', 'public/.well-known/security.txt'), 'utf8');
const field = (name: string) => text.split('\n').filter((l) => l.startsWith(`${name}:`)).map((l) => l.slice(name.length + 1).trim());

describe('security.txt (RFC 9116)', () => {
  it('has the required Contact and Expires fields', () => {
    expect(field('Contact').length).toBeGreaterThan(0);
    expect(field('Expires')).toHaveLength(1);
  });

  it('points only at the published contact route over HTTPS', () => {
    for (const c of field('Contact')) expect(c).toBe('https://intervene.uk/contact/');
    expect(field('Canonical')).toEqual(['https://intervene.uk/.well-known/security.txt']);
  });

  it('has a valid Expires date no more than a year after the review', () => {
    const expires = Date.parse(field('Expires')[0]);
    expect(Number.isNaN(expires)).toBe(false);
    expect(expires).toBeLessThan(Date.parse('2027-12-31T00:00:00Z'));
  });
});
