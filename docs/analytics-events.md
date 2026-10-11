# Commercial measurement

11 October 2026. These events describe visitor actions and endpoint responses. The primary commercial outcome is a qualified enquiry received in the intended inbox, followed by a qualified opportunity and a paid assessment.

## Event contract

Every custom event passes through `src/lib/snapshot/analytics.ts`. No event is sent without current affirmative analytics consent. Names, email addresses, organisation names, free text, answers and assessment payloads are prohibited. Page paths come from canonical metadata; query strings and fragments are excluded from analytics page locations and referrers. Google enhanced measurement can also inspect the browser query directly, so after consent the tag waits for page modules to read functional parameters, then removes the query string before loading. Document anchors remain available. Uncontrolled UTM query attribution is consequently not retained; any future campaign identifiers need a deliberate non-personal allowlist.

| Event | Trigger | Parameters | Deduplication and meaning |
| --- | --- | --- | --- |
| `primary_cta_click` | Activation of an annotated primary contact link in the header or page content | `cta_id=discuss_system`, `page_path` of source, `placement=header/main` | One event per activation. A normal same-tab click is recorded on contact-page arrival; other clicks are recorded at source. It is an interaction, not an enquiry. |
| `offer_view` | At least 50% of the offering caption or full-engagement heading is visible for one continuous second, in a visible tab with consent | `page_path`, `offer_section=offer_choice/engagements` | At most once per page load, whichever eligible offering marker is seen first. Does not demonstrate that both offers were read. |
| `offer_select` | Activation of a Review/Assessment sheet link, or a change to the corresponding contact-form radio choice | `page_path`, `offer_id=review/assessment`, `selection_source=offer_link/contact_choice` | One event per deliberate selection. The default “Not sure yet” choice and automatic resets emit nothing. |
| `sample_verdict_viewed` | Sample page is loaded with consent, or consent is accepted while it is open | None | Once per page load. Preserves the existing event name. |
| `enquiry_started` | First contact-form input while consent is granted | None | Once per form page load. Input before consent is not replayed; subsequent input after acceptance can trigger it. |
| `enquiry_submitted` | The form endpoint returns an HTTP success response | None | Once per successful response. No event for validation failure, spam trap, failed HTTP response or network failure. This establishes browser handling of endpoint acceptance, not notification delivery or inbox receipt. |

The existing withdrawn Snapshot events retain their names and use the same consent gate. This change does not restore its commercial funnel or alter its result logic.

## Navigation and consent

The real GA4 tag batches events. A source-page CTA event was lost during immediate navigation, including with a short callback timeout. A single-use `intv-pending-cta` session item therefore carries only the three fixed CTA categories to `/contact/`. The destination removes it before reading, checks consent and the same-origin source referrer, and emits it once. Rejection removes any pending item. No extra cookie or persistent local-storage item is added. Storage or referrer restrictions can still reduce measurement; analytics is never a prerequisite for navigation or enquiry submission.

`intv-consent` retains the existing `granted` and `denied` values. With no affirmative choice, the Google script is absent and no Google collection request is initiated. Acceptance queues consent defaults, grants analytics storage, configures GA4 once and loads the tag. Advertising consent remains denied and Google signals and advertising personalisation are disabled. Withdrawal sets Google's disable flag, clears GA cookies and the pending CTA, and reloads to remove the loaded runtime. The reload can clear an unsent form. This is a disclosed implementation trade-off, not a new form-storage mechanism.

## Account actions

In GA4, use Admin → Data display → Custom definitions to register event-scoped dimensions for `cta_id`, `placement`, `page_path`, `offer_id`, `selection_source` and `offer_section` where reporting needs them. Verify the events in Realtime or DebugView after authorised deployment. Browser generation does not prove that the intended property processes them correctly.

Review Enhanced measurement → Form interactions on the web stream. The real tag currently generated `form_start` during the intercepted test. Its generic form events describe interaction or submission attempts, whereas `enquiry_submitted` describes an HTTP success response. Disable generic form interactions if they confuse reporting, and never treat `form_submit` as a received qualified enquiry. No account setting was changed. [Google's enhanced-measurement event definitions](https://support.google.com/analytics/answer/9216061?hl=en).

CTA clicks, offering visibility and option choices should remain engagement indicators. If `enquiry_submitted` is marked as a GA4 key event, label it as endpoint acceptance. Keep inbox receipt, qualification, opportunity and paid assessment as separate operational records outside analytics; do not upload enquiry personal data to GA4.

## Measurement baseline

Review discovery and the funnel monthly, using comparable complete periods. Retain consent coverage as a limitation rather than extrapolating unconsented visitors.

| Stage | Source and useful breakdown | Current baseline |
| --- | --- | --- |
| Organic discovery | Google Search Console and Bing: indexed canonical pages, impressions, clicks, CTR, queries and landing pages; separate branded from relevant non-branded terms | Account access unavailable; values unverified |
| AI referrals | GA4 referral source/medium and landing page; keep ChatGPT, Perplexity and other identifiable AI referrers separate from ordinary search | Account access unavailable; values unverified |
| AI citations | Record the system, date, exact query and cited canonical URL when directly observed | None verified in this audit; this is not evidence of zero citations |
| Commercial engagement | The events above, by landing page and source where consented data is available | Implementation verified locally; production reporting pending |
| Received and qualified enquiries | Intended inbox plus an operational enquiry record, counting receipt, fit, agreed next step and known source separately | No inbox or pipeline access; values unverified |
| Opportunities and paid work | Commercial records with proposal, acceptance and paid-assessment status kept distinct | No commercial-record access; values unverified |

AI answers can produce no referral click. Branded searches and unattributed visits do not prove AI discovery. Visibility does not establish demand, and a signed contract does not establish payment.
