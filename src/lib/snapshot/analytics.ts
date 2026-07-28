/**
 * Consent-gated analytics for the Snapshot.
 *
 * Every call is a no-op unless the visitor has accepted analytics via
 * the existing consent banner, which stores `granted` under the
 * `intv-consent` key. Consent Mode v2 would already suppress storage,
 * but suppressing the event entirely is the stated requirement.
 *
 * What must never be passed through here: names, email addresses,
 * organisation names, complete answer sets, free text, or full result
 * payloads. The only result data permitted is `least_confident_area`
 * and `confidence_basis`, both categorical and non-identifying.
 */

const CONSENT_KEY = 'intv-consent';

type EventName =
  | 'readiness_page_viewed'
  | 'snapshot_started'
  | 'snapshot_step_completed'
  | 'snapshot_abandoned'
  | 'snapshot_completed'
  | 'result_generated'
  | 'result_printed'
  | 'benchmark_contributed'
  | 'follow_up_opened'
  | 'email_snapshot_requested'
  | 'learn_agda_clicked'
  | 'contact_intervene_requested'
  | 'methodology_page_clicked'
  | 'insight_article_clicked';

type EventParams = Record<string, string | number | boolean>;

function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function track(name: EventName, params: EventParams = {}): void {
  if (!hasConsent()) return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  try {
    gtag('event', name, params);
  } catch {
    /* analytics must never break the flow */
  }
}
