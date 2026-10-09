/**
 * The AGDA® brand mark. AGDA is a registered UK trade mark.
 *
 * AGDA is plain text: titles, meta descriptions, JSON-LD, aria-labels.
 * AGDA_MARK is markup: the letters keep their context, the ® is set in
 * the accent by .agda-reg (global.css). In templates use <Agda />; for
 * copy held in strings, pass it through markAgda().
 */
export const AGDA = 'AGDA®';

export const AGDA_MARK = '<span class="agda-mark">AGDA<span class="agda-reg">®</span></span>';

/** Sets every AGDA in a string as the mark. A trailing ® is absorbed. */
export function markAgda(value: string): string {
  return value.replace(/AGDA®?/g, AGDA_MARK);
}
