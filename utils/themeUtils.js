import { THEME_KEY, THEME_MODES } from '../constants/themeConstants.js';

// All functions are arrow functions and accept an optional callback
// `cb(theme)` will be called after the theme is applied so the UI can update (e.g. toggle icon).

const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null;
  }
};

const storeTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // ignore storage errors
  }
};

const prefersDark = () => (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || false;

const determineInitialTheme = () => {
  const stored = getStoredTheme();
  if (stored === THEME_MODES.DARK || stored === THEME_MODES.LIGHT) return stored;
  return prefersDark() ? THEME_MODES.DARK : THEME_MODES.LIGHT;
};

const _setToggleIcon = (theme) => {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.textContent = theme === THEME_MODES.DARK ? '☀️' : '🌙';
};

const applyTheme = (theme, cb = () => {}) => {
  const root = document.documentElement;
  if (theme === THEME_MODES.DARK) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  storeTheme(theme);
  // UI update callback and local icon update
  _setToggleIcon(theme);
  try {
    cb(theme);
  } catch (err) {
    // avoid breaking callers
    // eslint-disable-next-line no-console
    console.error('theme callback error', err);
  }
};

const toggleTheme = (cb = () => {}) => {
  const current = document.documentElement.classList.contains('dark') ? THEME_MODES.DARK : THEME_MODES.LIGHT;
  const next = current === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;
  applyTheme(next, cb);
};

// Initializes theme on load and wires the toggle button. Accepts optional callback cb(theme).
const initTheme = (cb = () => {}) => {
  const initial = determineInitialTheme();
  applyTheme(initial, cb);

  // Wire toggle button (if present). Use DOMContentLoaded to be safe in case button is later in DOM.
  const wireButton = () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme(cb);
    });
    // ensure icon matches current
    _setToggleIcon(document.documentElement.classList.contains('dark') ? THEME_MODES.DARK : THEME_MODES.LIGHT);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireButton);
  } else {
    wireButton();
  }

  // react to system preference changes only when user hasn't explicitly stored a preference
  if (window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const stored = getStoredTheme();
        if (!stored) {
          applyTheme(e.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT, cb);
        }
      });
    } catch (e) {
      // some older browsers use addListener
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addListener((m) => {
          const stored = getStoredTheme();
          if (!stored) applyTheme(m.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT, cb);
        });
      } catch (_) {
        // ignore
      }
    }
  }
};

export { getStoredTheme, storeTheme, applyTheme, toggleTheme, initTheme };
