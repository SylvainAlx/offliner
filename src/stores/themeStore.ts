import { create } from "zustand";
import {
  applyTheme,
  loadThemePreference,
  saveThemePreference,
  watchSystemTheme,
  type ThemePreference,
} from "../utils/theme";

interface ThemeStore {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useTheme = create<ThemeStore>((set) => ({
  preference: loadThemePreference(),
  setPreference: (preference) => {
    saveThemePreference(preference);
    applyTheme(preference);
    set({ preference });
  },
}));

/** Applies the saved theme before the first render and follows the device. */
export function setupTheme(): void {
  applyTheme(useTheme.getState().preference);
  watchSystemTheme(() => {
    if (useTheme.getState().preference === "system") applyTheme("system");
  });
}
