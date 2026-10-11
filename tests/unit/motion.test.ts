import { describe, expect, it } from 'vitest';
import { motionDuration } from '../../src/lib/motion';

describe('the CSS motion clock survives production unit normalisation', () => {
  it.each([
    ['480ms', 480], ['.48s', 480], ['1.3s', 1300],
    ['0ms', 0], [' 0.22s ', 220], ['160ms', 160],
  ])('reads %s as %i milliseconds', (value, expected) => {
    expect(motionDuration(value, 560)).toBe(expected);
  });
  it.each(['', 'auto', 'NaNms', '-1s', 'infinite', '1300'])('uses a bounded fallback for %s', value => {
    expect(motionDuration(value, 560)).toBe(560);
  });
});
