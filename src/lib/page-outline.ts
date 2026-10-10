/** Add navigable headings to trusted, rendered repository content at build time. */
export interface OutlineItem { href: string; label: string }
const plainText = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[0-9a-f]+|[0-9]+);/gi, (entity) => {
  const named: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' };
  if (named[entity]) return named[entity];
  return String.fromCodePoint(entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10));
}).replace(/\s+/g, ' ').trim();

export function pageOutline(source: string): { html: string; items: OutlineItem[] } {
  const used = new Set(Array.from(source.matchAll(/\bid="([^"]+)"/g), (match) => match[1]));
  const items: OutlineItem[] = [];
  const html = source.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (heading, attrs: string, content: string) => {
    const label = plainText(content);
    if (!label) return heading;
    const existing = attrs.match(/(?:^|\s)id="([^"]+)"/);
    let id = existing?.[1];
    if (!id) {
      const rawStem = label.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
      const stem = /^[0-9]/.test(rawStem) ? `section-${rawStem}` : rawStem;
      id = stem;
      let n = 2;
      while (used.has(id)) id = `${stem}-${n++}`;
      used.add(id);
    }
    items.push({ href: `#${id}`, label });
    return existing ? heading : `<h2${attrs} id="${id}">${content}</h2>`;
  });
  return { html, items };
}
