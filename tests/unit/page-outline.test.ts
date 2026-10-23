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
  it('never turns entity-encoded markup in a heading into live markup in the label', () => {
    // Labels are rendered with set:html, so decoded angle brackets must stay escaped.
    for (const heading of [
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      '&#60;img src=x onerror=alert(1)&#62;',
      '&#x3C;svg onload=alert(1)&#x3E;',
      'A &amp;lt;b&amp;gt; sequence',
    ]) {
      const [item] = pageOutline(`<h2>${heading}</h2>`).items;
      expect(item.label, heading).not.toMatch(/[<>]/);
    }
  });
  it('does not let nested fragments reassemble a tag after tags are stripped', () => {
    for (const heading of ['<<b>script>alert(1)<</b>/script>', '<<i><b>img src=x onerror=alert(1)>']) {
      const [item] = pageOutline(`<h2>${heading}</h2>`).items;
      expect(item.label, heading).not.toMatch(/[<>]/);
    }
  });
});
