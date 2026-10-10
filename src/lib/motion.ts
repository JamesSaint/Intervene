/**
 * Motion runtime. Three jobs, all optional: the page reads fully with
 * this module absent.
 *
 * 1. Section entrances. Elements matching the reveal selector fade up
 *    once as they enter the viewport. The hidden state exists only
 *    while html[data-motion] is set (see BaseLayout), so nothing is
 *    hidden without scripts or under reduced motion.
 * 2. Disclosure closing. Native <details> opens with a CSS animation;
 *    closing needs a class so the body can fade before it collapses.
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
    const group = (e.target as Element).closest?.(REVEAL);
    if (group && !group.classList.contains('in')) { group.classList.add('in'); io.unobserve(group); pending.delete(group as HTMLElement); }
  });
  sweep();

  // Printing, and any other moment the page must be complete at once:
  // drop the opt-in and every gated element takes its resting state.
  const settle = () => {
    html.removeAttribute('data-motion');
    io.disconnect();
  };
  window.addEventListener('beforeprint', settle, { once: true });

  return () => io.disconnect();
}

export function initDisclosures(root: Document | ParentNode = document): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll<HTMLDetailsElement>('details.disclosure').forEach((d) => {
    const summary = d.querySelector(':scope > summary');
    const body = d.querySelector<HTMLElement>(':scope > .disclosure-body');
    if (!summary || !body) return;
    summary.addEventListener('click', (e) => {
      if (!d.open || reduce || d.classList.contains('closing')) return;
      e.preventDefault();
      d.classList.add('closing');
      const done = () => {
        d.classList.remove('closing');
        d.open = false;
      };
      body.addEventListener('animationend', done, { once: true });
      window.setTimeout(done, 300);
    });
  });
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
