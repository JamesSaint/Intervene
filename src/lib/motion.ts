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
    const line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anchor-offset')) || 88) + 8;
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
