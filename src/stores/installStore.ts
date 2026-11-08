import { create } from "zustand";
import {
  detectInstallPlatform,
  isRunningStandalone,
  type InstallPlatform,
} from "../services/install";

/** Chromium's install prompt event (not part of the standard DOM types). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface InstallStore {
  platform: InstallPlatform;
  isStandalone: boolean;
  /** The browser lets the app show its own install prompt (Android, desktop Chromium). */
  canPrompt: boolean;
  justInstalled: boolean;
  promptInstall: () => Promise<InstallOutcome>;
}

// The event is kept outside the state: it is not data the UI renders, and a
// prompt can only be shown once.
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const useInstall = create<InstallStore>((set) => ({
  platform: "desktop",
  isStandalone: false,
  canPrompt: false,
  justInstalled: false,

  promptInstall: async () => {
    const event = deferredPrompt;
    if (!event) return "unavailable";

    deferredPrompt = null;
    set({ canPrompt: false });
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") set({ justInstalled: true });
    return outcome;
  },
}));

export interface InstallTarget {
  navigator: { userAgent: string; maxTouchPoints: number; standalone?: boolean };
  matchMedia: (query: string) => {
    matches: boolean;
    addEventListener?: (type: "change", listener: () => void) => void;
    removeEventListener?: (type: "change", listener: () => void) => void;
  };
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
}

/**
 * Must run before the first render: browsers fire "beforeinstallprompt" early,
 * and an event missed then is not sent again until the next visit.
 */
export function setupInstallTracking(
  target: InstallTarget = window as unknown as InstallTarget,
): () => void {
  const refreshStandalone = () =>
    useInstall.setState({ isStandalone: isRunningStandalone(target) });

  useInstall.setState({
    platform: detectInstallPlatform(target.navigator),
    isStandalone: isRunningStandalone(target),
  });

  const handlePrompt = (event: Event) => {
    // Replace the browser's own mini banner with the app's guide.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    useInstall.setState({ canPrompt: true });
  };

  const handleInstalled = () => {
    deferredPrompt = null;
    useInstall.setState({ canPrompt: false, justInstalled: true });
  };

  const standaloneQuery = target.matchMedia("(display-mode: standalone)");
  target.addEventListener("beforeinstallprompt", handlePrompt);
  target.addEventListener("appinstalled", handleInstalled);
  standaloneQuery.addEventListener?.("change", refreshStandalone);

  return () => {
    target.removeEventListener("beforeinstallprompt", handlePrompt);
    target.removeEventListener("appinstalled", handleInstalled);
    standaloneQuery.removeEventListener?.("change", refreshStandalone);
    deferredPrompt = null;
  };
}
