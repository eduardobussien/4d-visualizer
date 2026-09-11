const ENTER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"/></svg>`;
const EXIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3v3H3M10 3v3h3M6 13v-3H3M10 13v-3h3"/></svg>`;

/**
 * Add an "expand to fullscreen" button to a view panel. Click toggles
 * position:fixed cover of the viewport, so a chart / canvas can be
 * examined closely without leaving the page. Esc collapses.
 *
 * A synthetic window resize event fires after each toggle, so any Three.js
 * renderer or 2D canvas inside the panel picks up the new size through its
 * existing resize handler.
 */
export function attachFullscreenPanel(panel: HTMLElement): () => void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fullscreen-btn';
  btn.title = 'Expand';
  btn.setAttribute('aria-label', 'Expand panel');
  btn.innerHTML = ENTER_ICON;
  panel.appendChild(btn);

  let isFullscreen = false;

  const notifyResize = (): void => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  };

  const enter = (): void => {
    panel.classList.add('is-fullscreen');
    document.body.classList.add('has-fullscreen-panel');
    btn.innerHTML = EXIT_ICON;
    btn.title = 'Collapse (Esc)';
    btn.setAttribute('aria-label', 'Collapse panel');
    isFullscreen = true;
    notifyResize();
  };

  const exit = (): void => {
    panel.classList.remove('is-fullscreen');
    document.body.classList.remove('has-fullscreen-panel');
    btn.innerHTML = ENTER_ICON;
    btn.title = 'Expand';
    btn.setAttribute('aria-label', 'Expand panel');
    isFullscreen = false;
    notifyResize();
  };

  const toggle = (): void => {
    if (isFullscreen) exit();
    else enter();
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && isFullscreen) exit();
  };

  btn.addEventListener('click', toggle);
  window.addEventListener('keydown', onKey);

  return () => {
    btn.removeEventListener('click', toggle);
    window.removeEventListener('keydown', onKey);
    if (isFullscreen) {
      panel.classList.remove('is-fullscreen');
      document.body.classList.remove('has-fullscreen-panel');
    }
    if (btn.parentElement === panel) panel.removeChild(btn);
  };
}
