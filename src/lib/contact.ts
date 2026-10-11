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
 */
export function initContactForm(root: Document | ParentNode = document): () => void {
  const form = root.querySelector<HTMLFormElement>('form[data-contact]');
  if (!form) return () => {};

  let pending = false;
  let startedTracked = false;
  const onFirstInput = () => {
    if (startedTracked || !hasConsent()) return;
    startedTracked = true;
    track('enquiry_started');
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
      if (startingPoint === 'review') {
        data.set('assessment_offering', 'Intervention Readiness Review');
      } else if (startingPoint === 'assessment') {
        data.set('assessment_offering', 'AGDA® Assessment');
      }
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      track('enquiry_submitted');
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
