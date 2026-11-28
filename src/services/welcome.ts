import { getLocalStorage, type KeyValueStore } from "./storageProtection";

/** Kept on the device: once the player has pressed "Jouer", the app opens directly. */
const WELCOME_DISMISSED_KEY = "offliner:welcome-dismissed";

export function hasDismissedWelcome(
  store: KeyValueStore | undefined = getLocalStorage(),
): boolean {
  try {
    return store?.getItem(WELCOME_DISMISSED_KEY) === "1";
  } catch {
    // Storage blocked (private browsing…): the welcome page shows again.
    return false;
  }
}

export function rememberWelcomeDismissed(
  store: KeyValueStore | undefined = getLocalStorage(),
): void {
  try {
    store?.setItem(WELCOME_DISMISSED_KEY, "1");
  } catch {
    // Not kept: only this visit skips the welcome page.
  }
}
