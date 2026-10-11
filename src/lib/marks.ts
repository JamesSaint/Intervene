/**
 * The AGDA® brand mark. AGDA is a registered UK trade mark.
 *
 * AGDA is plain text: titles, meta descriptions, JSON-LD, aria-labels.
 * AGDA_MARK is markup: approved artwork replaces the letters, the ® is set in
 * the accent by .agda-reg (global.css). In templates use <Agda />; for
 * copy held in strings, pass it through markAgda().
 */
export const AGDA = 'AGDA®';

export const AGDA_MARK = '<span class="agda-mark" role="img" aria-label="AGDA®"><span class="agda-text">AGDA</span><img class="agda-wordmark brand-light" src="/assets/brand/agda-small-black.svg" width="1106" height="247" alt="" aria-hidden="true" /><img class="agda-wordmark brand-dark" src="/assets/brand/agda-small-white.svg" width="1106" height="247" alt="" aria-hidden="true" /><span class="agda-reg">®</span></span>';

/** Sets every AGDA in a string as the mark. A trailing ® is absorbed. */
export function markAgda(value: string): string {
  return value.replace(/AGDA®?/g, AGDA_MARK);
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
  const mark = `<span class="sig-agda" style="display:inline-block;white-space:nowrap;">${emailWordmark('agda', tone)}<span class="agda-reg" style="color:#c9b694;font-size:9px;vertical-align:top;">®</span></span>`;
  return value.replace(/AGDA®?/g, mark);
}
