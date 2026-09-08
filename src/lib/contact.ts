import { track } from './snapshot/analytics';

/**
 * Wire the contact form to Formspree (or any AJAX endpoint).
 * Posts multipart FormData, surfaces success / error state, disables the
 * button while pending.
 *
 * Two analytics events are emitted here, both through the existing
 * consent-gated `track()`. `enquiry_started` fires once, on the first
 * input, so an abandoned form is distinguishable from an unseen one.
 * `enquiry_submitted` fires only after the endpoint returns ok, because a
 * click is not an enquiry. Neither carries a field value: no name, no
 * email address, no organisation, no message text.
 */
export function initContactForm(root: Document | ParentNode = document): () => void {
  const form = root.querySelector<HTMLFormElement>('form[data-contact]');
  if (!form) return () => {};

  let startedTracked = false;
  const onFirstInput = () => {
    if (startedTracked) return;
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

    const honey = form.querySelector<HTMLInputElement>('input[name="_gotcha"]');
    if (honey && honey.value) return;

    if (!form.reportValidity()) return;

    if (submit) {
      submit.disabled = true;
      submit.dataset.label = submit.textContent ?? '';
      submit.textContent = 'Sending…';
    }
    setStatus('Submitting your enquiry.', 'pending');

    try {
      const data = new FormData(form);
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
        'Submission failed. Try again, or use the contact form on a different network.',
        'err'
      );
    } finally {
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
