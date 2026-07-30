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

/**
 * A dedicated form for Index contributions, when one exists.
 *
 * The shared form above is configured to require an email address, so a
 * contribution carrying no identity is rejected with
 * `422 REQUIRED_FIELD_MISSING: email`. Until a second form exists, the
 * contribution sends the routing marker below to satisfy that rule.
 *
 * Set this to the second form's endpoint and the marker disappears.
 */
export const INDEX_ENDPOINT: string | null = null;

/**
 * A fixed routing marker, not a person.
 *
 * It is byte-for-byte identical on every contribution, so it carries no
 * information about who submitted one. It exists only because the
 * shared Formspree form demands an email field. It is not the visitor's
 * address, and the visitor is never asked for one on this path.
 *
 * This is a workaround, and the proper fix is a dedicated form. A
 * dedicated form would also improve the privacy position: contributions
 * would stop arriving in the same mailbox as enquiries, which is the
 * correlation risk the privacy notice currently has to admit to.
 */
const INDEX_ROUTING_MARKER = 'index@intervene.uk';

export interface SubmitResult {
  ok: boolean;
}

async function post(
  fields: Record<string, string>,
  endpoint: string = FORMSPREE_ENDPOINT,
): Promise<SubmitResult> {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== '' && value != null) body.append(key, value);
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
    });
    return { ok: res.ok };
  } catch {
    // A blocked network, a proxy or an offline tab. The caller shows the
    // failure rather than a false confirmation.
    return { ok: false };
  }
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

  return post(
    {
      _subject: 'Intervention Readiness Index contribution',
      form: 'intervention-readiness-index',
      // Only present while sharing the contact form, which requires an
      // email field. Constant on every contribution, so it identifies
      // nobody. Drops away once INDEX_ENDPOINT is set.
      ...(INDEX_ENDPOINT ? {} : { email: INDEX_ROUTING_MARKER }),
      ...answers,
      question_set: fields.question_set_version,
      copy_version: fields.copy_version,
    },
    INDEX_ENDPOINT ?? FORMSPREE_ENDPOINT,
  );
}
