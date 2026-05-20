/**
 * Tick all elements with [data-clock] to the current UTC time.
 * Renders HH:MM UTC. Updates every 30s.
 */
export function initClock(root: Document | ParentNode = document): () => void {
  const nodes = root.querySelectorAll<HTMLElement>('[data-clock]');
  if (!nodes.length) return () => {};

  const render = () => {
    const d = new Date();
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const text = `${hh}:${mm} UTC`;
    nodes.forEach((n) => {
      n.textContent = text;
    });
  };

  render();
  const id = window.setInterval(render, 30_000);
  return () => window.clearInterval(id);
}
