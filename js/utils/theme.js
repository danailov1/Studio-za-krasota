const THEME_STORAGE_KEY = 'beauty-studio-theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function dispatchThemeChange(theme) {
  window.dispatchEvent(new CustomEvent('themechange', {
    detail: { theme }
  }));
}

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to access saved theme preference:', error);
    return null;
  }
}

export function getCurrentTheme() {
  return document.documentElement.dataset.theme || getStoredTheme() || getSystemTheme();
}

export function applyTheme(theme) {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

export function initTheme() {
  const savedTheme = getStoredTheme();
  const initialTheme = savedTheme || getSystemTheme();
  const appliedTheme = applyTheme(initialTheme);

  if (!window.__beautyStudioThemeInitialized) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', () => {
      if (getStoredTheme()) {
        return;
      }

      const nextTheme = applyTheme(getSystemTheme());
      dispatchThemeChange(nextTheme);
    });

    window.__beautyStudioThemeInitialized = true;
  }

  dispatchThemeChange(appliedTheme);
  return appliedTheme;
}

export function setTheme(theme) {
  const nextTheme = applyTheme(theme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn('Unable to save theme preference:', error);
  }

  dispatchThemeChange(nextTheme);
  return nextTheme;
}

export function toggleTheme() {
  return setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
}
