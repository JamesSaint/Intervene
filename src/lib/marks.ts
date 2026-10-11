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

/** Email-safe rendition of the same mark. Both approved PNGs survive CSS stripping. */
export function markAgdaEmail(value: string): string {
  const artwork = (tone: 'black' | 'white') => `<img class="sig-logo-${tone}" src="https://intervene.uk/assets/brand/agda-wordmark-no-reg-${tone}-transparent.png" width="80" height="18" alt="AGDA" style="display:inline-block;width:80px;height:auto;vertical-align:middle;border:0;${tone === 'white' ? 'margin-left:12px;' : ''}" />`;
  const mark = `<span class="sig-agda" style="display:inline-block;white-space:nowrap;">${artwork('black')} ${artwork('white')}<span class="agda-reg" style="color:#c9b694;font-size:9px;vertical-align:top;">®</span></span>`;
  return value.replace(/AGDA®?/g, mark);
}
