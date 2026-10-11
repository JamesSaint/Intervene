/** Serialised into the head by BaseLayout. Keep this function dependency-free. */
export function initAppearance(): void {
  const root = document.documentElement;
  const key = 'intervene:appearance';
  const system = matchMedia('(prefers-color-scheme: dark)');
  const normalise = (value: string | null): 'light' | 'dark' | 'system' =>
    value === 'light' || value === 'dark' ? value : 'system';
  const read = () => {
    try { return normalise(localStorage.getItem(key)); } catch { return 'system' as const; }
  };
  let preference = read();
  let timer: number | undefined;
  // Favicons sit in browser chrome, so follow its reported preference
  // independently of the visitor's chosen page appearance.
  const syncFavicon = () => {
    const theme = system.matches ? 'dark' : 'light';
    document.querySelector<HTMLLinkElement>('[data-appearance-icon]')?.setAttribute('href', `/assets/images/favicons/favicon-${theme}.svg`);
    document.querySelector<HTMLLinkElement>('[data-appearance-icon-fallback]')?.setAttribute('href', `/assets/images/favicons/favicon-${theme}.png`);
  };
  const syncControls = () => {
    document.querySelectorAll<HTMLButtonElement>('[data-appearance-option]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.appearanceOption === preference));
    });
    document.querySelectorAll<HTMLElement>('[data-appearance-current]').forEach(label => {
      const name = preference[0].toUpperCase() + preference.slice(1);
      label.textContent = preference === 'system' ? `System · ${system.matches ? 'Dark' : 'Light'}` : name;
    });
    document.querySelectorAll<HTMLElement>('[data-appearance-status]').forEach(status => {
      status.textContent = `Appearance: ${preference}${preference === 'system' ? `, currently ${root.dataset.theme}` : ''}`;
    });
  };
  const apply = (animate = false) => {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    if (animate && root.dataset.theme !== theme) {
      root.setAttribute('data-appearance-changing', '');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.removeAttribute('data-appearance-changing'), 260);
    }
    root.dataset.theme = theme;
    root.dataset.appearance = preference;
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    metas.forEach(meta => { meta.removeAttribute('media'); meta.content = theme === 'dark' ? '#0a0a0a' : '#ffffff'; });
    syncFavicon();
    syncControls();
  };
  apply();
  document.addEventListener('DOMContentLoaded', () => apply());
  system.addEventListener('change', () => {
    if (preference === 'system') apply(true);
    else { syncFavicon(); syncControls(); }
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { preference = read(); apply(true); }
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { preference = read(); apply(); } });
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const option = target?.closest<HTMLButtonElement>('[data-appearance-option]');
    if (option) {
      preference = normalise(option.dataset.appearanceOption ?? null);
      try { localStorage.setItem(key, preference); } catch { /* Keep the selection for this document. */ }
      apply(true);
    }
    document.querySelectorAll<HTMLDetailsElement>('[data-appearance][open]').forEach(panel => {
      if (!target || !panel.contains(target)) panel.open = false;
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const panel = (event.target as Element)?.closest<HTMLDetailsElement>('[data-appearance][open]');
    if (!panel) return;
    event.preventDefault();
    event.stopPropagation();
    panel.open = false;
    panel.querySelector<HTMLElement>('summary')?.focus();
  });
}
