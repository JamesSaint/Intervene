import { describe, expect, it } from 'vitest';
import { pageOutline } from '../../src/lib/page-outline';

describe('build-time reading navigation', () => {
  it('preserves source content while giving every repeated heading a unique target', () => {
    const source = '<p id="authority">Intro</p><h2>Authority</h2><p>Policy text &amp; conditions.</p><h2>Authority</h2>';
    const result = pageOutline(source);
    expect(result.items.map((item) => item.href)).toEqual(['#authority-2', '#authority-3']);
    expect(result.html.replace(/ id="authority-[23]"/g, '')).toBe(source);
  });
  it('keeps published anchors and extracts readable labels from inline markup', () => {
    const source = '<h2 class="h2" id="limits">Scope <em>&amp; limits</em></h2><p>Unchanged.</p>';
    const result = pageOutline(source);
    expect(result.html).toBe(source);
    expect(result.items).toEqual([{ href: '#limits', label: 'Scope & limits' }]);
  });
  it('gives numbered policy headings directly selectable targets', () => {
    expect(pageOutline('<h2>1. Website use</h2>').items[0].href).toBe('#section-1-website-use');
  });
  it('does not confuse a data attribute with a heading anchor', () => {
    expect(pageOutline('<h2 data-id="example">Terms</h2>').items).toEqual([{ href: '#terms', label: 'Terms' }]);
  });
});
