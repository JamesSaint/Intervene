const AGDA_MARK = '<span class="agda-mark">AGDA<span class="agda-tm">™</span></span>';

export function markAgda(value: string): string {
  return value.replace(/AGDA(?:™)?/g, AGDA_MARK);
}
