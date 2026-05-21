/**
 * Stagger-reveal elements marked with the .reveal class as they enter
 * the viewport. Honours prefers-reduced-motion: reduce.
 */
export function initReveal(root: Document | ParentNode = document): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = root.querySelectorAll<HTMLElement>('.reveal');
  if (!nodes.length) return () => {};

  if (reduce || !('IntersectionObserver' in window)) {
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
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
  );

  nodes.forEach((n) => io.observe(n));
  return () => io.disconnect();
}
