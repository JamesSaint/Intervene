/**
 * Crossfade hero slides on a fixed interval.
 * Honours prefers-reduced-motion (no rotation, first slide stays).
 * Pauses when the tab is hidden.
 */
export function initHeroRotator(
  root: Document | ParentNode = document,
  intervalMs = 7_000
): () => void {
  const el = root.querySelector<HTMLElement>('[data-hero-rotator]');
  if (!el) return () => {};

  const slides = Array.from(el.querySelectorAll<HTMLElement>('[data-slide]'));
  if (slides.length < 2) return () => {};

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  let current = slides.findIndex((s) => s.classList.contains('is-active'));
  if (current < 0) current = 0;

  let timer: number | null = null;

  const setActive = (next: number) => {
    if (next === current) return;
    slides[current].classList.remove('is-active');
    slides[current].setAttribute('aria-hidden', 'true');
    slides[next].classList.add('is-active');
    slides[next].setAttribute('aria-hidden', 'false');
    current = next;
  };

  const tick = () => setActive((current + 1) % slides.length);

  const start = () => {
    stop();
    timer = window.setInterval(tick, intervalMs);
  };
  const stop = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const onVis = () => {
    if (document.hidden) stop();
    else start();
  };

  document.addEventListener('visibilitychange', onVis);
  start();

  return () => {
    stop();
    document.removeEventListener('visibilitychange', onVis);
  };
}
