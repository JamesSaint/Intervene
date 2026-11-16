/**
 * The AGDA® product name. AGDA is a registered UK trade mark.
 *
 * AGDA is the plain string, for contexts that cannot hold markup: titles,
 * meta descriptions, JSON-LD, aria-labels, llms.txt.
 *
 * AGDA_MARK is the name as it is set in readable text. The letters are plain
 * text in the surrounding typography; only the ® is wrapped, with no space
 * before it, so one rule (.agda-reg in global.css) can set it small and
 * raised. The ® still takes its colour, family and weight from its context,
 * and the name reads and copies as AGDA®. In templates use <Agda />; for copy
 * held in strings, pass it through markAgda(), which also adds a missing ®.
 * Standalone identity logos are AgdaLogo.astro.
 */
export const AGDA = 'AGDA®';

export const AGDA_MARK = 'AGDA<span class="agda-reg">®</span>';

/**
 * Sets every AGDA in a string as the mark, once. A bare AGDA gains its ®; an
 * AGDA® or an already marked name is not doubled. The result is markup, so
 * render it with set:html.
 */
export function markAgda(value: string): string {
  return value.replace(/AGDA(?:<span class="agda-reg">®<\/span>|®)?/g, AGDA_MARK);
}

export type EmailArtworkTone = 'adaptive' | 'black' | 'white';

/** One rendered image, with an optional dark source. Stripped sources cannot create duplicates. */
export function emailWordmark(brand: 'intervene' | 'agda', tone: EmailArtworkTone = 'adaptive'): string {
  const intervene = brand === 'intervene';
  const stem = intervene ? 'intervene-wordmark' : 'agda-wordmark-no-reg';
  const width = intervene ? 120 : 80;
  // Preserve the approved PNG aspect ratios (600×67 and 600×134).
  const height = intervene ? 13.4 : 17.8667;
  const versions = intervene ? { black: '1ccb487d', white: 'ccdb3219' } : { black: '2b27cc4e', white: '38f8aa6a' };
  const url = (colour: 'black' | 'white') => `https://intervene.uk/assets/brand/${stem}-${colour}-transparent.png?v=${versions[colour]}`;
  const image = `<img class="sig-logo" src="${url(tone === 'white' ? 'white' : 'black')}" width="${width}" height="${Math.round(height)}" alt="${intervene ? 'Intervene' : 'AGDA'}" style="display:inline-block;width:${width}px;height:${height}px;vertical-align:middle;border:0;" />`;
  return tone === 'adaptive' ? `<picture><source media="(prefers-color-scheme:dark)" srcset="${url('white')}">${image}</picture>` : image;
}

/** Email rendition of the approved mark, including its bronze registration symbol. */
export function markAgdaEmail(value: string, tone: EmailArtworkTone = 'adaptive'): string {
  const mark = `<span class="sig-agda" style="display:inline-block;white-space:nowrap;">${emailWordmark('agda', tone)}<span class="sig-agda-reg" style="color:#c9b694;font-size:9px;vertical-align:top;">®</span></span>`;
  return value.replace(/AGDA®?/g, mark);
}
