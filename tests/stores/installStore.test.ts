import { afterEach, describe, expect, it, vi } from "vitest";
import {
  setupInstallTracking,
  useInstall,
  type InstallTarget,
} from "../../src/stores/installStore";

const ANDROID =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";

function createTarget(options: { standalone?: boolean } = {}) {
  const events = new EventTarget();
  const target: InstallTarget = {
    navigator: { userAgent: ANDROID, maxTouchPoints: 5 },
    matchMedia: (query: string) => ({
      matches: query === "(display-mode: standalone)" && options.standalone === true,
    }),
    addEventListener: (type, listener) => events.addEventListener(type, listener),
    removeEventListener: (type, listener) => events.removeEventListener(type, listener),
  };
  return { target, events };
}

function installPromptEvent(outcome: "accepted" | "dismissed") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn(async () => undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  return { event, prompt };
}

let teardown: (() => void) | null = null;

afterEach(() => {
  teardown?.();
  teardown = null;
  useInstall.setState({ canPrompt: false, justInstalled: false, isStandalone: false });
});

describe("installStore", () => {
  it("detects the platform and whether the app is installed", () => {
    teardown = setupInstallTracking(createTarget({ standalone: true }).target);
    expect(useInstall.getState()).toMatchObject({ platform: "android", isStandalone: true });
  });

  it("keeps the browser's install prompt for the app's own button", () => {
    const { target, events } = createTarget();
    teardown = setupInstallTracking(target);
    const { event } = installPromptEvent("accepted");

    events.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(useInstall.getState().canPrompt).toBe(true);
  });

  it("shows the prompt once and remembers an accepted installation", async () => {
    const { target, events } = createTarget();
    teardown = setupInstallTracking(target);
    const { event, prompt } = installPromptEvent("accepted");
    events.dispatchEvent(event);

    expect(await useInstall.getState().promptInstall()).toBe("accepted");
    expect(prompt).toHaveBeenCalled();
    expect(useInstall.getState()).toMatchObject({ canPrompt: false, justInstalled: true });

    expect(await useInstall.getState().promptInstall()).toBe("unavailable");
  });

  it("reports a dismissed prompt without marking the app installed", async () => {
    const { target, events } = createTarget();
    teardown = setupInstallTracking(target);
    events.dispatchEvent(installPromptEvent("dismissed").event);

    expect(await useInstall.getState().promptInstall()).toBe("dismissed");
    expect(useInstall.getState().justInstalled).toBe(false);
  });

  it("answers unavailable when the browser offered no prompt", async () => {
    teardown = setupInstallTracking(createTarget().target);
    expect(await useInstall.getState().promptInstall()).toBe("unavailable");
  });

  it("notices an installation made from the browser's own menu", () => {
    const { target, events } = createTarget();
    teardown = setupInstallTracking(target);
    events.dispatchEvent(new Event("appinstalled"));
    expect(useInstall.getState().justInstalled).toBe(true);
  });
});
