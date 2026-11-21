/**
 * Light or dark theme. The preference is kept on this device (it is a
 * display setting, not part of the game save) and applied as data-theme on
 * <html>, which switches the CSS variables of styles/index.css.
 */
export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

export const THEME_PREFERENCES: ThemePreference[] = ["system", "light", "dark"];

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Système",
  light: "Clair",
  dark: "Sombre",
};

const STORAGE_KEY = "offliner:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function loadThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Private browsing or storage disabled: the choice lasts for this visit.
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

export function resolveTheme(preference: ThemePreference): Theme {
  if (preference === "system") return systemPrefersDark() ? "dark" : "light";
  return preference;
}

export function applyTheme(preference: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveTheme(preference);
}

/** Calls `onChange` when the device switches between light and dark. */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
