/**
 * Wire the contact form to Formspree (or any AJAX endpoint).
 * Posts JSON, surfaces success / error state, disables button while pending.
 */
export function initContactForm(root: Document | ParentNode = document): () => void {
  const form = root.querySelector<HTMLFormElement>('form[data-contact]');
  if (!form) return () => {};

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
  return () => form.removeEventListener('submit', onSubmit);
}
