/**
 * PHASE 1 ONLY. DELETE IN PHASE 2 with `prototype-result.ts`.
 *
 * The site builds statically, so `Astro.url.searchParams` is empty at
 * build time and a server-rendered `?preview=` selector cannot work.
 * The page therefore renders one default result, and this module swaps
 * the copy in the browser when a preview is requested.
 *
 * Reviewers reach any of the sixteen combinations with, for example:
 *   /readiness-snapshot/?preview=decide-documented
 *   /readiness-snapshot/?preview=intervene-assumed
 *
 * This reads a query parameter. It never reads the visitor's answers,
 * and must not be extended to do so.
 */

import { resolvePrototypeResult, allPreviewKeys } from './prototype-result';

export function applyPrototypePreview(): void {
  const params = new URLSearchParams(window.location.search);
  const preview = params.get('preview');
  if (!preview) return;

  const result = resolvePrototypeResult(preview);
  const section = document.querySelector<HTMLElement>('[data-snapshot-result]');
  if (!section) return;

  const setText = (selector: string, value: string) => {
    const el = section.querySelector<HTMLElement>(selector);
    if (el) el.textContent = value;
  };

  setText('[data-result-headline]', result.headline);
  setText('[data-result-strength]', result.mostConfidentText);
  setText('[data-result-confidence]', result.confidenceCommentary);
  setText('[data-result-board]', result.boardQuestion);
  setText('[data-result-test]', result.practicalTest);

  const hypothesis = section.querySelector<HTMLElement>('[data-result-hypothesis] p');
  if (hypothesis) hypothesis.textContent = result.priorityHypothesis;

  section.dataset.leastConfidentArea = result.leastConfidentArea;
  section.dataset.confidenceBasis = result.confidenceBasis;

  if (!allPreviewKeys.includes(preview)) {
    // Not an error worth surfacing to a reviewer, but worth saying so in
    // the console rather than silently showing the default.
    console.info(
      `[snapshot] Unknown preview "${preview}". Showing the default. Valid values: ${allPreviewKeys.join(', ')}`,
    );
  }
}
