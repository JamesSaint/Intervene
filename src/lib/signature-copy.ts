declare global {
  interface Window { interveneSignatureText?: string; }
}

export function resizeSignaturePreviews(): void {
  document.querySelectorAll<HTMLIFrameElement>('[data-signature-preview]').forEach(frame => {
    const resize = () => {
      if (frame.contentDocument?.body) frame.style.height = `${Math.ceil(frame.contentDocument.body.scrollHeight)}px`;
    };
    frame.addEventListener('load', () => {
      resize();
      if (frame.contentDocument?.body) new ResizeObserver(resize).observe(frame.contentDocument.body);
    });
    // The iframe may have loaded before Astro's module runs.
    if (frame.contentDocument?.readyState === 'complete') {
      resize();
      if (frame.contentDocument.body) new ResizeObserver(resize).observe(frame.contentDocument.body);
    }
  });
}

export async function copySignature(button: HTMLButtonElement): Promise<void> {
  const template = document.querySelector<HTMLTemplateElement>('[data-signature-html]');
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  const text = window.interveneSignatureText;
  if (!template || !status || !text) return;
  const html = template.innerHTML;
  button.disabled = true;
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Rich clipboard unavailable');
    // Call during the click gesture: Safari requires transient user activation.
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    })]);
    status.textContent = 'Signature copied. Paste it into Mail, then send a test email.';
  } catch {
    // Legacy rich-HTML path. No website styles or interface enter the selection.
    const target = document.createElement('div');
    target.contentEditable = 'true';
    target.innerHTML = html;
    target.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;';
    document.body.append(target);
    const selection = window.getSelection();
    const previousRanges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
    const range = document.createRange();
    range.selectNodeContents(target);
    target.focus();
    selection?.removeAllRanges();
    selection?.addRange(range);
    let copied = false;
    const onCopy = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      event.clipboardData.setData('text/html', html);
      event.clipboardData.setData('text/plain', text);
      event.preventDefault();
      copied = true;
    };
    document.addEventListener('copy', onCopy);
    try { copied = document.execCommand('copy') && copied; } catch { copied = false; }
    finally {
      document.removeEventListener('copy', onCopy);
      target.remove();
      selection?.removeAllRanges();
      previousRanges.forEach(previous => selection?.addRange(previous));
    }
    status.textContent = copied
      ? 'Signature copied. Paste it into Mail, then send a test email.'
      : 'Copy was blocked. Open the rendered signature, select its contents and copy them into Mail.';
  } finally {
    button.disabled = false;
    button.focus({ preventScroll: true });
  }
}
