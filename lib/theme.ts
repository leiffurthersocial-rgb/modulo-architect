export type ThemePref = 'system' | 'light' | 'dark';

export function readTheme(): ThemePref {
  try {
    const t = localStorage.getItem('modulo:theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
  try {
    if (pref === 'system') localStorage.removeItem('modulo:theme');
    else localStorage.setItem('modulo:theme', pref);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent('modulo:theme'));
}

export function isDarkNow(): boolean {
  if (typeof document === 'undefined') return false;
  const t = document.documentElement.dataset.theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
