import { describe, expect, it } from "vitest";
import {
  detectInstallPlatform,
  isRunningStandalone,
} from "../../src/services/install";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1",
  ipadOS:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
  androidSamsung:
    "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36",
  instagramIOS:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.0 (iPhone16,2; iOS 18_6; fr_FR)",
  facebookAndroid:
    "Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/500.0.0.0;]",
  windowsChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
};

describe("detectInstallPlatform", () => {
  it.each([
    ["Safari on iPhone", UA.iphoneSafari, 5, "ios"],
    ["Chrome on iPhone", UA.iphoneChrome, 5, "ios"],
    ["iPad presenting itself as a Mac", UA.ipadOS, 5, "ios"],
    ["Chrome on Android", UA.androidChrome, 5, "android"],
    ["Samsung Internet", UA.androidSamsung, 5, "android"],
    ["Instagram's in-app browser", UA.instagramIOS, 5, "in-app"],
    ["Facebook's in-app browser", UA.facebookAndroid, 5, "in-app"],
    ["Chrome on Windows", UA.windowsChrome, 0, "desktop"],
    ["Safari on a Mac", UA.macSafari, 0, "desktop"],
  ])("recognises %s", (_name, userAgent, maxTouchPoints, expected) => {
    expect(detectInstallPlatform({ userAgent, maxTouchPoints })).toBe(expected);
  });
});

describe("isRunningStandalone", () => {
  const environment = (matching: string[], standalone?: boolean) => ({
    matchMedia: (query: string) => ({ matches: matching.includes(query) }),
    navigator: { standalone },
  });

  it("is false in a browser tab", () => {
    expect(isRunningStandalone(environment([]))).toBe(false);
  });

  it("is true when launched from the home screen", () => {
    expect(isRunningStandalone(environment(["(display-mode: standalone)"]))).toBe(true);
    expect(isRunningStandalone(environment(["(display-mode: fullscreen)"]))).toBe(true);
  });

  it("understands the legacy iOS flag", () => {
    expect(isRunningStandalone(environment([], true))).toBe(true);
  });
});
