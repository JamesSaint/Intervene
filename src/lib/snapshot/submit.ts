/**
 * Snapshot submissions.
 *
 * Phase 1 has no backend, so both submissions relay through the same
 * Formspree endpoint the contact form already uses. That is a
 * deliberate interim choice: it makes the page functional today
 * without standing up a Worker, and it adds no processor that the
 * privacy notice does not already name.
 *
 * TWO SUBMISSIONS, DELIBERATELY SEPARATE.
 *
 * `submitFollowUp` carries identity: a name, a work email address, and
 * optionally an organisation and role. It also carries a short summary
 * of the result so the reply can be about something specific.
 *
 * `submitIndexContribution` carries no identity at all. It sends the
 * ten answer values and the version strings, and nothing else. There is
 * no name, no email address, no organisation, no role, and no free
 * text, because the question set no longer asks for any of them.
 *
 * WHAT THIS ARRANGEMENT CANNOT CLAIM.
 *
 * Formspree relays to a mailbox. Both submissions therefore arrive in
 * the same inbox, so the operator could correlate two messages by their
 * timestamps. The strong unlinkability the plan describes needs the
 * Worker, a buffered write and a separate database, none of which exist
 * yet. The consent copy and the privacy notice are written to match
 * what this actually does rather than what Phase 3 will do.
 *
 * Answer values are sent raw rather than bucketed. Bucketing would mean
 * shipping ordinal values to the browser, which is exactly what must
 * not happen. The raw values are semantic identifiers and carry no
 * organisational detail.
 */

/** The same endpoint as /contact/. Declared once, here. */
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzwdyob';

export interface SubmitResult {
  ok: boolean;
}

async function post(fields: Record<string, string>): Promise<SubmitResult> {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== '' && value != null) body.append(key, value);
  }

  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body,
  });

  return { ok: res.ok };
}

export interface FollowUpFields {
  name: string;
  business_email: string;
  organisation?: string;
  role_title?: string;
  requested_action: string;
  least_confident_area: string;
  confidence_basis: string;
  headline: string;
  question_set_version: string;
  copy_version: string;
}

export function submitFollowUp(fields: FollowUpFields): Promise<SubmitResult> {
  return post({
    _subject: `Snapshot: ${fields.requested_action}`,
    form: 'readiness-snapshot-follow-up',
    name: fields.name,
    email: fields.business_email,
    organisation: fields.organisation ?? '',
    role: fields.role_title ?? '',
    requested_action: fields.requested_action,
    result_area: fields.least_confident_area,
    result_basis: fields.confidence_basis,
    result_headline: fields.headline,
    question_set: fields.question_set_version,
    copy_version: fields.copy_version,
  });
}

export interface IndexContributionFields {
  answers: Record<string, string>;
  question_set_version: string;
  copy_version: string;
}

export function submitIndexContribution(
  fields: IndexContributionFields,
): Promise<SubmitResult> {
  // Answers only. Assert the absence of identity rather than trusting
  // the caller: anything not a known answer key is dropped.
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields.answers)) {
    if (/^q\d{2}_[a-z_]+$/.test(key)) answers[key] = value;
  }

  return post({
    _subject: 'Intervention Readiness Index contribution',
    form: 'intervention-readiness-index',
    ...answers,
    question_set: fields.question_set_version,
    copy_version: fields.copy_version,
  });
}
