import { hasConsent, track } from './snapshot/analytics';
import { contactEmail } from './social';

/**
 * Wire the contact form to Formspree (or any AJAX endpoint).
 * Posts multipart FormData, surfaces success / error state, disables the
 * button while pending.
 *
 * Two analytics events are emitted here, both through the existing
 * consent-gated `track()`. `enquiry_started` fires once, on the first
 * input, so an abandoned form is distinguishable from an unseen one.
 * `enquiry_submitted` fires only after the endpoint returns ok, but a
 * successful response is not proof of notification or inbox delivery.
 * Neither carries a field value: no name, no email address, no organisation, no message text.
 * A research enquiry, arriving as /contact/?enquiry=research, emits
 * `research_enquiry_started` and `research_enquiry_submitted` instead, so it
 * never counts as a commercial enquiry.
 */
export function initContactForm(root: Document | ParentNode = document): () => void {
  const form = root.querySelector<HTMLFormElement>('form[data-contact]');
  if (!form) return () => {};

  // A link from an engagement's details can name the starting point, as
  // /contact/?starting_point=review. Only the three known values select
  // anything; every other visit keeps the default, "Not sure yet". The value
  // is compared against a fixed list and never written to the page.
  const requested = new URLSearchParams(window.location.search).get('starting_point');
  if (requested && ['check', 'review', 'assessment'].includes(requested)) {
    const choice = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="starting_point"]'))
      .find((input) => input.value === requested);
    if (choice) choice.checked = true;
  }

  // A research enquiry from /research/ is routed separately: the submission
  // carries a fixed marker and subject for the inbox whatever the analytics
  // consent, and its events never join the commercial enquiry counts. The
  // value is compared against a fixed string and never written to the page.
  const research = new URLSearchParams(window.location.search).get('enquiry') === 'research';

  let pending = false;
  let startedTracked = false;
  const onFirstInput = () => {
    if (startedTracked || !hasConsent()) return;
    startedTracked = true;
    track(research ? 'research_enquiry_started' : 'enquiry_started');
  };

  const statusEl = form.querySelector<HTMLElement>('.form-status');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  const setStatus = (text: string, kind: 'ok' | 'err' | 'pending' | 'idle') => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.dataset.state = kind;
    statusEl.hidden = kind === 'idle';
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (pending) return;

    const honey = form.querySelector<HTMLInputElement>('input[name="_gotcha"]');
    if (honey && honey.value) return;

    if (!form.reportValidity()) return;

    pending = true;
    if (submit) {
      submit.disabled = true;
      submit.dataset.label = submit.textContent ?? '';
      submit.textContent = 'Sending…';
    }
    setStatus('Submitting your enquiry.', 'pending');

    try {
      const data = new FormData(form);
      const startingPoint = data.get('starting_point');
      if (startingPoint === 'check') {
        data.set('assessment_offering', 'Authority Check');
      } else if (startingPoint === 'review') {
        data.set('assessment_offering', 'Intervention Readiness Review');
      } else if (startingPoint === 'assessment') {
        data.set('assessment_offering', 'AGDA® Assessment');
      }
      if (research) {
        data.set('enquiry_type', 'research');
        data.set('subject', 'Intervene | Research enquiry');
      }
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      track(research ? 'research_enquiry_submitted' : 'enquiry_submitted');
      form.reset();
      setStatus(
        'Received. A senior advisor will respond directly within one to two working days.',
        'ok'
      );
    } catch (err) {
      setStatus(
        `Submission failed. Your details are still here. Try again, or email ${contactEmail}.`,
        'err'
      );
    } finally {
      pending = false;
      if (submit) {
        submit.disabled = false;
        submit.textContent = submit.dataset.label ?? 'Send enquiry';
      }
    }
  };

  form.addEventListener('submit', onSubmit);
  form.addEventListener('input', onFirstInput);
  return () => {
    form.removeEventListener('submit', onSubmit);
    form.removeEventListener('input', onFirstInput);
  };
}
