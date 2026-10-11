/**
 * Lightweight interface behaviour: disclosures, current-section navigation
 * and font-aware anchor settling. Evidence never waits for animation.
 */

/** CSS minification may normalise 480ms to .48s. Keep either unit
 * equivalent when using the shared CSS clock for Web Animations. */
export function motionDuration(value: string, fallback: number): number {
  const match = value.trim().match(/^(\d*\.?\d+)(ms|s)$/);
  if (!match) return fallback;
  const duration = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return Number.isFinite(duration) ? duration : fallback;
}

const REVEAL =
  'main .block > .wrap, main .block > .wrap-narrow, main .block > .wrap-reading, [data-reveal], .reveal';

/** One preference gate, refreshed on history restoration as well as changes. */
export function initMotion(): void {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => document.documentElement.toggleAttribute('data-motion', !preference.matches);
  sync();
  document.documentElement.setAttribute('data-motion-ready', '');
  preference.addEventListener('change', sync);
  window.addEventListener('pageshow', sync);
}

function motionEnabled(): boolean {
  return document.documentElement.hasAttribute('data-motion')
    && !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.hidden;
}

/** Start after font layout and a painted frame, without hiding content while waiting. */
function afterFontPaint(callback: () => void): void {
  let timeout: number;
  const bounded = new Promise<void>((resolve) => { timeout = window.setTimeout(resolve, 1200); });
  const fonts = 'fonts' in document ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, bounded]).then(() => {
    window.clearTimeout(timeout);
    requestAnimationFrame(() => requestAnimationFrame(callback));
  });
}

export function initOpening(root: Document | ParentNode = document): void {
  const hero = root.querySelector<HTMLElement>('.hero-home');
  if (!hero) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  let played = false;
  let suspended = false;
  let timer: number | undefined;
  const settle = () => {
    if (hero.hasAttribute('data-enter')) played = true;
    window.clearTimeout(timer);
    hero.removeAttribute('data-enter');
    hero.querySelectorAll<HTMLElement>('.motion-line > span, .hero-sub, .hero-actions, .hero-principle')
      .forEach((node) => node.getAnimations().forEach((animation) => animation.cancel()));
  };
  const start = () => {
    if (!ready || played || suspended || !motionEnabled()) return;
    const headline = hero.querySelector<HTMLElement>('h1');
    const bounds = headline?.getBoundingClientRect();
    // A restored scroll position or an active reader must not be pulled
    // back into an opening. The complete static heading remains available.
    if (!bounds || bounds.bottom < 88 || bounds.top >= innerHeight || hero.contains(document.activeElement)) return;
    hero.setAttribute('data-enter', '');
    const styles = getComputedStyle(hero);
    timer = window.setTimeout(settle, motionDuration(styles.getPropertyValue('--dur-enter'), 640)
      + 4 * motionDuration(styles.getPropertyValue('--stagger'), 80) + 80);
  };
  afterFontPaint(() => { ready = true; start(); });
  hero.addEventListener('animationend', (event) => {
    if ((event.target as HTMLElement).matches('.hero-principle')) settle();
  });
  hero.addEventListener('focusin', () => { played = true; settle(); });
  preference.addEventListener('change', () => { if (preference.matches) settle(); else start(); });
  window.addEventListener('pagehide', () => { suspended = true; settle(); });
  window.addEventListener('pageshow', () => { suspended = false; start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); else start(); });
  window.addEventListener('beforeprint', settle);
}

export function initReveal(root: Document | ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(REVEAL).forEach((node) => node.classList.add('in'));
  const story = /^\/(?:$|agda\/$|methodology\/$|intervention-readiness\/$|about\/$)/.test(location.pathname);
  if (!story || !('IntersectionObserver' in window)) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet<Element>();
  const headings = Array.from(root.querySelectorAll<HTMLElement>('main .block h2'));
  const evidence = Array.from(root.querySelectorAll<HTMLElement>('.fc-exceeds .fc-node, .fc-result'));
  const active = new Map<HTMLElement, Animation>();
  const cues = new Map<HTMLElement, number>();
  let ready = false;
  let suspended = false;
  const finish = () => {
    active.forEach((animation) => animation.cancel()); active.clear();
    cues.forEach((timer, node) => { window.clearTimeout(timer); node.classList.remove('is-emphasised'); }); cues.clear();
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.6 || !motionEnabled() || suspended) return;
      const node = entry.target as HTMLElement;
      observer.unobserve(node); seen.add(node);
      if (typeof node.animate !== 'function') return;
      const styles = getComputedStyle(node);
      const distance = styles.getPropertyValue('--motion-distance').trim() || '20px';
      // Keep the reveal on the compositor. An animated clip-path can
      // stutter alongside touch scrolling in Safari. Text stays readable.
      const animation = node.animate([
        { transform: `translateY(${distance})` },
        { transform: 'translateY(0)' },
      ], {
        duration: motionDuration(styles.getPropertyValue('--dur-reveal'), 560),
        easing: styles.getPropertyValue('--ease-reveal').trim() || 'ease-out',
      });
      active.set(node, animation);
      animation.finished.then(() => active.delete(node), () => active.delete(node));
    });
  }, { rootMargin: '-88px 0px -8% 0px', threshold: 0.6 });
  const evidenceObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || !motionEnabled() || suspended) return;
      const node = entry.target as HTMLElement;
      evidenceObserver.unobserve(node); seen.add(node); node.classList.add('is-emphasised');
      const styles = getComputedStyle(node);
      const clear = () => { window.clearTimeout(cues.get(node)); cues.delete(node); node.classList.remove('is-emphasised'); };
      node.addEventListener('animationend', clear, { once: true });
      cues.set(node, window.setTimeout(clear, motionDuration(styles.getPropertyValue('--dur-reveal'), 560)
        + motionDuration(styles.getPropertyValue('--dur-fast'), 160) + 80));
    });
  }, { rootMargin: '-88px 0px -8% 0px', threshold: 0.5 });
  const arm = () => {
    observer.disconnect(); evidenceObserver.disconnect();
    if (!ready || suspended || !motionEnabled()) return;
    headings.filter((node) => !seen.has(node)).forEach((node) => observer.observe(node));
    evidence.filter((node) => !seen.has(node)).forEach((node) => evidenceObserver.observe(node));
  };
  afterFontPaint(() => { ready = true; arm(); });
  preference.addEventListener('change', () => { finish(); arm(); });
  window.addEventListener('pagehide', () => { suspended = true; finish(); arm(); });
  window.addEventListener('pageshow', () => { suspended = false; requestAnimationFrame(arm); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); arm(); });
  window.addEventListener('beforeprint', finish);
  document.addEventListener('focusin', () => {
    active.forEach((animation, node) => { if (node.contains(document.activeElement)) { animation.cancel(); active.delete(node); } });
  });
}

/** Native comparison is immediate. Only the visible sequence owns autoplay. */
export function initInterventionWindows(root: Document | ParentNode = document): void {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  root.querySelectorAll<HTMLElement>('.intervention-window').forEach((instrument) => {
    const replay = instrument.querySelector<HTMLButtonElement>('[data-window-replay]');
    let timer: number | undefined;
    let observer: IntersectionObserver | undefined;
    let current: HTMLElement | null = null;
    let completed = false;
    let pending = false;
    let suspended = false;
    let width = innerWidth;
    const selected = () => instrument.querySelector<HTMLElement>(`[data-window-view="${instrument.querySelector<HTMLInputElement>('input:checked')?.value}"]`);
    const settle = (finished = false) => {
      window.clearTimeout(timer);
      current?.classList.remove('is-playing'); current = null;
      if (finished) completed = true;
    };
    const play = () => {
      settle();
      if (!motionEnabled() || suspended) return;
      const view = selected(); if (!view) return;
      pending = false; current = view;
      // Resolve the native selection and restart from the actual selected
      // geometry, including rapid changes and repeated replay.
      void view.offsetWidth; view.classList.add('is-playing');
      const styles = getComputedStyle(instrument);
      timer = window.setTimeout(() => settle(true), motionDuration(styles.getPropertyValue('--dur-trace'), 1300)
        + motionDuration(styles.getPropertyValue('--dur-signal'), 360) + 80);
    };
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && current) settle();
          if (entry.isIntersecting && entry.intersectionRatio >= 0.9 && !current && (pending || !completed)) play();
        });
      }, { rootMargin: '-88px 0px -5% 0px', threshold: [0, 0.9] });
    }
    const arm = () => {
      observer?.disconnect();
      if (replay) replay.hidden = !motionEnabled();
      if (!motionEnabled() || suspended) return;
      const sequence = selected()?.querySelector('.window-sequence');
      if (sequence) observer?.observe(sequence);
    };
    const request = () => {
      settle(); pending = true;
      const sequence = selected()?.querySelector<HTMLElement>('.window-sequence');
      const bounds = sequence?.getBoundingClientRect();
      // Explicit replay should respond even when a short viewport shows
      // only part of the sequence. Autoplay keeps its stricter threshold.
      if (!observer || (bounds && bounds.bottom > 88 && bounds.top < innerHeight * 0.95)) play();
      arm();
    };
    replay?.addEventListener('click', request);
    instrument.querySelectorAll('input').forEach((radio) => radio.addEventListener('change', request));
    instrument.addEventListener('animationend', (event) => {
      const node = event.target as HTMLElement;
      if (event.animationName.includes('window-stage') && current?.contains(node)
        && node.matches('.window-stage-4 .window-node')) settle(true);
    });
    arm();
    preference.addEventListener('change', () => { settle(); arm(); });
    window.addEventListener('resize', () => {
      // Browser chrome changes height during touch scrolling. Only a
      // width change changes the horizontal/vertical sequence geometry.
      if (innerWidth !== width) { width = innerWidth; settle(); arm(); }
    }, { passive: true });
    window.addEventListener('beforeprint', () => settle());
    window.addEventListener('pagehide', () => { suspended = true; settle(); arm(); });
    window.addEventListener('pageshow', () => { suspended = false; requestAnimationFrame(arm); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); arm(); });
  });
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
          duration: motionDuration(styles.getPropertyValue('--dur-expand'), 220),
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
  let width = innerWidth;
  window.addEventListener('resize', () => { if (innerWidth !== width) { width = innerWidth; finishAll(); } }, { passive: true });
  window.addEventListener('beforeprint', finishAll);
  window.addEventListener('pagehide', finishAll);
  preference.addEventListener('change', finishAll);
}

export function initPageNav(root: Document | ParentNode = document): () => void {
  const nav = root.querySelector<HTMLElement>('.page-nav');
  if (!nav) return () => {};
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
