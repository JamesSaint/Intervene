/**
 * The AGDA® brand mark. AGDA is a registered UK trade mark.
 *
 * AGDA is plain text: titles, meta descriptions, JSON-LD, aria-labels.
 * AGDA_MARK is markup: approved artwork replaces the letters, the ® is set in
 * the accent by .agda-reg (global.css). In templates use <Agda />; for
 * copy held in strings, pass it through markAgda().
 */
export const AGDA = 'AGDA®';

export const AGDA_MARK = '<span class="agda-mark" role="img" aria-label="AGDA®"><span class="agda-text">AGDA</span><img class="agda-wordmark" src="/assets/brand/agda-small-white.svg" width="1106" height="247" alt="" aria-hidden="true" /><span class="agda-reg">®</span></span>';

/** Sets every AGDA in a string as the mark. A trailing ® is absorbed. */
export function markAgda(value: string): string {
  return value.replace(/AGDA®?/g, AGDA_MARK);
}
