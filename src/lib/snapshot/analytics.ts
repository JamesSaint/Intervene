/** Consent-gated site events. Never pass form values or identifying data. */

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
  | 'insight_article_clicked'
  // Site-wide enquiry funnel. Same consent gate, same PII prohibition.
  // `enquiry_submitted` fires only on a successful response from the form
  // endpoint, never on the click. This is endpoint acceptance, not
  // confirmed inbox receipt. No field value ever travels with these.
  | 'sample_verdict_viewed'
  | 'enquiry_started'
  | 'enquiry_submitted'
  | 'primary_cta_click'
  | 'offer_view'
  | 'offer_select';

type EventParams = Record<string, string | number | boolean>;

export function hasConsent(): boolean {
  return (window as Window & {
    interveneAnalytics?: { hasConsent: () => boolean };
  }).interveneAnalytics?.hasConsent() === true;
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
