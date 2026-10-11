import { hasConsent, track } from './snapshot/analytics';

/** Fixed categories only. Never read labels, form text or URL query strings. */
export function initCommercialAnalytics(): void {
  const pagePath = new URL(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).pathname;
  // Consume once. Withdrawal or a mismatched destination drops the pending event.
  try {
    const pending = sessionStorage.getItem('intv-pending-cta');
    sessionStorage.removeItem('intv-pending-cta');
    if (pending && hasConsent() && pagePath === '/contact/') {
      const data = JSON.parse(pending);
      const referrer = new URL(document.referrer);
      const sourcePath = referrer.pathname.replace(/index\.html$/, '');
      if (referrer.origin === location.origin && data.cta_id === 'discuss_system' &&
          data.page_path === sourcePath && ['header', 'main'].includes(data.placement)) {
        track('primary_cta_click', { cta_id: 'discuss_system', page_path: sourcePath, placement: data.placement });
      }
    }
  } catch { /* No pending event or unavailable storage/referrer. */ }
  const offerIds = ['review', 'assessment'];
  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a');
    if (!link) return;
    if (link.dataset.primaryCta === 'discuss_system') {
      const params = {
        cta_id: 'discuss_system', page_path: pagePath,
        placement: link.closest('header.site-header') ? 'header' : 'main',
      };
      const click = event as MouseEvent;
      if (hasConsent() && !event.defaultPrevented && click.button === 0 &&
          !click.metaKey && !click.ctrlKey && !click.shiftKey && !click.altKey &&
          (!link.target || link.target === '_self')) {
        // The real tag can batch this event until after the source page unloads.
        // Carry fixed, non-personal categories to the destination, then delete.
        // No navigation delay, cookies or persistent analytics storage.
        try {
          sessionStorage.setItem('intv-pending-cta', JSON.stringify(params));
          return;
        } catch { /* Storage blocked: record on the source page as best effort. */ }
      }
      track('primary_cta_click', params);
    }
    const offer = link.dataset.offerSelect;
    if (offer && offerIds.includes(offer)) {
      track('offer_select', { offer_id: offer, selection_source: 'offer_link', page_path: pagePath });
    }
  });
  document.querySelectorAll<HTMLInputElement>('input[name="starting_point"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked && offerIds.includes(input.value)) {
        track('offer_select', { offer_id: input.value, selection_source: 'contact_choice', page_path: pagePath });
      }
    });
  });

  // The heading/caption is measurable on a phone, unlike a multi-screen section.
  // At least half visible for one continuous second, in a visible tab with consent.
  // One offering-view event per page load, even if both entry and full sheets appear.
  if (!('IntersectionObserver' in window)) return;
  let viewed = false;
  const visible = new Set<HTMLElement>();
  const timers = new Map<HTMLElement, number>();
  const cancel = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
  };
  const schedule = () => {
    cancel();
    if (viewed || !hasConsent() || document.visibilityState !== 'visible') return;
    visible.forEach((element) => {
      timers.set(element, window.setTimeout(() => {
        if (viewed || !hasConsent() || document.visibilityState !== 'visible') return;
        viewed = true;
        track('offer_view', { offer_section: element.dataset.offerView!, page_path: pagePath });
        cancel();
        observer.disconnect();
      }, 1000));
    });
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const element = entry.target as HTMLElement;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) visible.add(element);
      else visible.delete(element);
    });
    schedule();
  }, { threshold: [0, 0.5] });
  document.querySelectorAll<HTMLElement>('[data-offer-view]').forEach((element) => observer.observe(element));
  window.addEventListener('intervene:consent', schedule);
  document.addEventListener('visibilitychange', schedule);
}
