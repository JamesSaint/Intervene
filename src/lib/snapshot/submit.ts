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

/**
 * Formspree renders each field key as the label and each value verbatim,
 * in insertion order. So the notification email is entirely determined
 * by what is assembled here.
 *
 * The first version sent internal identifiers as labels and slugs as
 * values: "result_area: decide", "requested_action: contact_intervene",
 * "copy_version: copy-3.0". Correct, and unreadable. Someone triaging
 * an enquiry between meetings should not be decoding identifiers.
 *
 * Keys are therefore written as English labels, values are mapped to
 * English, and the order runs from what the person wants down to the
 * detail behind it.
 */

const ACTION_LABEL: Record<string, string> = {
  contact_intervene: 'A conversation about testing one of these assumptions',
  email_snapshot_and_sample: 'Their Snapshot by email, with the sample verdict',
};

const AREA_LABEL: Record<string, string> = {
  detect: 'Detect. Would they know',
  escalate: 'Escalate. Would it reach anyone who can act',
  decide: 'Decide. Could anyone authorise it',
  intervene: 'Intervene. Would the action work',
};

const BASIS_LABEL: Record<string, string> = {
  tested: 'Exercised under realistic conditions, with evidence kept',
  documented: 'Written down, but not realistically tested',
  assumed: 'Policy, design intent or vendor assurance',
  unknown: 'They are not certain',
};

const SYSTEMS_LABEL: Record<string, string> = {
  none: 'None yet',
  '1_3': 'One to three',
  '4_10': 'Four to ten',
  '11_50': 'Eleven to fifty',
  '50_plus': 'More than fifty',
  not_known: 'Not known',
};

const CRITICALITY_LABEL: Record<string, string> = {
  contained: 'Awkward internally. Nobody outside notices',
  noticeable: 'Customers feel it, but recoverable',
  serious: 'Material financial, safety or service harm',
  severe: 'Harm that could not be undone',
  not_known: 'Not known',
};

const label = (map: Record<string, string>, key: string) => map[key] ?? key;

export interface FollowUpFields {
  name: string;
  business_email: string;
  organisation?: string;
  role_title?: string;
  requested_action: string;
  least_confident_area: string;
  confidence_basis: string;
  headline: string;
  systems?: string;
  criticality?: string;
  question_set_version: string;
  copy_version: string;
}

export function submitFollowUp(fields: FollowUpFields): Promise<SubmitResult> {
  const who = fields.organisation
    ? `${fields.name}, ${fields.organisation}`
    : fields.name;

  const subject =
    fields.requested_action === 'contact_intervene'
      ? `Snapshot: conversation requested by ${who}`
      : `Snapshot: result requested by ${who}`;

  return post({
    _subject: subject,
    // Sets the reply-to without appearing as a row in the email body.
    _replyto: fields.business_email,

    'They asked for': label(ACTION_LABEL, fields.requested_action),
    Name: fields.name,
    Email: fields.business_email,
    Organisation: fields.organisation ?? 'Not given',
    Role: fields.role_title ?? 'Not given',

    'Systems in production': label(SYSTEMS_LABEL, fields.systems ?? ''),
    'If the most consequential ran wrong for a day': label(
      CRITICALITY_LABEL,
      fields.criticality ?? '',
    ),

    'Least confident area': label(AREA_LABEL, fields.least_confident_area),
    'Their answers rest on': label(BASIS_LABEL, fields.confidence_basis),
    'Their result said': fields.headline,

    Snapshot: `${fields.question_set_version} / ${fields.copy_version}`,
  });
}

export interface AnswerDetail {
  /** Question id, for the machine-readable line. */
  id: string;
  /** The question as the visitor read it. Becomes the email label. */
  legend: string;
  /** The chosen option's semantic value. */
  value: string;
  /** The chosen option as the visitor read it. */
  label: string;
}

export interface IndexContributionFields {
  answers: AnswerDetail[];
  question_set_version: string;
  copy_version: string;
}

export function submitIndexContribution(
  fields: IndexContributionFields,
): Promise<SubmitResult> {
  // Answers only. Assert the absence of identity rather than trusting
  // the caller: anything without a question id shape is dropped.
  const answers = fields.answers.filter((a) => /^q\d{2}_[a-z_]+$/.test(a.id));

  const readable: Record<string, string> = {};
  for (const answer of answers) {
    readable[answer.legend] = answer.label || answer.value;
  }

  // One compact machine-readable line alongside the readable rows. These
  // emails are the only store until the Worker exists, so the data has
  // to survive in a form that can be tabulated later, not just read.
  const raw = answers.map((a) => `${a.id}=${a.value}`).join('; ');

  return post(
    {
      _subject: 'Index contribution',
      // Only present while sharing the contact form, which requires an
      // email field. Constant on every contribution, so it identifies
      // nobody. Drops away once INDEX_ENDPOINT is set.
      ...(INDEX_ENDPOINT ? {} : { email: INDEX_ROUTING_MARKER }),
      ...readable,
      Snapshot: `${fields.question_set_version} / ${fields.copy_version}`,
      Data: raw,
    },
    INDEX_ENDPOINT ?? FORMSPREE_ENDPOINT,
  );
}
