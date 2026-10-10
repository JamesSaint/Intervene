/**
 * Motion runtime. Four jobs, all optional: the page reads fully with
 * this module absent.
 *
 * 1. Section entrances. Elements matching the reveal selector fade up
 *    once as they enter the viewport. The hidden state exists only
 *    while html[data-motion] is set (see BaseLayout), so nothing is
 *    hidden without scripts or under reduced motion.
 * 2. Disclosure expansion. Native <details> remains the fallback;
 *    optional body animation smooths opening and closing without
 *    delaying summary focus or leaving collapsed links focusable.
 * 3. On-this-page navigation. Marks the section currently in view.
 * 4. Anchor settling. A page opened at a fragment scrolls to it before
 *    the web font arrives; when the font swaps in, the content above
 *    changes height and the target drifts under the header. Once fonts
 *    are ready the target is scrolled to again, unless the reader has
 *    already moved.
 */

const REVEAL =
  'main .block > .wrap, main .block > .wrap-narrow, main .block > .wrap-reading, [data-reveal], .reveal';

export function initReveal(root: Document | ParentNode = document): () => void {
  const html = document.documentElement;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(REVEAL));
  if (!nodes.length) return () => {};

  const motion = html.hasAttribute('data-motion') && 'IntersectionObserver' in window;
  if (!motion) {
    nodes.forEach((n) => n.classList.add('in'));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    // Fire a little before the element's top reaches the bottom edge,
    // so the entrance is under way as the reader arrives, not after.
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
  );

  nodes.forEach((n) => io.observe(n));

  // Second opinion. If the observer misses an element (a browser quirk,
  // a jump the observer has not caught up with), a scroll or resize
  // sweep reveals anything whose top is inside the viewport.
  let pending = new Set(nodes);
  let raf = 0;
  const sweep = () => {
    raf = 0;
    const limit = window.innerHeight * 1.05;
    pending.forEach((n) => {
      if (n.classList.contains('in')) { pending.delete(n); return; }
      const r = n.getBoundingClientRect();
      if (r.top < limit && r.bottom > 0) { n.classList.add('in'); io.unobserve(n); pending.delete(n); }
    });
    if (!pending.size) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(sweep); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('focusin', (e) => {
    let group = (e.target as Element).closest(REVEAL);
    while (group) {
      if (!group.classList.contains('in')) { group.classList.add('in'); io.unobserve(group); pending.delete(group as HTMLElement); }
      group = group.parentElement?.closest(REVEAL) ?? null;
    }
  });
  sweep();

  // Printing, and any other moment the page must be complete at once:
  // drop the opt-in and every gated element takes its resting state.
  const settle = () => {
    html.removeAttribute('data-motion');
    io.disconnect();
  };
  window.addEventListener('beforeprint', settle, { once: true });
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change', () => { if (preference.matches) settle(); });

  return () => io.disconnect();
}

export function initDisclosures(root: Document | ParentNode = document): void {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finishers: Array<() => void> = [];

  root.querySelectorAll<HTMLDetailsElement>('details[data-disclosure]').forEach((details) => {
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    const body = details.querySelector<HTMLElement>(':scope > [data-disclosure-body]');
    if (!summary || !body || typeof body.animate !== 'function' || !('inert' in body)) return;

    let animation: Animation | null = null;
    let expanded = details.open;
    const finish = () => {
      const previous = animation;
      animation = null;
      previous?.cancel();
      details.open = expanded;
      body.inert = false;
      delete details.dataset.disclosureState;
    };
    finishers.push(() => { if (animation) finish(); });

    summary.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      // Snapshot the visible height before cancelling an interrupted
      // transition. Rapid toggles reverse from here, never from zero.
      const height = details.open ? body.getBoundingClientRect().height : 0;
      expanded = animation ? !expanded : !details.open;
      const previous = animation;
      animation = null;
      previous?.cancel();
      event.preventDefault();

      if (preference.matches || !document.documentElement.hasAttribute('data-motion')) {
        finish();
        return;
      }

      // Keep native contents rendered until closing completes. Inert
      // removes closing links from both focus and the accessibility tree.
      if (!expanded && body.contains(document.activeElement)) summary.focus();
      details.open = true;
      body.inert = !expanded;
      details.dataset.disclosureState = expanded ? 'open' : 'closed';
      const destination = expanded ? body.getBoundingClientRect().height : 0;
      const styles = getComputedStyle(body);
      const current = body.animate(
        [{ height: `${height}px` }, { height: `${destination}px` }],
        {
          duration: parseFloat(styles.getPropertyValue('--dur-expand')) || 220,
          easing: styles.getPropertyValue('--ease-out').trim() || 'ease-out',
        }
      );
      animation = current;
      current.finished.then(() => { if (animation === current) finish(); }, () => {});
    });

    // A contents link must reach its target against the settled layout.
    // Likewise, resizing or changing motion preference clears all fixed
    // heights rather than clipping text at a former viewport width.
    body.addEventListener('focusin', () => { if (animation) finish(); });
    body.addEventListener('click', () => { if (animation) finish(); });
  });

  const finishAll = () => finishers.forEach((finish) => finish());
  window.addEventListener('resize', finishAll, { passive: true });
  window.addEventListener('beforeprint', finishAll);
  window.addEventListener('pagehide', finishAll);
  preference.addEventListener('change', finishAll);
}

export function initPageNav(root: Document | ParentNode = document): () => void {
  const nav = root.querySelector<HTMLElement>('.page-nav');
  if (!nav || !('IntersectionObserver' in window)) return () => {};
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
  const targets = links
    .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    .filter((el): el is HTMLElement => !!el);
  if (!targets.length) return () => {};

  const setCurrent = (id: string) => {
    links.forEach((a) => {
      const on = a.hash.slice(1) === id;
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  // The current section is the last one whose top has passed the
  // header line. Computed on scroll from the observer's snapshot so
  // short sections near the end of the page still register.
  let ticking = false;
  const update = () => {
    ticking = false;
    // Resolve calc() through the target's computed scroll margin. Reading
    // the custom property directly returns the unevaluated expression.
    const line = (parseFloat(getComputedStyle(targets[0]).scrollMarginTop) || 88) + 8;
    let current = targets[0].id;
    for (const t of targets) {
      if (t.getBoundingClientRect().top <= line) current = t.id;
    }
    setCurrent(current);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
  return () => window.removeEventListener('scroll', onScroll);
}

export function initAnchorSettle(): void {
  if (!location.hash || !('fonts' in document)) return;
  const id = decodeURIComponent(location.hash.slice(1));
  const target = document.getElementById(id);
  if (!target) return;
  // Any deliberate movement cancels the correction: wheel, touch, a key,
  // a pointer on the scrollbar, or focus moving to another element.
  let moved = false;
  const onMove = () => { moved = true; };
  const events: Array<[string, AddEventListenerOptions]> = [
    ['wheel', { passive: true, once: true }],
    ['touchstart', { passive: true, once: true }],
    ['keydown', { once: true }],
    ['pointerdown', { passive: true, once: true }],
    ['focusin', { once: true }],
  ];
  events.forEach(([name, opts]) => window.addEventListener(name, onMove, opts));
  const settle = (last: boolean) => {
    if (last) events.forEach(([name]) => window.removeEventListener(name, onMove));
    if (moved) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
  };
  // Two frames after the fonts resolve, so the swapped layout is the
  // one being scrolled to; then once more after a beat for a late swap.
  // The cancel listeners stay live until the last correction.
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => settle(false)));
    window.setTimeout(() => settle(true), 400);
  });
}
